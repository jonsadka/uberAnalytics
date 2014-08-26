///////////////////////////////////////////////////////////////////
//SETUP PAGE VARIABLES AND USER INPUTS/////////////////////////////
var width = window.innerWidth,
    height = window.innerHeight;

var user = {
  startLoc: 'pwll',
  endLoc: 'sfo',
  carType: 'uberX',
  // day = 'saturday'
};

var graphSize = {
  fareHeight: .80,
  surgeHeight: .20,
  graphWidth: 1.0
};


///////////////////////////////////////////////////////////////////
//IMPORT DATA//////////////////////////////////////////////////////
d3.json("data/data.json", function(error, data){
  if (error) return console.warn(error);

  var currentCar = chooseCar(user.carType);
  var filteredData = [];
  var dataValues = {
    totalPoints: 0,
    surgeMax: 0,
    priceMin: 0,
    priceMax: 0
  };

  for (var i = 0, size = data.length;  i < size; i++){
    var start = data[i].start;
    var end = data[i].end;
    if ( start === user.startLoc && end === user.endLoc && dataValues.totalPoints < 96){
      // Remove this bound when you figure out how to filter data by day ...........^^...
      var prices = data[i].prices[currentCar];
      if ( dataValues.surgeMax < prices.surge_multiplier ) dataValues.surgeMax = +prices.surge_multiplier;
      if ( dataValues.priceMin > prices.low_estimate ) dataValues.priceMin = +prices.low_estimate;
      if ( dataValues.priceMax < prices.high_estimate ) dataValues.priceMax = +prices.high_estimate;
      dataValues.totalPoints++;
      filteredData.push(data[i]);
    }
  }

  visualize(filteredData, dataValues, currentCar);
});


///////////////////////////////////////////////////////////////////
//SETUP PAGE ELEMENTS//////////////////////////////////////////////
function visualize(someData, extremeValues, car) {

  //INITIALIZE SPECIFIC DATA///////////////////////////////////////
  var leftPadding = 25;
  var rightPadding = 25;
  var topPadding = 25;
  var bottomPadding = 25;
  
  var surgeBarWidth = (width * graphSize.graphWidth - rightPadding - leftPadding) / extremeValues.totalPoints;

  var scales = {
    surgeBarHeight: d3.scale.linear().domain([0, extremeValues.surgeMax])
                                     .range([0, height * graphSize.surgeHeight - bottomPadding]),
    
    fareX: d3.scale.linear().domain([0, extremeValues.totalPoints])
                            .range([0, width * graphSize.graphWidth - rightPadding - leftPadding]),                                  
    
    fareY: d3.scale.linear().domain([extremeValues.priceMin, extremeValues.priceMax])
                            .range([height * graphSize.fareHeight - topPadding, 0]),
    
    graphWidth: d3.scale.linear().range([0, width * graphSize.graphWidth - rightPadding - leftPadding])
  };

  //CREATE CANVAS//////////////////////////////////////////////////
  var svg = d3.select(".content").append("svg")
                                 .attr("width", width)
                                 .attr("height", height);

  //CREATE AXIS/////////////////////////////////////////////////////
  var fareAxis = d3.svg.axis().scale(scales.fareY).orient("left").ticks(4);
  var surgeAxis = d3.svg.axis().scale(scales.surgeBarHeight).orient("left").ticks(4);
  var xAxis = d3.svg.axis().scale(scales.graphWidth).orient("top").ticks(20);

  svg.append("g").attr("class", "axis")
                 .attr("transform", "translate(" + 25 + "," + 0 + ")").call(fareAxis);
  svg.append("g").attr("class", "axis")
                 .attr("transform", "translate(" + 25 + "," + (height * graphSize.fareHeight - topPadding) + ")").call(surgeAxis);
  svg.append("g").attr("class", "axis")
                 .attr("transform", "translate(" + 25 + "," + (height * graphSize.fareHeight - topPadding) + ")").call(xAxis);

  //CREATE FARE CHART//////////////////////////////////////////////
  var minValueline = d3.svg.line().interpolate("basis") 
                        .x(function(d,i) { return scales.fareX(i) + leftPadding; })
                        .y(function(d) { 
                          var minValue = d.prices[car].low_estimate;
                          return scales.fareY(minValue); 
                        });

  var minLine = svg.append("path").attr("d", minValueline(someData))
                                  .attr("class", "fareline");

  var maxValueline = d3.svg.line().interpolate("basis") 
                        .x(function(d,i) { return scales.fareX(i) + leftPadding; })
                        .y(function(d) { 
                          var maxValue = d.prices[car].high_estimate;
                          return scales.fareY(maxValue); 
                        });

  var maxLine = svg.append("path").attr("d", maxValueline(someData))
                                  .attr("class", "fareline");

  //CREATE SURGE BARS//////////////////////////////////////////////
  var surgeBars = svg.selectAll("rect").data(someData).enter()
                     .append("rect")
                     .attr("class", "surgeBars")
                     .attr("x", function(d,i){
                        return surgeBarWidth * i;
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
  
  // figure out why this is not appending
  // var surgeBarText = svg.selectAll("text").data(someData).enter()
  //                       .append("text")
  //                       .text(function(d){
  //                         var surge = d.prices[car].surge_multiplier;
  //                         if ( surge !== 1 ) {
  //                           return surge;
  //                         }
  //                       })
  //                       .attr("x", 100)
  //                       .attr("y", 100);


  // console.log(width, height, someData[0].prices, user.carType);
}


var chooseCar = function(carName){
  if (carName === 'uberX') return 0;
  if (carName === 'uberXL') return 1;
  if (carName === 'uberBLACK') return 2;
  if (carName === 'uberSUV') return 3;
  // if (carName === 'UberT' || 'uberTaxi' ) return 4;
}
