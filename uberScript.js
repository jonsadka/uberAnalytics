///////////////////////////////////////////////////////////////////
//QUERY SETUP//////////////////////////////////////////////////////

//INITIALIZE KEEN//////////////////////////////////////////////////
var client = new Keen({
  projectId: "540a24ab36bca41fa980505c",
  readKey: "7d266edfa93c5aa9391ab5749c8e0ba3a08f9e1f9e74794b9808209116fca4ed3cadadfad235102244cae3e76d1101608d46c81513af814c98ed17f044b14daee38f1a7e5a69baf7f34ed4c42c7c0a2195ffcc25f2f5a8723ad0b24a69ab5e7be973d607c5cdbaeee6f5e25cc3cc0325"
});

// GET USER DATA///////////////////////////////////////////////////
var userInputs = {
  timeframe: document.getElementById("timeframe").options[document.getElementById("timeframe").selectedIndex].value,
  start: document.getElementById("startLoc").options[document.getElementById("startLoc").selectedIndex].value,
  end: document.getElementById("endLoc").options[document.getElementById("endLoc").selectedIndex].value,
  product: document.getElementById("product").options[document.getElementById("product").selectedIndex].value
};

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
  compareHeight: 0.5
};

var fareGraphHeight = height * graphPct.fareHeight - topPad - bottomPad;
var barGraphHeight = height * graphPct.surgeHeight - topPad - bottomPad;

//CREATE CANVAS//////////////////////////////////////////////////
var chartbg = d3.select(".content").append("svg")
  .attr("width", width).attr("height", height)
  .attr("class", "chartbg").attr("transform", "translate(100,100)");

var svg = d3.select(".content").append("svg")
  .attr("width", width).attr("height", height).attr("id", "graphs");

svg.append("g").attr("class", "timetext").attr("fill","white").style("text-anchor","middle")
  .selectAll(".hours").data(new Array(24))
  .enter().append("text").attr("class","hours")
  .text(function(d,i){ return i; })
  .attr("x", width / 2)
  .attr("y",function(d,i){ return i * 25 + 60; })
  .style("font-weight","100");


///////////////////////////////////////////////////////////////////
//GATHER DATA//////////////////////////////////////////////////////
var getAndRenderData = function(userInputs){
  // SETUP QUERIES
  var highEstimateQuery = new Keen.Query("average", {
    eventCollection: "newPricesCollection",
    timeframe: userInputs.timeframe,
    targetProperty: "high_estimate",
    interval: "hourly",
    filters: [{"property_name":"end","operator":"eq","property_value":userInputs.end},
              {"property_name":"start","operator":"eq","property_value":userInputs.start},
              {"property_name":"display_name","operator":"eq","property_value":userInputs.product}]
  });

  var maxEstimateQuery = new Keen.Query("maximum", {
    eventCollection: "newPricesCollection",
    timeframe: userInputs.timeframe,
    targetProperty: "high_estimate",
    filters: [{"property_name":"end","operator":"eq","property_value":userInputs.end},
              {"property_name":"start","operator":"eq","property_value":userInputs.start},
              {"property_name":"display_name","operator":"eq","property_value":userInputs.product}]
  });

  var lowEstimateQuery = new Keen.Query("average", {
    eventCollection: "newPricesCollection",
    timeframe: userInputs.timeframe,
    targetProperty: "low_estimate",
    interval: "hourly",
    filters: [{"property_name":"end","operator":"eq","property_value":userInputs.end},
              {"property_name":"start","operator":"eq","property_value":userInputs.start},
              {"property_name":"display_name","operator":"eq","property_value":userInputs.product}]
  });

  var surgeEstimateQuery = new Keen.Query("average", {
    eventCollection: "newPricesCollection",
    timeframe: userInputs.timeframe,
    targetProperty: "surge_multiplier",
    interval: "hourly",
    filters: [{"property_name":"end","operator":"eq","property_value":userInputs.end},
              {"property_name":"start","operator":"eq","property_value":userInputs.start},
              {"property_name":"display_name","operator":"eq","property_value":userInputs.product}]
  });

  var maxSurgeQuery = new Keen.Query("maximum", {
    eventCollection: "newPricesCollection",
    timeframe: userInputs.timeframe,
    targetProperty: "surge_multiplier",
    filters: [{"property_name":"end","operator":"eq","property_value":userInputs.end},
              {"property_name":"start","operator":"eq","property_value":userInputs.start},
              {"property_name":"display_name","operator":"eq","property_value":userInputs.product}]
  });

  // RUN QUERIES
  console.log('Retrieving data from server.');
  client.run([highEstimateQuery, maxEstimateQuery, lowEstimateQuery, surgeEstimateQuery, maxSurgeQuery], function(response){
    console.log('Retrieved data from server!');
    var maxEstimate = response[1].result;
    var maxSurge = response[4].result;
    var dataCollection = formatData(response[0].result, response[2].result, response[3].result);
console.log(dataCollection.MTWTF.surge)
    

    svg.append("g").attr("class", "surgeintensities")
    .selectAll(".surgeintensity").data(dataCollection.MTWTF.surge)
    .enter().append("rect").attr("class","surgeintensity")
    .attr("width", 20)
    .attr("x", width / 2)
    .attr("y",function(d,i){ return i * 25 + 60; })


  });
};

