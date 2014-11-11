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
var rightPad = 10;
var leftPad = 40;
var bottomPad = 15;

var width = window.innerWidth;
var height = window.innerHeight - document.getElementsByClassName('header')[0].offsetHeight;

var graphHeight = height - topPad - bottomPad;
var graphWidth = width - rightPad - leftPad;

//CREATE CANVAS//////////////////////////////////////////////////
var chartbg = d3.select(".content").append("svg").attr("class", "chartbg")
  .attr("width", width).attr("height", height)

var svg = d3.select(".content").append("svg")
  .attr("width", width).attr("height", height).attr("id", "graphs");

svg.append("g").attr("class", "timetext").attr("fill","white").style("text-anchor","middle")
  .selectAll(".hours").data(new Array(24))
  .enter().append("text").attr("class","hours")
  .text(function(d,i){ return i; })
  .attr("x", width / 2)
  .attr("y",function(d,i){ return i * 20 + 24; })
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

  // RUN QUERIES
  console.log('Retrieving data from server.');
  client.run([highEstimateQuery, lowEstimateQuery, surgeEstimateQuery], function(response){
    console.log('Retrieved data from server!');
    var dataCollection = formatData(response[0].result, response[1].result, response[2].result);
    var maxAvgSurge = dataCollection.maxAvgSurge;
    var maxAvgFare = dataCollection.maxAvgFare;

  // SURGE INTENSITIES  
    svg.append("g").attr("class", "surgeintensities--MTWT")
    .selectAll(".surgeintensity").data(dataCollection.MTWT.surge)
    .enter().append("rect").attr("class","surgeintensity")
    .attr("width", 5)
    .attr("height", 10)
    .attr("x", width / 2 + 10)
    .attr("y",function(d,i){ return i * 20 + 14; })
    .attr("fill", function(d){
      if (d > 1.25) return 'RGBA(255, 255, 255, ' + d/maxAvgSurge + ')';
    })

    svg.append("g").attr("class", "surgeintensities--FSS")
    .selectAll(".surgeintensity").data(dataCollection.FSS.surge)
    .enter().append("rect").attr("class","surgeintensity")
    .attr("width", 5)
    .attr("height", 10)
    .attr("x", width / 2 - 20)
    .attr("y",function(d,i){ return i * 20 + 14; })
    .attr("fill", function(d){
      if (d > 1.25) return 'RGBA(255, 255, 255, ' + d/maxAvgSurge + ')';
    })

  // FARE BARS
    svg.append("g").attr("class", "maxfares--MTWT")
    .selectAll(".maxfare").data(dataCollection.MTWT.maxFare)
    .enter().append("rect").attr("class","maxfare")
    .attr("width", function(d,i){ return 200 * (d / maxAvgFare) })
    .attr("height", 10)
    .attr("x", function(d,i){
      var shiftAmount = 200 * (1 - (d / maxAvgFare));
      return width / 2 - 240 + shiftAmount;
    })
    .attr("y",function(d,i){ return i * 20 + 14; })
    .attr("fill", function(d,i){
      if (d > dataCollection.FSS.maxFare[i]) return "pink";
    })

    svg.append("g").attr("class", "maxfares--FSS")
    .selectAll(".maxfare").data(dataCollection.FSS.maxFare)
    .enter().append("rect").attr("class","maxfare")
    .attr("width", function(d,i){ return 200 * (d / maxAvgFare) })
    .attr("height", 10)
    .attr("x", width / 2 + 22)
    .attr("y",function(d,i){ return i * 20 + 14; })
    .attr("fill", function(d,i){
      if (d > dataCollection.MTWT.maxFare[i]) return "pink";
    })

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
  var maxAvgSurge = 0;
  var maxAvgFare = 0;

  var result = { 'MTWT':{}, 'FSS':{} };
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
    if ( day === 1 ||  day === 2 || day === 3 || day === 4 ){
      result.MTWT.maxFare[hour].push(estimate.value);
    } else {
      result.FSS.maxFare[hour].push(estimate.value);
    }
  });

  lowEstimate.forEach(function(estimate){
    var timestamp = new Date(estimate.timeframe.start);
    var day = timestamp.getDay();
    var hour = timestamp.getHours();
    if ( day === 1 ||  day === 2 || day === 3 || day === 4 ){
      result.MTWT.minFare[hour].push(estimate.value);
    } else {
      result.FSS.minFare[hour].push(estimate.value);
    }
  });

  surgeEstimate.forEach(function(estimate){
    var timestamp = new Date(estimate.timeframe.start);
    var day = timestamp.getDay();
    var hour = timestamp.getHours();
    if ( day === 1 ||  day === 2 || day === 3 || day === 4 ){
      result.MTWT.surge[hour].push(estimate.value);
    } else {
      result.FSS.surge[hour].push(estimate.value);
    }
  });

  Object.keys(result).forEach(function(daySegment){
    Object.keys(result[daySegment]).forEach(function(dataType){
      result[daySegment][dataType] = result[daySegment][dataType].map(function(collection){
        var mean = d3.mean(collection);
        if ( dataType === 'maxFare' && mean > maxAvgFare ){
          maxAvgFare = mean;
        } else if ( dataType === 'surge' && mean > maxAvgSurge ){
          maxAvgSurge = mean;
        }
        return mean;
      });
    });
  });

  result['maxAvgSurge'] = maxAvgSurge;
  result['maxAvgFare'] = maxAvgFare;

  return result;
}
