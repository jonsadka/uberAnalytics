///////////////////////////////////////////////////////////////////
//SETUP PAGE VARIABLES AND USER INPUTS/////////////////////////////
var width = window.innerWidth,
    height = window.innerHeight;


var e = document.getElementById("dayofweek");
var userDay = e.options[e.selectedIndex].value;
var e = document.getElementById("startLoc");
var startLocation = e.options[e.selectedIndex].value;
var e = document.getElementById("endLoc");
var endLocation = e.options[e.selectedIndex].value;

var user = {
  startLoc: startLocation,
  endLoc: endLocation,
  carType: 'uberX',
  day: userDay
};

var graphSize = {
  fareHeight: .70,
  surgeHeight: .20,
  graphWidth: 1.0
};

///////////////////////////////////////////////////////////////////
//IMPORT DATA//////////////////////////////////////////////////////
var updateData = function(userInputs){ 
  d3.json("data/data.json", function(error, data){
    if (error) return console.warn(error);

    var currentCar = chooseCar(userInputs.carType);
    var filteredData = [];
    var dataValues = {
      totalPoints: 0,
      surgeMax: 0,
      priceMin: +data[1].prices[currentCar].low_estimate,
      priceMax: 0
    };

    var fullFormat = d3.time.format("%Y-%m-%dT%H:%M:%S%Z");

    for (var i = 0, size = data.length;  i < size; i++){
      var start = data[i].start;
      var end = data[i].end;
      var fullDate = fullFormat.parse(data[i].date.substring(0,22) + data[i].date.substring(23,25));
      if ( start === userInputs.startLoc && end === userInputs.endLoc && userInputs.day === fullDate.toString().substring(0,3) ){
        var prices = data[i].prices[currentCar];
        if ( dataValues.surgeMax < prices.surge_multiplier ) dataValues.surgeMax = +prices.surge_multiplier;
        if ( dataValues.priceMin > prices.low_estimate ) dataValues.priceMin = +prices.low_estimate;
        if ( dataValues.priceMax < prices.high_estimate ) dataValues.priceMax = +prices.high_estimate;
        dataValues.totalPoints++;
        filteredData.push(data[i]);
      }
    }

    filteredData = sortDates(filteredData);

    console.log(dataValues);
    visualize(filteredData, dataValues, currentCar);
  }); 
};

