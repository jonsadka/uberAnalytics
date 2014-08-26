///////////////////////////////////////////////////////////////////
//SETUP PAGE VARIABLES AND USER INPUTS/////////////////////////////
var width = window.innerWidth,
    height = window.innerHeight;

var user = {
  startLoc: 'pwll',
  endLoc: 'sfo',
  carType: 'uberX'
};

var heightPct = {
  surgeHeight: .15
};


///////////////////////////////////////////////////////////////////
//IMPORT DATA//////////////////////////////////////////////////////
d3.json("data/data.json", function(error, data){
  if (error) return console.warn(error);

  var currentCar = chooseCar(user.carType);
  var filteredData = [];
  var extremeValues = {
    surgeMax: 0,
    priceMin: 0,
    priceMax: 0
  };

  for (var i = 0, size = data.length;  i < size; i++){
    var start = data[i].start;
    var end = data[i].end;
    if ( start === user.startLoc && end === user.endLoc){
      var prices = data[i].prices[currentCar];
      if ( extremeValues.surgeMax < prices.surge_multiplier ) extremeValues.surgeMax = prices.surge_multiplier;
      if ( extremeValues.priceMin < prices.low_estimate ) extremeValues.priceMin = prices.low_estimate;
      if ( extremeValues.priceMax < prices.high_estimate ) extremeValues.priceMax = prices.high_estimate;

      filteredData.push(data[i]);
    }
  }

  visualize(filteredData, extremeValues, currentCar);
});


///////////////////////////////////////////////////////////////////
//SETUP PAGE ELEMENTS//////////////////////////////////////////////
function visualize(someData, endValues, car) {

  //INITIALIZE SPECIFIC DATA///////////////////////////////////////
  var scales = {
    surgeBarScale: d3.scale.linear().domain([0, endValues.surgeMax]).range([0, height * heightPct.surgeHeight])
  };

  // var axis = {
  //   xAxis: d3.svg.axis()
  // }

  //CREATE CANVAS//////////////////////////////////////////////////
  var svg = d3.select(".content").append("svg")
                                 .attr("width", width)
                                 .attr("height", height);

  //CREATE SURGE BARS//////////////////////////////////////////////
  var surgeBars = svg.selectAll("rect").data(someData).enter()
                     .append("rect")
                     .attr("x", function(d,i){
                        return i * 5;
                     })
                     .attr("y", 0)
                     .attr("width", 20)
                     .attr("height", function(d,i){
                        var surge = d.prices[car].surge_multiplier;
                        if ( surge !== 1 ) {
                          return scales.surgeBarScale(surge);
                        } else {
                          return 0;
                        };
                     })
                     .attr("fill", "RGBA(26, 26, 26, 1)");

  var surgeBarText = svg.selectAll("text").data(someData).enter()
                         .append("text")
                         .text(function(d,i){
                            var surge = d.prices[car].surge_multiplier;
                            if ( surge !== 1 ) {
                              return surge;
                            };
                         })
                         .attr("x", function(d,i){
                            return i * 5;
                         })
                         .attr("y", function(d,i){
                            var surge = d.prices[car].surge_multiplier;
                            if ( surge !== 1 ) {
                              return scales.surgeBarScale(surge);
                            } else {
                              return 0;
                            };
                         })
                         .attr("font-size", "11px")
                         .attr("fill", "white");

  // console.log(width, height, someData[0].prices, user.carType);
}


var chooseCar = function(carName){
  if (carName === 'uberX') return 0;
  if (carName === 'uberXL') return 1;
  if (carName === 'uberBLACK') return 2;
  if (carName === 'uberSUV') return 3;
  // if (carName === 'UberT' || 'uberTaxi' ) return 4;
}
