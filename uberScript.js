///////////////////////////////////////////////////////////////////
//SETUP PAGE VARIABLES AND USER INPUTS/////////////////////////////
var topPad = 40;
var mainGraphRightPad = 10;
var mainGraphLeftPad = 40;
var snippetsLeftPad = 10;
var snippetsRightPad = 10;
var bottomPad = 15;

var width = window.innerWidth;
var height = window.innerHeight;

var graphPct = {
  mainWidth: 0.8,
  snippetWidth: 0.2,
  fareHeight: 0.77,
  surgeHeight: 0.23,
  surgeWidth: 0.5,
  cityCompareHeight: 0.5
};

var fareGraphHeight = height * graphPct.fareHeight - topPad - bottomPad;
var barGraphHeight = height * graphPct.surgeHeight - topPad - bottomPad;

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

// first case used for github deployment, second case used for local testing
// var url = '/uberAnalytics/data/' + userInputs.startLoc + '_' + userInputs.endLoc + '.json';
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
// console.log(v,data)
  var startTime = isoTimeConvert( data[0].date );
  var endTime = isoTimeConvert( data[data.length-1].date );
  var maxAvg = 0;
  for (var key in v[userParamaters.date]) maxAvg = Math.max(maxAvg, v[userParamaters.date][key]);

  var xScale = d3.time.scale().range([mainGraphLeftPad, width*graphPct.mainWidth - mainGraphRightPad]).domain([startTime, endTime]);
  var xScaleSnippets = d3.scale.linear().range([0, width*graphPct.snippetWidth - snippetsLeftPad - snippetsRightPad]).domain([0, maxAvg]);
  var yScale = d3.scale.linear().range([fareGraphHeight, topPad]).domain([v.uberX_priceMin - 5, v.uberX_priceMax + 5]);
  var yScaleSurge = d3.scale.linear().range([0, barGraphHeight - topPad]).domain([0, v.uberX_surgeMax]);

  //CREATE AXIS/////////////////////////////////////////////////////
  var xTicks = (v.dataPoints/4 < 24) ? 12 : 24;
  var xAxis = d3.svg.axis().scale(xScale).orient("top").ticks( xTicks );
  var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks( height / 48 )
                           .tickFormat(function(d) { return "$" + currencyFormatter(d); });
  var yAxisSurge = d3.svg.axis().scale(yScaleSurge).orient("left").ticks(v.uberX_surgeMax);

  // DISPLAY AVERAGE PRICE PER MILE
  var currentDayCompare = svg.append('svg:g').attr('class','currentdaycompare');
  var cities = Object.keys(v[userParamaters.date]);

    currentDayCompare.selectAll('.comparebars').data(cities).enter()
      .append('rect')
      .attr('class', 'comparebars')
      .attr('width',function(d,i){
        return xScaleSnippets(v[userParamaters.date][d]);
      })
      .attr('height', 20 * graphPct.cityCompareHeight)
      .attr('y', function(d,i){
        return i * 20 + topPad;
      })
      .attr('x', width*graphPct.mainWidth + snippetsLeftPad )
      .style('fill', 'white')

      .on('mouseover', function(){
        var currentY = d3.select(this).attr('y');
        var currentX = d3.select(this).attr('x');
        currentDayCompare.append('text')
          .attr("id", "farecompare")
          .text('Rate and City to go Here')
          .attr('x', currentX)
          .attr('y', currentY - 10);
      })

      .on('mouseout', function(){
        currentDayCompare.select('#farecompare').remove();
      });

  //CREATE FARE LINES//////////////////////////////////////////////
  var line = d3.svg.line().interpolate("monotone")
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
    if ( mouse.x > mainGraphRightPad && mouse.x < width*graphPct.mainWidth - mainGraphRightPad && mouse.y < fareGraphHeight && mouse.y > topPad){
      traceLineX.attr("d", followTraceLine([{mouseX: mouse.x, Line:0},
                                           {mouseX: mouse.x, Line:fareGraphHeight}]));

      traceLineY.attr("d", followTraceLine([{mouseX: mainGraphRightPad, Line: mouse.y},
                                           {mouseX: width*graphPct.mainWidth - mainGraphRightPad, Line: mouse.y}]));
    }
    if ( mouse.x > mainGraphRightPad && mouse.x < width - mainGraphLeftPad && mouse.y > fareGraphHeight && mouse.y < fareGraphHeight + barGraphHeight - topPad){
      traceLineX.attr("d", followTraceLine([{mouseX: mouse.x, Line:0},
                                           {mouseX: mouse.x, Line:mouse.y}]));

      traceLineY.attr("d", followTraceLine([{mouseX: mainGraphRightPad, Line: mouse.y},
                                           {mouseX: width*graphPct.mainWidth - mainGraphRightPad, Line: mouse.y}]));
    }
  });

  //CREATE DATADOTS////////////////////////////////////////////////
  var dataDots = svg.append('svg:g');

      dataDots.selectAll("circle").data(data).enter()
                    .append("circle")
                    .attr("cx", function(d,i){ return xScale( isoTimeConvert(d.date) ); })
                    .attr("cy", topPad)
                    .attr("r", 1.5)
                    .attr("fill", "RGBA(241, 82, 130, 1)");

  //CREATE SURGE BARS//////////////////////////////////////////////
  var surgeBarWidth = width * graphPct.surgeWidth / data.length;
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
  svg.append("g").attr("class", "axis fare axis--y").attr("transform", "translate(" + mainGraphLeftPad + "," + 0 + ")")
                 .transition().duration(300).call(yAxis);
  svg.append("g").attr("class", "axis surge axis--y").attr("transform", "translate(" + mainGraphLeftPad + "," + fareGraphHeight + ")")
                 .transition().duration(300).call(yAxisSurge);
  svg.append("g").attr("class", "axis axis--x").attr("transform", "translate(" + 0 + "," + fareGraphHeight + ")")
                 .transition().duration(v.dataPoints * 30).ease('cubic-in-out').call(xAxis);

  svg.append("text").transition().duration(v.dataPoints * 30)
                    .attr("class", "y label").attr("text-anchor", "end")
                    .attr("x", -topPad)
                    .attr("y", mainGraphRightPad / 4)
                    .attr("dy", ".75em")
                    .attr("transform", "rotate(-90)")
                    .attr("fill","RGBA(225,225,225,0.7)")
                    .attr("font-size", "12px")
                    .text("fare pricing");

  svg.append("text").transition().duration(v.dataPoints * 30)
                    .attr("class", "y label").attr("text-anchor", "end")
                    .attr("x", -fareGraphHeight)
                    .attr("y", mainGraphRightPad / 4)
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

