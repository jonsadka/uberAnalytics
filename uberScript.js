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
var chartfill = d3.select(".content").append("svg").attr("width", width)
                                     .attr("height", height)
                                     .attr("class", "chartbg")
                                     .attr("transform", "translate(100,100)");
var svg = d3.select(".content").append("svg").attr("width", width).attr("height", height).attr("id", "graphs");
// GET USER DATA///////////////////////////////////////////////////
var e = document.getElementById("dayofweek");
var userDay = e.options[e.selectedIndex].value;
var e = document.getElementById("startLoc");
var userStart = e.options[e.selectedIndex].value;
var e = document.getElementById("endLoc");
var userEnd = e.options[e.selectedIndex].value;

var user = {
  startLoc: userStart,
  endLoc: userEnd,
  day: userDay
};
var url = 'http://uberanalytics.appsdeck.eu/prices/' + user.startLoc + '/' + user.endLoc;

///////////////////////////////////////////////////////////////////
//IMPORT DATA//////////////////////////////////////////////////////
var renderGraphs = function(userInputs){
  d3.json(url, function(error, data){
    if (error) return console.warn(error);

    var dataval = {
      totalPoints: 0,
      surgeMax: 0,
      priceMin: +data[1].prices[0].low_estimate,
      priceMax: 0
    };

    var uberXData = formatData(0, data, userInputs, dataval);
    dataval = uberXData[1];
    var uberXLData = formatData(1, data, userInputs, dataval);
    dataval = uberXLData[1];
    var uberBLACKData = formatData(2, data, userInputs, dataval);
    dataval = uberBLACKData[1];
    var uberSUVData = formatData(3, data, userInputs, dataval);

    visualize(uberXData[0], uberXData[1], 0);
    visualize(uberXLData[0], uberXLData[1], 1);
    visualize(uberBLACKData[0], uberBLACKData[1], 2);
    visualize(uberSUVData[0], uberSUVData[1], 3);

  });
};