Keen.ready(function(){ getAndRenderData(userInputs); });

///////////////////////////////////////////////////////////////////
//REFRESH ON CHANGE////////////////////////////////////////////////
d3.select(document.getElementById("options")).on('change',
  function(){
    var userInputs = {
      timeframe: document.getElementById("timeframe").options[document.getElementById("timeframe").selectedIndex].value,
      start: document.getElementById("startLoc").options[document.getElementById("startLoc").selectedIndex].value,
      end: document.getElementById("endLoc").options[document.getElementById("endLoc").selectedIndex].value,
      product: document.getElementById("product").options[document.getElementById("product").selectedIndex].value
    };

    getAndRenderData(userInputs);
  }
);


///////////////////////////////////////////////////////////////////
//HELPER FUNCTIONS/////////////////////////////////////////////////
function formatData(highEstimate, lowEstimate, surgeEstimate){
  var result = { 'MTWTF':{}, 'SS':{} };
  Object.keys(result).forEach(function(daySegment){
    result[daySegment]['surge'] = [];
    result[daySegment]['minFare'] = [];
    result[daySegment]['maxFare'] = [];
    for (var i = 0; i < 24; i++){
      result[daySegment]['surge'].push([]);
      result[daySegment]['minFare'].push([]);
      result[daySegment]['maxFare'].push([]);
    }
  });

  highEstimate.forEach(function(estimate){
    var timestamp = new Date(estimate.timeframe.start);
    var day = timestamp.getDay();
    var hour = timestamp.getHours();
    if ( day === 1 ||  day === 2 || day === 3 || day === 4 || day === 5 ){
      result.MTWTF.maxFare[hour].push(estimate.value);
    } else {
      result.SS.maxFare[hour].push(estimate.value);
    }
  });

  lowEstimate.forEach(function(estimate){
    var timestamp = new Date(estimate.timeframe.start);
    var day = timestamp.getDay();
    var hour = timestamp.getHours();
    if ( day === 1 ||  day === 2 || day === 3 || day === 4 || day === 5 ){
      result.MTWTF.minFare[hour].push(estimate.value);
    } else {
      result.SS.minFare[hour].push(estimate.value);
    }
  });

  surgeEstimate.forEach(function(estimate){
    var timestamp = new Date(estimate.timeframe.start);
    var day = timestamp.getDay();
    var hour = timestamp.getHours();
    if ( day === 1 ||  day === 2 || day === 3 || day === 4 || day === 5 ){
      result.MTWTF.surge[hour].push(estimate.value);
    } else {
      result.SS.surge[hour].push(estimate.value);
    }
  });

  Object.keys(result).forEach(function(daySegment){
    Object.keys(result[daySegment]).forEach(function(dataType){
      result[daySegment][dataType] = result[daySegment][dataType].map(function(collection){
        return d3.mean(collection);
      });
    });
  });

  return result;
}