///////////////////////////////////////////////////////////////////
//SETUP PAGE ELEMENTS//////////////////////////////////////////////
function visualize(someData, extremeValues, car) {

  //INITIALIZE SPECIFIC DATA///////////////////////////////////////
  var leftPadding = 25;
  var rightPadding = 25;
  var topPadding = 25;
  var bottomPadding = 25;
  var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%S%Z");
  var startTime = timeFormat.parse( someData[0].date.substring(0,22) + someData[0].date.substring(23,25) );
  var endTime = timeFormat.parse( someData[extremeValues.totalPoints-1].date.substring(0,22) + someData[extremeValues.totalPoints-1].date.substring(23,25) );

  var surgeBarWidth = (width * graphSize.graphWidth - rightPadding - leftPadding) / extremeValues.totalPoints;

  var scales = {
    surgeBarHeight: d3.scale.linear().domain([0, extremeValues.surgeMax])
                                     .range([0, height * graphSize.surgeHeight - bottomPadding]),
    
    fareX: d3.scale.linear().domain([0, extremeValues.totalPoints])
                            .range([0, width * graphSize.graphWidth - rightPadding - leftPadding]),                                  
    
    fareY: d3.scale.linear().domain([extremeValues.priceMin - 10, extremeValues.priceMax + 5])
                            .range([height * graphSize.fareHeight - topPadding, 0]),
    
    graphWidth: d3.time.scale().domain([startTime, endTime])
                               .range([0, width * graphSize.graphWidth - rightPadding - leftPadding])
  };

  //CREATE CANVAS//////////////////////////////////////////////////
  var svg = d3.select(".content").append("svg")
                                 .attr("width", width)
                                 .attr("height", height);

  //CREATE AXIS/////////////////////////////////////////////////////
  var fareAxis = d3.svg.axis().scale(scales.fareY).orient("left").ticks(10);
  var surgeAxis = d3.svg.axis().scale(scales.surgeBarHeight).orient("left").ticks(4);
  var xTicks = (extremeValues.totalPoints/4 < 24) ? extremeValues.totalPoints/4 : 24;
  var xAxis = d3.svg.axis().scale(scales.graphWidth).orient("top").ticks( xTicks );

  svg.append("g").attr("class", "axis")
                 .attr("transform", "translate(" + 25 + "," + 0 + ")").call(fareAxis);
  svg.append("g").attr("class", "axis")
                 .attr("transform", "translate(" + 25 + "," + (height * graphSize.fareHeight - topPadding) + ")").call(surgeAxis);
  svg.append("g").attr("class", "axis")
                 .attr("transform", "translate(" + 25 + "," + (height * graphSize.fareHeight - topPadding) + ")").call(xAxis);

  //CREATE FARE CHART//////////////////////////////////////////////
  
  var followTraceLine = d3.svg.line().x( function(d) { return d.mouseX; })
                                     .y( function(d,i) { return d.Line; });
  var traceLine = svg.append("svg:path").attr("class", "traceline");

  svg.on('mousemove', function(){
    var loc = d3.mouse(this);
    mouse = { x: loc[0], y: loc[1] };
    if ( mouse.x > leftPadding && mouse.x < width - rightPadding){
      traceLine.attr("d", followTraceLine([{mouseX: mouse.x, Line:0}, 
                                           {mouseX: mouse.x, Line:height * graphSize.fareHeight - topPadding},
                                           // {mouseX: mouse.x, Line:height * graphSize.fareHeight - topPadding}, 
                                           {mouseX: mouse.x, Line:height * (graphSize.fareHeight + graphSize.surgeHeight) - topPadding - bottomPadding }]));
    }
  });

  var minValueline = d3.svg.line().interpolate("basis") 
                        .x(function(d,i) { 
                          var thisTime = timeFormat.parse( d.date.substring(0,22) + d.date.substring(23,25) );
                          return scales.graphWidth(thisTime) + leftPadding;
                        })
                        .y(function(d) { 
                          var minValue = d.prices[car].low_estimate;
                          return scales.fareY(minValue); 
                        });
  var minLine = svg.append("svg:path").attr("d", minValueline(someData)).attr("class", "fareline");

  var maxValueline = d3.svg.line().interpolate("basis") 
                        .x(function(d,i) { 
                          var thisTime = timeFormat.parse( d.date.substring(0,22) + d.date.substring(23,25) );
                          return scales.graphWidth(thisTime) + leftPadding;
                        })
                        .y(function(d) { 
                          var maxValue = d.prices[car].high_estimate;
                          return scales.fareY(maxValue); 
                        });
  var maxLine = svg.append("svg:path").attr("d", maxValueline(someData)).attr("class", "fareline");

  //CREATE DATADOTS////////////////////////////////////////////////
  var dataDots = svg.selectAll("circle").data(someData).enter()
                .append("circle")
                .attr("cx", function(d,i){
                  var thisTime = timeFormat.parse( d.date.substring(0,22) + d.date.substring(23,25) );
                  return scales.graphWidth(thisTime) + leftPadding;
                })
                .attr("cy", topPadding)
                .attr("r", 1)


  //CREATE SURGE BARS//////////////////////////////////////////////
  var surgeBars = svg.selectAll("rect").data(someData).enter()
                     .append("rect")
                     .attr("class", "surgeBars")
                     .attr("x", function(d,i){
                        var thisTime = timeFormat.parse( d.date.substring(0,22) + d.date.substring(23,25) );
                        return scales.graphWidth(thisTime) + leftPadding;
                     })
                     .attr("y", height * graphSize.fareHeight - topPadding)
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

///////////////////////////////////////////////////////////////////
//REFRESH ON CHANGE////////////////////////////////////////////////
updateData(user);

d3.select(document.getElementById("options")).on('change', 
  function(){
    var e = document.getElementById("dayofweek");
    var userDay = e.options[e.selectedIndex].value;
    var e = document.getElementById("startLoc");
    var startLocation = e.options[e.selectedIndex].value;
    var e = document.getElementById("endLoc");
    var endLocation = e.options[e.selectedIndex].value;

    var user = {
      startLoc: startLocation,
      endLoc: endLocation,
      carType: 'uberX',
      day: userDay
    };
    d3.select("svg").remove();
    updateData(user);
  }
)