///////////////////////////////////////////////////////////////////
//QUERY SETUP//////////////////////////////////////////////////////

// INITIALIZE KEEN
var client = new Keen({
  projectId: "540a24ab36bca41fa980505c",
  readKey: "7d266edfa93c5aa9391ab5749c8e0ba3a08f9e1f9e74794b9808209116fca4ed3cadadfad235102244cae3e76d1101608d46c81513af814c98ed17f044b14daee38f1a7e5a69baf7f34ed4c42c7c0a2195ffcc25f2f5a8723ad0b24a69ab5e7be973d607c5cdbaeee6f5e25cc3cc0325"
});

// CAPTURE USER DATA
var userInputs = {
  timeframe: document.getElementById("timeframe").options[document.getElementById("timeframe").selectedIndex].value,
  start: document.getElementById("startLoc").options[document.getElementById("startLoc").selectedIndex].value,
  end: document.getElementById("endLoc").options[document.getElementById("endLoc").selectedIndex].value,
  product: document.getElementById("product").options[document.getElementById("product").selectedIndex].value
};

///////////////////////////////////////////////////////////////////
//SETUP PAGE VARIABLES ////////////////////////////////////////////
var topPad = 20;
var rightPad = 10;
var leftPad = 0;
var bottomPad = 0;

var width = window.innerWidth;
var height = window.innerHeight - document.getElementsByClassName('header')[0].offsetHeight;

var graphHeight = height - topPad - bottomPad;
var graphWidth = width - rightPad - leftPad;

var barHeight = 8;

// CREATE CANVAS
var chartbg = d3.select(".content").append("svg").attr("class", "chartbg")
  .attr("width", width).attr("height", height)

var svg = d3.select(".content").append("svg")
  .attr("width", width).attr("height", height).attr("id", "graphs");

// ESTABLISH SCALES
var xScale = d3.scale.linear().range([leftPad, width - leftPad - rightPad]);
var yScale = d3.scale.linear().range([topPad, height - topPad - bottomPad]).domain([0, 23]);
var surgeIntensityScale = d3.scale.ordinal().range(['rgb(247,244,249)','rgb(231,225,239)','rgb(212,185,218)','rgb(201,148,199)','rgb(223,101,176)','rgb(231,41,138)','rgb(206,18,86)','rgb(152,0,67)','rgb(103,0,31)'])
var elementSizeScale = d3.scale.ordinal().range([10,12,14]).domain([1280, 400])


