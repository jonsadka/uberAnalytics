///////////////////////////////////////////////////////////////////
//SETUP PAGE VARIABLES AND USER INPUTS/////////////////////////////
var headHeight = 40;
var leftPad = 60;
var rightPad = 25;
var bottomPad = 15;

var width = window.innerWidth;
var height = window.innerHeight;

var graphPct = {
  fareHeight: 0.77,
  surgeHeight: 0.23,
  surgeWidth: 0.7
};

var fareGraphHeight = height * graphPct.fareHeight - headHeight - bottomPad;
var barGraphHeight = height * graphPct.surgeHeight - headHeight - bottomPad;

//CREATE CANVAS//////////////////////////////////////////////////
var chartbg = d3.select(".content").append("svg").attr("width", width)
                                     .attr("height", height)
                                     .attr("class", "chartbg")
                                     .attr("transform", "translate(100,100)");
var svg = d3.select(".content").append("svg").attr("width", width).attr("height", height).attr("id", "graphs");
// GET USER DATA///////////////////////////////////////////////////
var e = document.getElementById("dayofweek");
var userDayofInterest = e.options[e.selectedIndex].value;
var e = document.getElementById("startLoc");
var userStart = e.options[e.selectedIndex].value;
var e = document.getElementById("endLoc");
var userEnd = e.options[e.selectedIndex].value;

var userInputs = {
  startLoc: userStart,
  date: userDayofInterest,
  endLoc: userEnd
};
var url = '/data/' + userInputs.startLoc + '_' + userInputs.endLoc + '.json';

///////////////////////////////////////////////////////////////////
//IMPORT DATA//////////////////////////////////////////////////////
var renderGraphs = function(url, userParamaters){
  d3.json(url, function(err, serverJSON){
    if (err) return console.warn(err);
    
    var extremeValues = serverJSON.shift();
    var filteredJSON = filterDates(serverJSON, userParamaters);

    visualize(filteredJSON, extremeValues, userParamaters);
  });
};