var getRouteDistance = function(loc1, loc2){
  // SF ROUTES
  if ( loc1 === 'pwll' && loc2 === 'warf' ) return 2;
  if ( loc1 === 'warf' && loc2 === 'pwll' ) return 2;
  if ( loc1 === 'gogp' && loc2 === 'pwll' ) return 4.1;
  if ( loc1 === 'pwll' && loc2 === 'gogp' ) return 4.1;
  if ( loc1 === 'gogp' && loc2 === 'warf' ) return 5.6;
  if ( loc1 === 'warf' && loc2 === 'gogp' ) return 5.6;

  // LA ROUTES
  if ( loc1 === 'smon' && loc2 === 'dtla' ) return 15.7;
  if ( loc1 === 'dtla' && loc2 === 'smon' ) return 15.7;
  if ( loc1 === 'hlwd' && loc2 === 'smon' ) return 11.5;
  if ( loc1 === 'smon' && loc2 === 'hlwd' ) return 11.5;
  if ( loc1 === 'dtla' && loc2 === 'hlwd' ) return 7.5;
  if ( loc1 === 'hlwd' && loc2 === 'dtla' ) return 7.5;

  // NY ROUTES
  if ( loc1 === 'grct' && loc2 === 'upma' ) return 7.2;
  if ( loc1 === 'upma' && loc2 === 'grct' ) return 7.2;
  if ( loc1 === 'brok' && loc2 === 'grct' ) return 6.2;
  if ( loc1 === 'grct' && loc2 === 'brok' ) return 6.2;
  if ( loc1 === 'brok' && loc2 === 'upma' ) return 14.5;
  if ( loc1 === 'upma' && loc2 === 'brok' ) return 14.5;
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

    // first case used for github deployment, second case used for local testing
    // url = '/uberAnalytics/data/' + userInputs.startLoc + '_' + userInputs.endLoc + '.json';
    url = '/data/' + userInputs.startLoc + '_' + userInputs.endLoc + '.json';
    renderGraphs(url, userInputs);
  }
);
