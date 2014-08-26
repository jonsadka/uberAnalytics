///////////////////////////////////////////////////////////////////
//SETUP PAGE VARIABLES AND USER INPUTS/////////////////////////////
var headHeight = 20;
var leftPad = 25;
var rightPad = 25;
var bottomPad = 15;

var width = window.innerWidth;
var height = window.innerHeight;

var graphPct = {
  fareHeight: 0.80,
  surgeHeight: 0.20,
  surgeWidth: 0.50
};

var fareGraphHeight = height * graphPct.fareHeight - headHeight - bottomPad;
var barGraphHeight = height * graphPct.surgeHeight - headHeight - bottomPad;

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
  carType: 'uberX',
  day: userDay
};

///////////////////////////////////////////////////////////////////
//IMPORT DATA//////////////////////////////////////////////////////
var updateData = function(userInputs){ 
  d3.json("data/data.json", function(error, data){
    if (error) return console.warn(error);

    var currentCar = chooseCar(userInputs.carType);
    var filteredData = [];
    var dataval = {
      totalPoints: 0,
      surgeMax: 0,
      priceMin: +data[1].prices[currentCar].low_estimate,
      priceMax: 0
    };

    for (var i = 0, size = data.length;  i < size; i++){
      var start = data[i].start;
      var end = data[i].end;
      var fullDate = isoTimeConvert(data[i]);
      if ( start === userInputs.startLoc && end === userInputs.endLoc && userInputs.day === fullDate.toString().substring(0,3) ){
        var prices = data[i].prices[currentCar];
        if ( dataval.surgeMax < prices.surge_multiplier ) dataval.surgeMax = +prices.surge_multiplier;
        if ( dataval.priceMin > prices.low_estimate ) dataval.priceMin = +prices.low_estimate;
        if ( dataval.priceMax < prices.high_estimate ) dataval.priceMax = +prices.high_estimate;
        dataval.totalPoints++;
        filteredData.push(data[i]);
      }
    }

    filteredData = sortDates(filteredData);

    console.log(dataval);
    visualize(filteredData, dataval, currentCar);
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


  //CREATE CANVAS//////////////////////////////////////////////////
  var svg = d3.select(".content").append("svg").attr("width", width).attr("height", height);

  //CREATE AXIS/////////////////////////////////////////////////////
  var fareYAxis = d3.svg.axis().scale(scales.fareY).orient("left").ticks(height / 24);
  var surgeYAxis = d3.svg.axis().scale(scales.surgeBarHeight).orient("left").ticks(4);
  var xTicks = (v.totalPoints/4 < 24) ? v.totalPoints/4 : 24;
  var xAxis = d3.svg.axis().scale(scales.graphX).orient("top").ticks( xTicks );

  svg.append("g").attr("class", "axis fare axis--y").attr("transform", "translate(" + leftPad + "," + 0 + ")").call(fareYAxis);
  svg.append("g").attr("class", "axis surge axis--y").attr("transform", "translate(" + leftPad + "," + fareGraphHeight + ")").call(surgeYAxis);
  svg.append("g").attr("class", "axis axis--x").attr("transform", "translate(" + 0 + "," + fareGraphHeight + ")").call(xAxis);

  //CREATE FARE LINES//////////////////////////////////////////////
  var minValueline = d3.svg.line().interpolate("monotone") 
                        .x(function(d,i) { return scales.graphX( isoTimeConvert(d) ); })
                        .y(function(d) { 
                          var minValue = d.prices[car].low_estimate;
                          return scales.fareY(minValue); 
                        });
  var minLine = svg.append("svg:path").attr("d", minValueline(thisdata)).attr("class", "fareline min");

  var maxValueline = d3.svg.line().interpolate("monotone") 
                        .x(function(d,i) { return scales.graphX( isoTimeConvert(d) ); })
                        .y(function(d) { 
                          var maxValue = d.prices[car].high_estimate;
                          return scales.fareY(maxValue); 
                        });
  var maxLine = svg.append("svg:path").attr("d", maxValueline(thisdata)).attr("class", "fareline max");

  //CREATE FARE CHART//////////////////////////////////////////////
  var followTraceLine = d3.svg.line().x( function(d) { return d.mouseX; })
                                     .y( function(d,i) { return d.Line; });
  var traceLine = svg.append("svg:path").attr("class", "traceline");

  svg.on('mousemove', function(){
    var loc = d3.mouse(this);
    mouse = { x: loc[0], y: loc[1] };
    if ( mouse.x > leftPad && mouse.x < width - rightPad){
      traceLine.attr("d", followTraceLine([{mouseX: mouse.x, Line:0}, 
                                           {mouseX: mouse.x, Line:fareGraphHeight},
                                           // {mouseX: mouse.x, Line:fareGraphHeight}, 
                                           {mouseX: mouse.x, Line:height * (graphPct.fareHeight + graphPct.surgeHeight) - headHeight - bottomPad }]));
    }
  });

  //CREATE DATADOTS////////////////////////////////////////////////
  var dataDots = svg.selectAll("circle").data(thisdata).enter()
                .append("circle")
                .attr("cx", function(d,i){ return scales.graphX( isoTimeConvert(d) ); })
                .attr("cy", headHeight)
                .attr("r", 1)


  //CREATE SURGE BARS//////////////////////////////////////////////
  var surgeBarWidth = width * graphPct.surgeWidth / v.totalPoints;
  var surgeBars = svg.selectAll("rect").data(thisdata).enter()
                     .append("rect")
                     .attr("class", "surgeBars")
                     .attr("x", function(d,i){ return scales.graphX( isoTimeConvert(d) ) - surgeBarWidth/2; })
                     .attr("y", fareGraphHeight)
                     .attr("width", surgeBarWidth)
                     .attr("height", function(d,i){
                        var surge = d.prices[car].surge_multiplier;
                        if ( surge !== 1 ) {
                          return scales.surgeBarHeight(surge);
                        } else {
                          return 0;
                        };
                     })
                     .attr("fill", "RGBA(26, 26, 26, 1)")
                     .append("title")
                     .text(function(d) { return "Surge is " + d.prices[car].surge_multiplier;});
}

///////////////////////////////////////////////////////////////////
//HELPER FUNCTIONS/////////////////////////////////////////////////
var chooseCar = function(carName){
  if (carName === 'uberX') return 0;
  if (carName === 'uberXL') return 1;
  if (carName === 'uberBLACK') return 2;
  if (carName === 'uberSUV') return 3;
  // if (carName === 'UberT' || 'uberTaxi' ) return 4;
}

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
            };
        };
 
        if (!hasSwap) { break; }
    }
    return list;
};

var isoTimeConvert = function(time){
  var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%S%Z");
  return timeFormat.parse( time.date.substring(0,22) + time.date.substring(23,25) );
}

///////////////////////////////////////////////////////////////////
//REFRESH ON CHANGE////////////////////////////////////////////////
updateData(user);

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
      carType: 'uberX',
      day: userDay
    };
    d3.select("svg").remove();
    updateData(user);
  }
)