///////////////////////////////////////////////////////////////////
//SETUP PAGE ELEMENTS//////////////////////////////////////////////
function visualize(data, v, userParamaters) {
  //DEFINE DATA BOUNDARY///////////////////////////////////////////
  var startTime = isoTimeConvert( data[0].date );
  var endTime = isoTimeConvert( data[data.length-1].date );

  var xScale = d3.time.scale().range([leftPad, width - leftPad]).domain([startTime, endTime]);
  var yScale = d3.scale.linear().range([fareGraphHeight, headHeight]).domain([v.uberX_priceMin - 5, v.uberX_priceMax + 5]);
  var yScaleSurge = d3.scale.linear().range([0, barGraphHeight - headHeight]).domain([0, v.uberX_surgeMax]);

  //CREATE AXIS/////////////////////////////////////////////////////
  var xTicks = (v.dataPoints/4 < 24) ? 12 : 24;
  var xAxis = d3.svg.axis().scale(xScale).orient("top").ticks( xTicks );
  var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks( height / 48 )
                           .tickFormat(function(d) { return "$" + currencyFormatter(d); });
  var yAxisSurge = d3.svg.axis().scale(yScaleSurge).orient("left").ticks(v.uberX_surgeMax);

  //CREATE FARE LINES//////////////////////////////////////////////
  var line = d3.svg.line().interpolate("step")
                        .x(function(d,i) { return xScale( isoTimeConvert(d.date) ); })
                        .y(function(d) {
                          var maxValue = d.uberX.high;
                          return yScale(maxValue);
                        });

  var maxLine = svg.append("svg:path").attr("class", "fareline max " + 'uberX' )
                                      .attr("d", line(data) );


  //CREATE FARE TOOLTIP/////////////////////////////////////////////
  var followTraceLine = d3.svg.line().x( function(d) { return d.mouseX; })
                                     .y( function(d,i) { return d.Line; });
  var traceLineX = svg.append("svg:path").attr("class", "traceline");
  var traceLineY = svg.append("svg:path").attr("class", "traceline");

  svg.on('mousemove', function(){
    var loc = d3.mouse(this);
    mouse = { x: loc[0], y: loc[1] };
    if ( mouse.x > leftPad && mouse.x < width - leftPad && mouse.y < fareGraphHeight && mouse.y > headHeight){
      traceLineX.attr("d", followTraceLine([{mouseX: mouse.x, Line:0},
                                           {mouseX: mouse.x, Line:fareGraphHeight}]));

      traceLineY.attr("d", followTraceLine([{mouseX: leftPad, Line: mouse.y},
                                           {mouseX: width - leftPad, Line: mouse.y}]));
    }
    if ( mouse.x > leftPad && mouse.x < width - rightPad && mouse.y > fareGraphHeight && mouse.y < fareGraphHeight + barGraphHeight - headHeight){
      traceLineX.attr("d", followTraceLine([{mouseX: mouse.x, Line:0},
                                           {mouseX: mouse.x, Line:mouse.y}]));

      traceLineY.attr("d", followTraceLine([{mouseX: leftPad, Line: mouse.y},
                                           {mouseX: width - leftPad, Line: mouse.y}]));
    }
  });

  //CREATE DATADOTS////////////////////////////////////////////////
  var dataDots = svg.selectAll("circle").data(data).enter()
                .append("circle")
                .attr("cx", function(d,i){ return xScale( isoTimeConvert(d.date) ); })
                .attr("cy", headHeight)
                .attr("r", 1.5)
                .attr("fill", "RGBA(241, 82, 130, 1)");

  //CREATE SURGE BARS//////////////////////////////////////////////
  var surgeBarWidth = width * graphPct.surgeWidth / v.dataPoints;
  var surgeBars = svg.selectAll("rect").data(data).enter()
                     .append("rect")
                     .attr("class", "surgeBars")
                     .attr("fill", "RGBA(241, 82, 130, 1)")
                     .attr("width", surgeBarWidth * 0.75)
                     .attr("x", function(d,i){ return xScale( isoTimeConvert(d.date) ) - surgeBarWidth/2; })
                     .attr("y", fareGraphHeight)
                     .attr("height", function(d,i){
                        var surge = d.uberX.surge;
                        return yScaleSurge(surge);
                     })
                     .transition().delay(function (d,i){ return i * 30;}).duration(30)
                     .attr("width", surgeBarWidth)
                     .attr("fill", function(d,i){
                        var surge = d.uberX.surge;
                        if (surge !== 1){
                          var opacity = (+surge/v.uberX_surgeMax * 1);
                          return "RGBA(241, 82, 130, " + opacity + ")";
                        }
                        return "RGBA(241, 82, 130, 0.1)";
                     });

  svg.selectAll(".surgeBars").on("mouseover", function(d,i){
                                d3.select(this).transition().duration(100).attr("width", function(){ return surgeBarWidth * 1.75; })
                                               .attr("x", function(d,i){ return xScale( isoTimeConvert(d.date) ) - surgeBarWidth*1.75/2; });
                                svg.append("text").transition().duration(200).attr("id", "tooltip")
                                                  .attr("x", function(){ return xScale( isoTimeConvert(d.date) ); })
                                                  .attr("y", function(){
                                                    var surge = d.uberX.surge;
                                                    return yScaleSurge(surge) + fareGraphHeight + 12;
                                                   })
                                                  .attr("text-anchor", "middle")
                                                  .attr("font-size", "12px")
                                                  .attr("fill", "white")
                                                  .attr("font-weight", "bold")
                                                  .text(d.uberX.surge);
                           })
                           .on("mouseout", function(d,i){
                              d3.select(this).transition().duration(800).attr("width", function(){ return surgeBarWidth; })
                                             .attr("x", function(d,i){ return xScale( isoTimeConvert(d.date) ) - surgeBarWidth/2; });
                              d3.select("#tooltip").remove();
                           });

  //APPEND AXIS AND LABELS//////////////////////////////////////////
  svg.append("g").attr("class", "axis fare axis--y").attr("transform", "translate(" + leftPad + "," + 0 + ")")
                 .transition().duration(300).call(yAxis);
  svg.append("g").attr("class", "axis surge axis--y").attr("transform", "translate(" + leftPad + "," + fareGraphHeight + ")")
                 .transition().duration(300).call(yAxisSurge);
  svg.append("g").attr("class", "axis axis--x").attr("transform", "translate(" + 0 + "," + fareGraphHeight + ")")
                 .transition().duration(v.dataPoints * 30).ease('cubic-in-out').call(xAxis);

  svg.append("text").transition().duration(v.dataPoints * 30)
                    .attr("class", "y label").attr("text-anchor", "end")
                    .attr("x", -headHeight)
                    .attr("y", leftPad / 4)
                    .attr("dy", ".75em")
                    .attr("transform", "rotate(-90)")
                    .attr("fill","RGBA(225,225,225,0.7)")
                    .attr("font-size", "12px")
                    .text("fare pricing");

  svg.append("text").transition().duration(v.dataPoints * 30)
                    .attr("class", "y label").attr("text-anchor", "end")
                    .attr("x", -fareGraphHeight)
                    .attr("y", leftPad / 4)
                    .attr("dy", ".75em")
                    .attr("transform", "rotate(-90)")
                    .attr("fill","RGBA(225,225,225,0.7)")
                    .attr("font-size", "12px")
                    .text("surge multiplier");
};

///////////////////////////////////////////////////////////////////
//HELPER FUNCTIONS/////////////////////////////////////////////////
var isoTimeConvert = function(time){
  var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%S%Z");
  return timeFormat.parse( time.substring(0,22) + time.substring(23,25) );
};

var filterDates = function(data, userParamaters){
  var filteredData = [];
  for (var i = 0, size = data.length;  i < size; i++){
    var start = data[i].start;
    var end = data[i].end;
    var fullDate = isoTimeConvert(data[i].date);
    if ( start === userParamaters.startLoc && end === userParamaters.endLoc && userParamaters.date === fullDate.toString().substring(0,10) ){
      filteredData.push(data[i]);
    }
  }
  return filteredData;
};

var chooseCar = function(carNumber){
  if (carNumber === 0) return 'uberX';
  if (carNumber === 1) return 'uberXL';
  if (carNumber === 2) return 'uberBLACK';
  if (carNumber === 3) return 'uberSUV';
};

var currencyFormatter = d3.format(",.0f");

///////////////////////////////////////////////////////////////////
//RENDER GRAPHS////////////////////////////////////////////////////
renderGraphs(url, userInputs);

///////////////////////////////////////////////////////////////////
//REFRESH ON CHANGE////////////////////////////////////////////////
d3.select(document.getElementById("options")).on('change',
  function(){
    var e = document.getElementById("dayofweek");
    var userDayofInterest = e.options[e.selectedIndex].value;
    var e = document.getElementById("startLoc");
    var userStart = e.options[e.selectedIndex].value;
    var e = document.getElementById("endLoc");
    var userEnd = e.options[e.selectedIndex].value;

    var userInputs = {
      startLoc: userStart,
      endLoc: userEnd,
      date: userDayofInterest
    };

    var myNode = document.getElementById("graphs");
      while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
    }

    url = '/data/' + userInputs.startLoc + '_' + userInputs.endLoc + '.json';
    renderGraphs(url, userInputs);
  }
);
