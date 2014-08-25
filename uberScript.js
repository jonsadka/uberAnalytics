
///////////////////////////////////////////////////////////////////
//SETUP PAGE VARIABLES/////////////////////////////////////////////
var width = window.innerWidth,
    height = window.innerHeight;

var user = {
  startLoc: 'pwll',
  endLoc: 'sfo',
  carType: 'uberX'
};

var maxHeight = {
  surgeHeight: 20
}

var scales = {
  surgeBarScale: d3.scale.linear().domain([0, maxHeight.surgeHeight]).range([0, height])
};

///////////////////////////////////////////////////////////////////
//IMPORT DATA//////////////////////////////////////////////////////
d3.json("data/data.json", function(error, data){
  if (error) return console.warn(error);

  var filteredData = [];
  for (var i = 0, size = data.length;  i < size; i++){
    var start = data[i].start;
    var end = data[i].end;
    if ( start === user.startLoc && end === user.endLoc){
      filteredData.push(data[i]);
    }
  }

  visualize(filteredData);

});

///////////////////////////////////////////////////////////////////
//SETUP PAGE ELEMENTS//////////////////////////////////////////////
function visualize(someData) {
  var currentCar = chooseCar(user.carType);

  var svg = d3.select(".content").append("svg")
                                 .attr("width", width)
                                 .attr("height", height);

  /////////////////////////////////////////////////////////////////
  //SURGE BARS/////////////////////////////////////////////////////
  var surgeBars = svg.selectAll("rect").data(someData).enter()
                     .append("rect")
                     .attr("x", function(d,i){
                        return i * 5;
                     })
                     .attr("y", 0)
                     .attr("width", 20)
                     .attr("height", function(d,i){
                        var surge = d.prices[currentCar].surge_multiplier;
                        if ( surge !== 1 ) {
                          return surge * scales.surgeBarScale(surge);
                        } else {
                          return 0;
                        };
                     })
                     .attr("fill", "blue");

  var surgeBarText = svg.selectAll("text").data(someData).enter()
                         .append("text")
                         .text(function(d,i){
                            var surge = d.prices[currentCar].surge_multiplier;
                            if ( surge !== 1 ) {
                              console.log(surge)
                              return surge + '';
                            };
                         })
                         .attr("x", function(d,i){
                            return i * 5;
                         })
                         .attr("y", function(d,i){
                            var surge = d.prices[currentCar].surge_multiplier;
                            if ( surge !== 1 ) {
                              return surge * scales.surgeBarScale(surge);
                            } else {
                              return 0;
                            };
                         })
                         .attr("font-size", "11px");

  // console.log(width, height, someData[0].prices, user.carType);
}


var chooseCar = function(carName){
  if (carName === 'uberX') return 0;
}

