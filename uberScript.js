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

///////////////////////////////////////////////////////////////////
//GATHER DATA//////////////////////////////////////////////////////

Keen.ready(function(){
  // SETUP QUERIES
  var highEstimate = new Keen.Query("average", {
    eventCollection: "newPricesCollection",
    timeframe: "last_14_days",
    targetProperty: "high_estimate",
    interval: "daily",
    filters: [{"property_name":"end","operator":"eq","property_value":"pwll"},
              {"property_name":"start","operator":"eq","property_value":"warf"},
              {"property_name":"display_name","operator":"eq","property_value":"uberX"}]
  });

  var lowEstimate = new Keen.Query("average", {
    eventCollection: "newPricesCollection",
    timeframe: "last_14_days",
    targetProperty: "low_estimate",
    interval: "daily",
    filters: [{"property_name":"end","operator":"eq","property_value":"pwll"},
              {"property_name":"start","operator":"eq","property_value":"warf"},
              {"property_name":"display_name","operator":"eq","property_value":"uberX"}]
  });

  var surges = new Keen.Query("average", {
    eventCollection: "newPricesCollection",
    timeframe: "last_14_days",
    targetProperty: "surge_multiplier",
    interval: "daily",
    filters: [{"property_name":"end","operator":"eq","property_value":"pwll"},
              {"property_name":"start","operator":"eq","property_value":"warf"},
              {"property_name":"display_name","operator":"eq","property_value":"uberX"}]
  });

  // RUN QUERIES
  client.run([highEstimate, lowEstimate, surges], function(response){
    response.forEach(function(item){
      console.log(item.result)
    })
  })

});

///////////////////////////////////////////////////////////////////
//HELPER FUNCTIONS/////////////////////////////////////////////////
var isoTimeConvert = function(time){
  var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%S%Z");
  return timeFormat.parse( time.substring(0,22) + time.substring(23,25) );
};
