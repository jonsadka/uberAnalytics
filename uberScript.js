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
var bottomPad = 0;

var graphLeftWidth = document.getElementById('graph-left').offsetWidth;
var graphLeftHeight = document.getElementById('graph-left').offsetHeight  - topPad - bottomPad;

var barHeight = 10;

// CREATE CANVAS
var svg = d3.select("#graph-left").append("svg")
  .attr("width", graphLeftWidth)
  .attr("height", graphLeftHeight)
  .attr("id", "graphs");

// ESTABLISH SCALES
var xScale = d3.scale.linear().range([0, graphLeftWidth]);
var yScale = d3.scale.linear().range([topPad, graphLeftHeight - topPad - bottomPad]).domain([0, 23]);
var surgeIntensityScale = d3.scale.ordinal().range(['rgb(247,244,249)','rgb(231,225,239)','rgb(212,185,218)','rgb(201,148,199)','rgb(223,101,176)','rgb(231,41,138)','rgb(206,18,86)','rgb(152,0,67)','rgb(103,0,31)'])
var elementSizeScale = d3.scale.ordinal().range([10,12,14]).domain([1280, 400]);


// APPEND TIME LABELS
svg.append("g").attr("class", "timetext").attr("fill","white").style("text-anchor","middle")
  .selectAll(".hours").data(new Array(24))
  .enter().append("text").attr("class","hours")
  .text(function(d,i){
    if ( i === 12 ) return i + 'pm';
    if ( i > 12 ) return i - 12 + 'pm';
    return i + 'am';
  })
  .attr("x", graphLeftWidth / 2 )
  .attr("y",function(d,i){ return yScale(i); })
  .style("font-size", function(){ if (graphLeftHeight < 400) return 10; return 12; })
  .attr("opacity",0).transition().duration(1000).delay(function(d,i){ return i * 100; }).attr("opacity",1)

///////////////////////////////////////////////////////////////////
//INITIAL RENDER///////////////////////////////////////////////////
Keen.ready(function(){ getDataandFirstRender(userInputs); });

///////////////////////////////////////////////////////////////////
//RE-INITIALIZE ON INPUT CHANGE////////////////////////////////////
d3.select(document.getElementById("options")).on('change',
  function(){
    var userInputs = {
      timeframe: document.getElementById("timeframe").options[document.getElementById("timeframe").selectedIndex].value,
      start: document.getElementById("startLoc").options[document.getElementById("startLoc").selectedIndex].value,
      end: document.getElementById("endLoc").options[document.getElementById("endLoc").selectedIndex].value,
      product: document.getElementById("product").options[document.getElementById("product").selectedIndex].value
    };

    getDataandFirstRender(userInputs);
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