///////////////////////////////////////////////////////////////////
//SETUP PAGE ELEMENTS//////////////////////////////////////////////
function visualize(thisdata, v, car) {
  //DEFINE DATA BOUNDARY///////////////////////////////////////////
  var startTime = isoTimeConvert(thisdata[0]);
  var endTime = isoTimeConvert(thisdata[v.totalPoints-1]);

  var scales = {
    surgeBarHeight: d3.scale.linear().range([0, barGraphHeight - headHeight]).domain([0, v.surgeMax]),
    fareY: d3.scale.linear().range([fareGraphHeight, headHeight]).domain([v.priceMin - 5, v.priceMax + 5]),
    graphX: d3.time.scale().range([leftPad, width - leftPad]).domain([startTime, endTime])
  };

  //CREATE AXIS/////////////////////////////////////////////////////
  var currencyFormatter = d3.format(",.0f");
  var yAxisFare = d3.svg.axis().scale(scales.fareY).orient("left")
                               .tickFormat(function(d) { return "$" + currencyFormatter(d); })
                               .ticks(height / 36);
  var yAxisSurge = d3.svg.axis().scale(scales.surgeBarHeight).orient("left")
                                .ticks(v.surgeMax);
  var xTicks = (v.totalPoints/4 < 24) ? 12 : 24;
  var xAxis = d3.svg.axis().scale(scales.graphX).orient("top").ticks( xTicks );

  //CREATE FARE LINES//////////////////////////////////////////////
  var getMinInterpolation = function(){
    var context = this;
    var interpolateScale = d3.scale.quantile()
                                   .domain([0,1])
                                   .range(d3.range(1, thisdata.length + 1));
    return function(t) {
      var flooredX = Math.floor(interpolateScale(t));
      var interpolatedLine = thisdata.slice(0, flooredX);

      if(flooredX > 0 && flooredX < thisdata.length) {
        var weight = interpolateScale(t) - flooredX;
        var weightedLineAverage = (+thisdata[flooredX].prices[car].low_estimate * weight) + (+thisdata[flooredX-1].prices[car].low_estimate * (1-weight));
        var newObj = {date:thisdata[flooredX].date, prices:[]};
        // this right here should be set to some differnet value so that it goes smoother...should be weightedLineAverage
        newObj.prices[car] = {'low_estimate':weightedLineAverage};
        interpolatedLine.push( newObj );
      }
      return context(interpolatedLine);
    };
  };

  var getMaxInterpolation = function(){
    var context = this;
    var interpolateScale = d3.scale.quantile()
                                   .domain([0,1])
                                   .range(d3.range(1, thisdata.length + 1));
    return function(t) {
      var flooredX = Math.floor(interpolateScale(t));
      var interpolatedLine = thisdata.slice(0, flooredX);

      if(flooredX > 0 && flooredX < thisdata.length) {
        var weight = interpolateScale(t) - flooredX;
        var weightedLineAverage = (+thisdata[flooredX].prices[car].high_estimate * weight) + (+thisdata[flooredX-1].prices[car].high_estimate * (1-weight));
        var newObj = {date:thisdata[flooredX].date, prices:[]};
        // this right here should be set to some differnet value so that it goes smoother...should be weightedLineAverage
        newObj.prices[car] = {'high_estimate':weightedLineAverage};
        interpolatedLine.push( newObj );
      }
      return context(interpolatedLine);
    };
  };

  var minValueline = d3.svg.line().interpolate("basis")
                        .x(function(d,i) { return scales.graphX( isoTimeConvert(d) ); })
                        .y(function(d) {
                          var minValue = d.prices[car].low_estimate;
                          return scales.fareY(minValue);
                        });
  var minLine = svg.append("svg:path").attr("class", "fareline min " + chooseCar(car) )
                                      .transition().duration(v.totalPoints * 40).delay( car * v.totalPoints * 40 + (v.totalPoints * 40/2) )
                                      .attrTween("d", getMinInterpolation.bind(minValueline) );

  var maxValueline = d3.svg.line().interpolate("basis")
                        .x(function(d,i) { return scales.graphX( isoTimeConvert(d) ); })
                        .y(function(d) {
                          var maxValue = d.prices[car].high_estimate;
                          return scales.fareY(maxValue);
                        });
  var maxLine = svg.append("svg:path").attr("class", "fareline max " + chooseCar(car) )
                                      .transition().duration(v.totalPoints * 40).delay( car * v.totalPoints * 40 )
                                      .attrTween("d", getMaxInterpolation.bind(maxValueline) );

  //CREATE FARE TOOLTIP/////////////////////////////////////////////
  var followTraceLine = d3.svg.line().x( function(d) { return d.mouseX; })
                                     .y( function(d,i) { return d.Line; });
  var traceLine = svg.append("svg:path").attr("class", "traceline");

  svg.on('mousemove', function(){
    var loc = d3.mouse(this);
    mouse = { x: loc[0], y: loc[1] };
    if ( mouse.x > leftPad && mouse.x < width - rightPad && mouse.y < fareGraphHeight){
      traceLine.attr("d", followTraceLine([{mouseX: mouse.x, Line:0},
                                           {mouseX: mouse.x, Line:fareGraphHeight}]));
    }
    if ( mouse.x > leftPad && mouse.x < width - rightPad && mouse.y > fareGraphHeight){
      traceLine.attr("d", followTraceLine([{mouseX: mouse.x, Line:fareGraphHeight},
                                           {mouseX: mouse.x, Line:fareGraphHeight + barGraphHeight - headHeight }]));
    }
  });

  //CREATE DATADOTS////////////////////////////////////////////////
  var dataDots = svg.selectAll("circle").data(thisdata).enter()
                .append("circle")
                .attr("cx", function(d,i){ return scales.graphX( isoTimeConvert(d) ); })
                .attr("cy", headHeight)
                .attr("r", 1.5)
                .attr("fill", "RGBA(241, 82, 130, 1)");

  //CREATE SURGE BARS//////////////////////////////////////////////
  if (car === 0){
    var surgeBarWidth = width * graphPct.surgeWidth / v.totalPoints;
    var surgeBars = svg.selectAll("rect").data(thisdata).enter()
                       .append("rect")
                       .attr("fill", "RGBA(241, 82, 130, 1)")
                       .attr("width", surgeBarWidth * 0.75)
                       .attr("class", "surgeBars")
                       .attr("x", function(d,i){ return scales.graphX( isoTimeConvert(d) ) - surgeBarWidth/2; })
                       .attr("y", fareGraphHeight)
                       .attr("height", function(d,i){
                          var surge = d.prices[car].surge_multiplier;
                          return scales.surgeBarHeight(surge);
                       })
                       .transition().delay(function (d,i){ return i * 30;}).duration(30)
                       .attr("width", surgeBarWidth)
                       .attr("fill", function(d,i){
                          var surge = d.prices[car].surge_multiplier;
                          if (surge !== 1){
                            var opacity = (+surge/v.surgeMax * 1);
                            return "RGBA(241, 82, 130, " + opacity + ")";
                          }
                          return "RGBA(241, 82, 130, 0.1)";
                       });

    svg.selectAll("rect").on("mouseover", function(d,i){
                            d3.select(this).transition().duration(100).attr("width", function(){ return surgeBarWidth * 1.75; })
                                           .attr("x", function(d,i){ return scales.graphX( isoTimeConvert(d) ) - surgeBarWidth*1.75/2; });
                          })
                          .on("mouseout", function(d,i){
                            d3.select(this).transition().duration(800).attr("width", function(){ return surgeBarWidth; })
                                           .attr("x", function(d,i){ return scales.graphX( isoTimeConvert(d) ) - surgeBarWidth/2; });
                          });

    //APPEND AXIS AND LABELS//////////////////////////////////////////
    svg.append("g").attr("class", "axis fare axis--y").attr("transform", "translate(" + leftPad + "," + 0 + ")")
                   .transition().duration(300).call(yAxisFare);
    svg.append("g").attr("class", "axis surge axis--y").attr("transform", "translate(" + leftPad + "," + fareGraphHeight + ")")
                   .transition().duration(300).call(yAxisSurge);
    svg.append("g").attr("class", "axis axis--x").attr("transform", "translate(" + 0 + "," + fareGraphHeight + ")")
                   .transition().duration(v.totalPoints * 30).ease('cubic-in-out').call(xAxis);

    svg.append("text").transition().duration(v.totalPoints * 30)
                      .attr("class", "y label").attr("text-anchor", "end")
                      .attr("x", -headHeight)
                      .attr("y", leftPad / 4)
                      .attr("dy", ".75em")
                      .attr("transform", "rotate(-90)")
                      .attr("fill","RGBA(225,225,225,0.7)")
                      .attr("font-size", "12px")
                      .text("fare pricing");

    svg.append("text").transition().duration(v.totalPoints * 30)
                      .attr("class", "y label").attr("text-anchor", "end")
                      .attr("x", -fareGraphHeight)
                      .attr("y", leftPad / 4)
                      .attr("dy", ".75em")
                      .attr("transform", "rotate(-90)")
                      .attr("fill","RGBA(225,225,225,0.7)")
                      .attr("font-size", "12px")
                      .text("surge multiplier");

  }

};

