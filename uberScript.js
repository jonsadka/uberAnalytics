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
  surgeWidth: 0.4
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
  endLoc: userEnd,
  date: userDayofInterest
};
var url = 'http://uberanalytics.appsdeck.eu/prices/' + userInputs.startLoc + '/' + userInputs.endLoc;

///////////////////////////////////////////////////////////////////
//IMPORT DATA//////////////////////////////////////////////////////
var renderGraphs = function(url, userParamaters){
  d3.json(url, function(err, serverJSON){
    if (err) return console.warn(err);
    
    var reformattedJSON = reformatJSON(serverJSON);
    var extremeValues = reformattedJSON.shift();

    visualize(reformattedJSON, extremeValues, userParamaters);
  });
};

///////////////////////////////////////////////////////////////////
//SETUP PAGE ELEMENTS//////////////////////////////////////////////
function visualize(data, v, userParamaters) {
  //DEFINE DATA BOUNDARY///////////////////////////////////////////
  data = filterAndOrderDates(data, userParamaters);

  var startTime = data[0].date;
  var endTime = data[data.length-1].date;

  var xScale = d3.time.scale().range([leftPad, width - leftPad]).domain([startTime, endTime]);
  var yScale = d3.scale.linear().range([fareGraphHeight, headHeight]).domain([v.uberX_priceMin - 5, v.uberX_priceMax + 5]);
  var yScaleSurge = d3.scale.linear().range([0, barGraphHeight - headHeight]).domain([0, v.uberX_surgeMax]);

  //CREATE AXIS/////////////////////////////////////////////////////
  var xTicks = (v.dataPoints/4 < 24) ? 12 : 24;
  var xAxis = d3.svg.axis().scale(xScale).orient("top").ticks( xTicks );
  var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(height / 36)
                           .tickFormat(function(d) { return "$" + currencyFormatter(d); });
  var yAxisSurge = d3.svg.axis().scale(yScaleSurge).orient("left").ticks(v.uberX_surgeMax);

  //CREATE FARE LINES//////////////////////////////////////////////
  var minValueline = d3.svg.line().interpolate("basis")
                        .x(function(d,i) { return xScale( d.date ); })
                        .y(function(d) {
                          var minValue = d.uberX.low;
                          return yScale(minValue);
                        });
  var minLine = svg.append("svg:path").attr("class", "fareline min " + 'uberX' )
                                      .attr("d", minValueline(data) );

  var maxValueline = d3.svg.line().interpolate("basis")
                        .x(function(d,i) { return xScale( d.date ); })
                        .y(function(d) {
                          var maxValue = d.uberX.high;
                          return yScale(maxValue);
                        });
  var maxLine = svg.append("svg:path").attr("class", "fareline max " + 'uberX' )
                                      .attr("d", maxValueline(data) );

  //CREATE FARE TOOLTIP/////////////////////////////////////////////
  var followTraceLine = d3.svg.line().x( function(d) { return d.mouseX; })
                                     .y( function(d,i) { return d.Line; });
  var traceLine = svg.append("svg:path").attr("class", "traceline");

  svg.on('mousemove', function(){
    var loc = d3.mouse(this);
    mouse = { x: loc[0], y: loc[1] };
    if ( mouse.x > leftPad && mouse.x < width - leftPad && mouse.y < fareGraphHeight){
      traceLine.attr("d", followTraceLine([{mouseX: mouse.x, Line:0},
                                           {mouseX: mouse.x, Line:fareGraphHeight}]));
    }
    if ( mouse.x > leftPad && mouse.x < width - rightPad && mouse.y > fareGraphHeight){
      traceLine.attr("d", followTraceLine([{mouseX: mouse.x, Line:fareGraphHeight},
                                           {mouseX: mouse.x, Line:fareGraphHeight + barGraphHeight - headHeight }]));
    }
  });

  //CREATE DATADOTS////////////////////////////////////////////////
  var dataDots = svg.selectAll("circle").data(data).enter()
                .append("circle")
                .attr("cx", function(d,i){ return xScale( d.date ); })
                .attr("cy", headHeight)
                .attr("r", 1.5)
                .attr("fill", "RGBA(241, 82, 130, 1)");

  //CREATE SURGE BARS//////////////////////////////////////////////
  var surgeBarWidth = width * graphPct.surgeWidth / v.dataPoints;
  var surgeBars = svg.selectAll("rect").data(data).enter()
                     .append("rect")
                     .attr("fill", "RGBA(241, 82, 130, 1)")
                     .attr("width", surgeBarWidth * 0.75)
                     .attr("class", "surgeBars")
                     .attr("x", function(d,i){ return xScale( d.date ) - surgeBarWidth/2; })
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

  svg.selectAll("rect").on("mouseover", function(d,i){
                          d3.select(this).transition().duration(100).attr("width", function(){ return surgeBarWidth * 1.75; })
                                         .attr("x", function(d,i){ return xScale( d.date ) - surgeBarWidth*1.75/2; });
                          svg.append("text").transition().duration(200).attr("id", "tooltip")
                                            .attr("x", function(){ return xScale( d.date ); })
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
                                         .attr("x", function(d,i){ return xScale( d.date ) - surgeBarWidth/2; });
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

var reformatJSON = function(json){
  var result = [];

  var maxes = { dataPoints: json.length };

  result[0] = maxes;

  // format the data
  for ( var i = 0; i < json.length; i++){
    var currentItem = json[i];
    
    var newData = {
      start: currentItem.start,
      end: currentItem.end,
      date: isoTimeConvert( currentItem.date )

    };

    for(var j = 0; j < currentItem.prices.length; j++){
      var pricing = currentItem.prices[j];
      var product = pricing.display_name;
      if ( product !== 'uberT' && product !== 'uberTaxi' && product !== 'uberTAXI' ){
        // create sub objects for each product
        newData[product] = {};
        newData[product]['currency'] = pricing.currency_code;
        newData[product]['surge'] = +pricing.surge_multiplier;
        newData[product]['low'] = +pricing.low_estimate;
        newData[product]['high'] = +pricing.high_estimate;

        // create sub objects for each product
        // newData[product + '_currency'] = pricing.currency_code;
        // newData[product + '_surge'] = pricing.surge_multiplier;
        // newData[product + '_low'] = +pricing.low_estimate;
        // newData[product + '_high'] = +pricing.high_estimate;

        if ( !maxes[product + '_surgeMax'] ){
          maxes[product + '_surgeMax'] = +pricing.surge_multiplier;
        } else if ( maxes[product + '_surgeMax'] < +pricing.surge_multiplier ) {
          maxes[product + '_surgeMax'] = +pricing.surge_multiplier;
        }

        if ( !maxes[product + '_priceMin'] ){
          maxes[product + '_priceMin'] = +pricing.low_estimate;
        } else if ( maxes[product + '_priceMin'] > +pricing.low_estimate ) {
          maxes[product + '_priceMin'] = +pricing.low_estimate;
        }

        if ( !maxes[product + '_priceMax'] ){
          maxes[product + '_priceMax'] = +pricing.high_estimate;
        } else if ( maxes[product + '_priceMax'] < +pricing.high_estimate ) {
          maxes[product + '_priceMax'] = +pricing.high_estimate;
        }
      }
    }
    result.push( newData );
  }
  return result;
};

var orderDates = function (list) {
    var endIndex = 0,
        len = list.length - 1,
        hasSwap = true;

    for (var i = 0; i < len; i++) {
        hasSwap = false;
        for (var j = 0, swapping, endIndex = len - i; j < endIndex; j++) {
            if (list[j].date > list[j + 1].date) {
                swapping = list[j].date;
                list[j].date = list[j + 1].date;
                list[j + 1].date = swapping;
                hasSwap = true;
            }
        }

        if (!hasSwap) { break; }
    }
    return list;
};

var filterAndOrderDates = function(data, userParamaters){
  var filteredData = [];
  for (var i = 0, size = data.length;  i < size; i++){
    var start = data[i].start;
    var end = data[i].end;
    var fullDate = data[i].date;
    if ( start === userParamaters.startLoc && end === userParamaters.endLoc && userParamaters.date === fullDate.toString().substring(0,10) ){
      filteredData.push(data[i]);
    }
  }
  return orderDates(filteredData);
}

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

    url = 'http://uberanalytics.appsdeck.eu/prices/' + userInputs.startLoc + '/' + userInputs.endLoc;
    renderGraphs(url, userInputs);
  }
);
