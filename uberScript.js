///////////////////////////////////////////////////////////////////
//SETUP PAGE VARIABLES/////////////////////////////////////////////
var width = window.innerWidth,
    height = window.innerHeight;

var location = {
  userStart: 'pwll',
  userEnd: 'sfo'
}

var scales = {
  // scaleLatitude: d3.scale.linear().domain([-79.7576, -71.8566]).range([0, window.innerHeight]),
  // scaleLongitude: d3.scale.linear().domain([40.496, 44.9934]).range([0,  window.innerWidth])
}

///////////////////////////////////////////////////////////////////
//IMPORT DATA//////////////////////////////////////////////////////
var filteredData = [];
d3.json("data/data.json", function(error, data){
  for (var i = 0, size = data.length;  i < size; i++){
    var start = data[i].start;
    var end = data[i].end;
    if ( start === location.userStart && end === location.userEnd){
      console.log("yes!");
      filteredData.push(data[i]);
    }
  }
});

///////////////////////////////////////////////////////////////////
//SETUP PAGE ELEMENTS//////////////////////////////////////////////
var svg = d3.select("body").append("svg")
                           .attr("width", width)
                           .attr("height", height)
                           .attr("fill", "blue");

svg.selectAll("rect").data(filteredData).enter()
                     .append("rect")
                     .attr("x", 0)
                     .attr("y", 0)
                     .attr("width", 20)
                     .attr("height", 100);
// console.log(width, height);