///////////////////////////////////////////////////////////////////
//HELPER FUNCTIONS/////////////////////////////////////////////////
var sortDates = function (list) {

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

var isoTimeConvert = function(time){
  var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%S%Z");
  return timeFormat.parse( time.date.substring(0,22) + time.date.substring(23,25) );
};

var formatData = function(carType, allData, userInputs, dataval){
  var filteredData = [];
  dataval.totalPoints = 0;
  for (var i = 0, size = allData.length;  i < size; i++){
    var start = allData[i].start;
    var end = allData[i].end;
    var fullDate = isoTimeConvert(allData[i]);
    if ( start === userInputs.startLoc && end === userInputs.endLoc && userInputs.day === fullDate.toString().substring(0,3) ){
      var prices = allData[i].prices[carType];
      if ( dataval.surgeMax < prices.surge_multiplier ) dataval.surgeMax = +prices.surge_multiplier;
      if ( dataval.priceMin > prices.low_estimate ) dataval.priceMin = +prices.low_estimate;
      if ( dataval.priceMax < prices.high_estimate ) dataval.priceMax = +prices.high_estimate;
      dataval.totalPoints++;
      filteredData.push(allData[i]);
    }
  }
  var sortedData = sortDates(filteredData);
  return [sortedData, dataval];
};

var chooseCar = function(carNumber){
  if (carNumber === 0) return 'uberX';
  if (carNumber === 1) return 'uberXL';
  if (carNumber === 2) return 'uberBLACK';
  if (carNumber === 3) return 'uberSUV';
};

///////////////////////////////////////////////////////////////////
//RENDER GRAPHS////////////////////////////////////////////////////
renderGraphs(user);

///////////////////////////////////////////////////////////////////
//REFRESH ON CHANGE////////////////////////////////////////////////
d3.select(document.getElementById("options")).on('change',
  function(){
    var e = document.getElementById("dayofweek");
    var userDay = e.options[e.selectedIndex].value;
    var e = document.getElementById("startLoc");
    var userStart = e.options[e.selectedIndex].value;
    var e = document.getElementById("endLoc");
    var userEnd = e.options[e.selectedIndex].value;

    var user = {
      startLoc: userStart,
      endLoc: userEnd,
      day: userDay
    };
    var myNode = document.getElementById("graphs");
      while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
    }
    url = 'http://uberanalytics.appsdeck.eu/prices/' + user.startLoc + '/' + user.endLoc;
    renderGraphs(user);
  }
);