// APPEND TIME LABELS
svg.append("g").attr("class", "timetext").attr("fill","white").style("text-anchor","middle")
  .selectAll(".hours").data(new Array(24))
  .enter().append("text").attr("class","hours")
  .text(function(d,i){ 
    if ( i === 12 ) return i + 'pm'
    if ( i > 12 ) return i - 12 + 'pm';
    return i + 'am';
  })
  .attr("x", graphWidth / 2 + leftPad )
  .attr("y",function(d,i){ return yScale(i) })
  .style("font-size", function(){ if (height < 400) return 10; return 12; })
  .attr("opacity",0).transition().duration(1000).delay(function(d,i){ return i * 100}).attr("opacity",1)

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

    xScale.domain([0, maxAvgFare]);
    surgeIntensityScale.domain([maxAvgFare, 1]);

    // DRAW VIEW FOR EACH SET OF DATA
    Object.keys(dataCollection).forEach(function(collection){
      if ( typeof dataCollection[collection] === 'object' ){
        // SURGE INTENSITIES  
        svg.append("g").attr("class", function(){ return "surgeintensities--" + collection; })
        .selectAll(".surgeintensity").data(dataCollection[collection].surge)
        .enter().append("rect").attr("class","surgeintensity")
        .attr("width", 6)
        .attr("height", barHeight)
        .attr("x", function(){
          var shift = collection === 'MTWT' ? 36 : -36;
          return graphWidth / 2 + leftPad + shift;
        })
        .attr("y",function(d,i){ return yScale(i) - barHeight; })
        .attr("fill", function(d){ return surgeIntensityScale(d); })
        .attr("stroke-width",1)
        .attr("stroke", function(d){ return surgeIntensityScale(d); })
        .attr("opacity",0)
        .transition().duration(1000).delay(function(d,i){ return i * 100; })
        .attr("opacity",1);

        // FARE BARS
        svg.append("g").attr("class", function(){ return "minfares--" + collection; })
          .selectAll(".maxfare").data(dataCollection[collection].minFare)
          .enter().append("rect").attr("class","minFare")
          .attr("width", function(d,i){ return 300 * (d / maxAvgFare); })
          .attr("height", barHeight)
          .attr("x", function(d){
            var shiftAmount = collection === 'MTWT' ? - 300*(d/maxAvgFare) -36 - 10 : 36 + 10;
            return graphWidth / 2 + leftPad + shiftAmount;
          })
          .attr("y",function(d,i){ return yScale(i) - barHeight; })
          .attr("fill", "none")
          .attr("stroke-width",1)
          .attr("stroke", function(d,i){
            if (collection === 'MTWT' && d > dataCollection.FSS.minFare[i]){
              return "RGBA(239, 72, 119, 1)";
            } else if (collection === 'FSS' && d > dataCollection.MTWT.minFare[i]){
              return "RGBA(239, 72, 119, 1)";
            }
            return "grey";
          })
          .attr("opacity",0).transition().duration(1000).delay(function(d,i){ return i * 100}).attr("opacity",1)

        svg.append("g").attr("class", function(){ return "maxfares--" + collection; })
          .selectAll(".maxfare").data(dataCollection[collection].maxFare)
          .enter().append("rect").attr("class","maxfare")
          .attr("width", function(d,i){ return 300 * (d / maxAvgFare); })
          .attr("height", barHeight)
          .attr("x", function(d){
            var shiftAmount = collection === 'MTWT' ? - 300*(d/maxAvgFare) -36 - 10 : 36 + 10;
            return graphWidth / 2 + leftPad + shiftAmount;
          })
          .attr("y",function(d,i){ return yScale(i) - barHeight; })
          .attr("fill", "none")
          .attr("stroke-width",1)
          .attr("stroke", function(d,i){
            if (collection === 'MTWT' && d > dataCollection.FSS.maxFare[i]){
              return "RGBA(239, 72, 119, 1)";
            } else if (collection === 'FSS' && d > dataCollection.MTWT.maxFare[i]){
              return "RGBA(239, 72, 119, 1)";
            }
            return "grey";
          })
          .attr("opacity",0).transition().duration(1000).delay(function(d,i){ return i * 100}).attr("opacity",1)
      }
    })

  // FARE BARS
    // svg.append("g").attr("class", "maxfares--MTWT")
    // .selectAll(".maxfare").data(dataCollection.MTWT.maxFare)
    // .enter().append("rect").attr("class","maxfare")
    // .attr("width", function(d,i){ return 200 * (d / maxAvgFare) })
    // .attr("x", function(d,i){
    //   var shiftAmount = 200 * (1 - (d / maxAvgFare));
    //   return width / 2 - 240 + shiftAmount;
    // })
    // .attr("fill", function(d,i){
    //   if (d > dataCollection.FSS.maxFare[i]) return "pink";
    // })

    // svg.append("g").attr("class", "maxfares--FSS")
    // .selectAll(".maxfare").data(dataCollection.FSS.maxFare)
    // .enter().append("rect").attr("class","maxfare")
    // .attr("width", function(d,i){ return 200 * (d / maxAvgFare) })
    // .attr("height", barHeight)
    // .attr("x", function(){
    //   return graphWidth / 2 + leftPad + 36 + 10;
    // })
    // .attr("y",function(d,i){ return yScale(i) - barHeight })
    // .attr("fill", "none")
    // .attr("stroke-width",1)
    // .attr("stroke", function(d,i){
    //   if (d > dataCollection.MTWT.maxFare[i]) return "RGBA(239, 72, 119, 1)";
    //   return "grey";
    // })
    // .attr("opacity",0).transition().duration(1000).delay(function(d,i){ return i * 100}).attr("opacity",1)

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
