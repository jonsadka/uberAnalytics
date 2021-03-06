///////////////////////////////////////////////////////////////////
//QUERY SETUP//////////////////////////////////////////////////////

// INITIALIZE KEEN
var client = new Keen({
  projectId: "540a24ab36bca41fa980505c",
  readKey: "7d266edfa93c5aa9391ab5749c8e0ba3a08f9e1f9e74794b9808209116fca4ed3cadadfad235102244cae3e76d1101608d46c81513af814c98ed17f044b14daee38f1a7e5a69baf7f34ed4c42c7c0a2195ffcc25f2f5a8723ad0b24a69ab5e7be973d607c5cdbaeee6f5e25cc3cc0325"
});

// CAPTURE USER DATA
var userInputs = {
  timeframe: getSpecialDay(document.getElementById("timeframe").options[document.getElementById("timeframe").selectedIndex].value),
  start: document.getElementById("startLoc").options[document.getElementById("startLoc").selectedIndex].value,
  end: document.getElementById("endLoc").options[document.getElementById("endLoc").selectedIndex].value,
  product: document.getElementById("product").options[document.getElementById("product").selectedIndex].value
};

var graphsContainerHeight = window.innerHeight - document.getElementById('header').offsetHeight;
document.getElementById('graph-left').setAttribute("style","height:" + (graphsContainerHeight - 78) + "px");
document.getElementById('graph-right-top').setAttribute("style","height: 70px");
document.getElementById('graph-right-bottom').setAttribute("style","height:" + (graphsContainerHeight - 186) + "px");


///////////////////////////////////////////////////////////////////
//SETUP LEFT GRAPH VARIABLES //////////////////////////////////////
var leftTopPad = 25;
var leftBottomPad = 10;

var graphLeftWidth = document.getElementById('graph-left').offsetWidth;
var graphLeftHeight = document.getElementById('graph-left').offsetHeight - leftTopPad - leftBottomPad;

var graphLeftBarWidth = graphLeftWidth / 2 - 2 * 36;

var colorIntensities = ['rgb(231,225,239)','rgb(212,185,218)','rgb(201,148,199)','rgb(223,101,176)','rgb(231,41,138)','rgb(206,18,86)'];

// CREATE CANVAS
var graphLeftSVG = d3.select("#graph-left").append("svg")
  .attr("width", graphLeftWidth)
  .attr("height", document.getElementById('graph-left').offsetHeight)
  .attr("id", "graph-left-content");

// ESTABLISH SCALES
var graphLeftXScale = d3.scale.linear().range([0, graphLeftWidth]);
var graphLeftYScale = d3.scale.linear().range([leftTopPad, graphLeftHeight - leftTopPad - leftBottomPad]).domain([0, 23]);
var graphLeftIntensityScale = d3.scale.quantile().range(colorIntensities);

// APPEND TIME LABELS
graphLeftSVG.append("g").attr("class", "timetext").attr("fill","white").style("text-anchor","middle")
  .selectAll(".hours").data(new Array(24))
  .enter().append("text").attr("class","hours")
  .attr("hour", function(d, i){
    return i;
  })
  .text(formatTime)
  .attr("x", function(){
    if (graphLeftHeight < 400){
      return graphLeftWidth / 2 - 10 / 2 + 6;
    }
    return graphLeftWidth / 2 - 12 / 2 + 6;
  })
  .attr("y",function(d,i){ return graphLeftYScale(i) + leftTopPad; })
  .style("font-size", verticalFont)
  .attr("opacity",0)
  .on("mouseover", function(){
    var thisNode = d3.select(this);
    var hour = thisNode.attr("hour");
    thisNode.style("font-size", "18px");
    d3.selectAll(".besttimes--time.hour" + hour)
      .style("fill", "RGBA(194, 230, 153, 1)").style("font-size", "22px")
    d3.selectAll(".besttimes--hour.hour" + hour)
      .style("fill", "RGBA(194, 230, 153, 1)").style("font-size", "12px")
    d3.selectAll(".surgetrends--dot.hour" + hour)
      .style("fill", "none")
      .style("stroke", function(d, i){
        if ( this.classList.contains("MTWTF") ) return "RGBA(173, 221, 237, 1)";
        if ( this.classList.contains("SS") ) return "RGBA(33, 188, 215, 1)";
      })
      .style("stroke-width", 1.5)
      .attr("r", 5)
    d3.selectAll(".maxfare--label.hour" + hour)
        .style("font-size", "20px")
  })
  .on("mouseout", function(){
    var thisNode = d3.select(this);
    var hour = thisNode.attr("hour");
    thisNode.style("font-size", "12px");
    d3.selectAll(".besttimes--time.hour" + hour)
      .style("fill", "white").style("font-size", "18px")
    d3.selectAll(".besttimes--hour.hour" + hour)
      .style("fill", "white").style("font-size", "10px")
    d3.selectAll(".surgetrends--dot.hour" + hour)
      .style("fill", function(d, i){
        if ( this.classList.contains("MTWTF") ) return "RGBA(173, 221, 237, 1)";
        if ( this.classList.contains("SS") ) return "RGBA(33, 188, 215, 1)";
      })
      .style("stroke", "none")
      .attr("r", 1.5)
    d3.selectAll(".maxfare--label.hour" + hour)
      .style("font-size", verticalFont)
  })
  .transition().duration(1000).delay(function(d,i){ return i * 100; })
  .attr("opacity",1);

// APPEND LEGEND
var graphLeftLegendContainer = graphLeftSVG.append("g").attr("class", "graph-left-legend").attr("fill", "white");

  // DAY OF WEEK
  var graphLeftLegendData = [{className:"SS", label:"WEEKEND"},{className:"MTWTF", label:"WEEKDAY"}];
  graphLeftLegendContainer.selectAll("legendText").data(graphLeftLegendData)
    .enter().append("text").attr("class", "legendtext")
    .attr("timeframe", function(d,i){ return d.className; })
    .text(function(d,i){
      return d.label;
    })
    .attr("x", function(d){
      var shiftAmount = d.className === 'MTWTF' ? -20 : 20;
      return graphLeftWidth / 2 + shiftAmount;
    })
    .attr("y", 22)
    .style("font-size", "18px")
    .attr("dy", "0.35em")
    .style("fill", "white")
    .attr("text-anchor", function(d){
      if (d.className === "SS") return "start";
      return "end";
    })
    .style("opacity", 0)
    .transition().delay(1000).duration(2000)
    .style("opacity", 1)

  // SURGE INTESNSITY
  graphLeftIntensityScale.domain([0,6])
  graphLeftLegendContainer.selectAll("rect").data(d3.range(6).map(function(a,i){ return i;})).enter().append("rect")
    .attr("class", "surgeintensity--rect")
    .attr("width", graphLeftWidth / 12)
    .attr("height", 4)
    .attr("y", function(d,i){
      return graphLeftHeight + leftTopPad + leftBottomPad - 30;
    })
    .attr("x", function(d,i){
      var shift = graphLeftWidth / 4;
      return i * (graphLeftWidth / 12 + 1.5) + shift - 1.5 * 5;
    })
    .style("fill", graphLeftIntensityScale)
    .style("opacity", 0)
    .transition().delay(1000).duration(2000)
    .style("opacity", 1)

graphLeftLegendContainer.selectAll(".someText")
  .data(d3.range(6).map(function(a,i){ if ( i === 0 ){ return "Low Price"; } else{return "High Price";} }))
  .enter().append("text")
  .attr("class", "surgeintensity--text")
  .text(function(d,i){
    // return d
    if (i === 0 || i === 5) return d;
  })
  .attr("y", function(d,i){
    return graphLeftHeight + leftTopPad + leftBottomPad - 10;
  })
  .attr("x", function(d,i){
    var shift = i === 5 ? graphLeftWidth / 4 + (graphLeftWidth / 12) - 50 : graphLeftWidth / 4;
    return i * (graphLeftWidth / 12 + 1.5) + shift - 1.5 * 5;
  })
  .style("fill", "white")
  .style("font-size", "10px")
  .style("opacity", 0)
  .transition().delay(1000).duration(2000)
  .style("opacity", 1)

///////////////////////////////////////////////////////////////////
//SETUP TOP RIGHT GRAPH VARIABLES /////////////////////////////////
var graphRightTopWidth = document.getElementById('graph-right-top').offsetWidth;
var graphRightTopHeight = document.getElementById('graph-right-top').offsetHeight;

// CREATE CANVAS
var graphRightTopSVG = d3.select("#graph-right-top").append("svg")
  .attr("width", graphRightTopWidth)
  .attr("height", graphRightTopHeight)
  .attr("id", "graph-right-top-content");

///////////////////////////////////////////////////////////////////
//SETUP BOTTOM RIGHT GRAPH VARIABLES //////////////////////////////
var rightBottomTopPad = 16;
var rightBottomBottomPad = 4;
var rightBottomLeftPad = 50;
var rightBottomRightPad = 10;

var graphRightBottomWidth = document.getElementById('graph-right-bottom').offsetWidth;
var graphRightBottomHeight = document.getElementById('graph-right-bottom').offsetHeight - rightBottomTopPad - rightBottomBottomPad;

// CREATE CANVAS
var graphRightBottomSVG = d3.select("#graph-right-bottom").append("svg")
  .attr("id", "graph-right-bottom-svg")
  .attr("width", graphRightBottomWidth)
  .attr("height", document.getElementById('graph-right-bottom').offsetHeight)
  .append("g")
    .attr("transform","translate(" + rightBottomLeftPad + "," + rightBottomTopPad + ")")
    .attr("id", "graph-right-bottom-content");

// ESTABLISH SCALES
var graphRightBottomXScale = d3.scale.linear().range([0, graphRightBottomWidth - rightBottomRightPad - rightBottomLeftPad]).domain([0, 23]);
var graphRightBottomYScale = d3.scale.linear().range([rightBottomTopPad, graphRightBottomHeight - rightBottomTopPad - rightBottomBottomPad]);

// ESTABLISH LINE PATH
var graphRightBottomLine = d3.svg.line().interpolate("monotone")
  .x(function(d){ return graphRightBottomXScale(d.hour); })

// APPEND LEGEND
var graphRightBottomLegendContainer = graphRightBottomSVG.append("g").attr("class", "graph-right-bottom-legend").attr("fill", "white");
var graphRightBottomLegendData = [{className:"SS", label:"weekend", color:"RGBA(33, 188, 215, 1)"},{className:"MTWTF", label:"weekday", color:"RGBA(173, 221, 237, 1)"}];
graphRightBottomLegendContainer.selectAll("legendCircles").data(graphRightBottomLegendData)
  .enter().append("circle")
  .attr("class", "legendcircles")
  .attr("timeframe", function(d,i){ return d.className; })
  .attr("r", 5)
  .attr("cx", function(d,i){
    return graphRightBottomXScale(23) - 72 * (i+1) + 14;
  })
  .attr("cy", -10)
  .style("fill", function(d){
    return d.color;
  })
  .style("opacity", 0)
  .transition().duration(3400)
  .style("opacity", 1)
  .each("end", highlighLine)

graphRightBottomLegendContainer.selectAll("legendText").data(graphRightBottomLegendData)
  .enter().append("text")
  .attr("class", "legendtext2")
  .attr("timeframe", function(d,i){ return d.className; })
  .text(function(d,i){
    return d.label.toUpperCase();
  })
  .attr("x", function(d,i){
    return graphRightBottomXScale(23) - 72 * i;
  })
  .attr("y", -10)
  .style("font-size", "10px")
  .attr("dy", "0.35em")
  .style("fill", function(d){
    return d.color;
  })
  .style("text-anchor", "end")
  .style("opacity", 0)
  .transition().duration(3400)
  .style("opacity", 1)
  .each("end", highlighLine)

  function highlighLine(){
    var thisNode = d3.select(this);
    var timeframe = thisNode.attr("timeframe");

    thisNode.on("mouseover", function(d,i){
      d3.selectAll(".surgetrends--line." + timeframe)
        .transition().duration(400)
        .style("stroke-width", 5)

      if ( timeframe === 'SS'){
        d3.selectAll(".surgetrends--line.MTWTF")
          .transition().duration(400)
          .style("stroke-width", 0)
        d3.selectAll(".surgetrends--dot.MTWTF")
          .transition().duration(400)
          .attr("r", 0)
      } else {
        d3.selectAll(".surgetrends--line.SS")
          .transition().duration(400)
          .style("stroke-width", 0)
        d3.selectAll(".surgetrends--dot.SS")
          .transition().duration(400)
          .attr("r", 0)
      }
    });

    // prevent premature termination of transition event
    thisNode.on("mouseout", function(d,i){
      d3.selectAll(".surgetrends--line")
        .transition().duration(400).style("stroke-width", 1.5);
      d3.selectAll(".surgetrends--dot")
        .transition().duration(400)
        .attr("r", 1.5)
    });
  }

///////////////////////////////////////////////////////////////////
//INITIAL RENDER///////////////////////////////////////////////////
Keen.ready(function(){
  getDataandFirstRender(userInputs);
});

///////////////////////////////////////////////////////////////////
//RE-INITIALIZE ON INPUT CHANGE////////////////////////////////////
var alertInDOM = false;
d3.select(document.getElementById("options")).on('change',
  function(){
    var newStart = document.getElementById("startLoc").options[document.getElementById("startLoc").selectedIndex].value;
    var newEnd = document.getElementById("endLoc").options[document.getElementById("endLoc").selectedIndex].value;

    if ( alertInDOM ) document.getElementById('header').lastChild.remove();
    if ( newEnd === newStart ){
      var alertDiv = document.createElement("div");
      alertDiv.innerHTML = 'Please choose two different locations in the same city.';
      alertDiv.className += 'travelalert';
      document.getElementById('header').appendChild(alertDiv);
      alertInDOM = true;
      return;
    } else if ( !sameCities(newStart, newEnd) ){
      var alertDiv = document.createElement("div");
      alertDiv.innerHTML = 'Let\'s not try to Uber across the country, we both know you can\'t afford it.';
      document.getElementById('header').appendChild(alertDiv);
      alertDiv.className += 'travelalert';
      alertInDOM = true;
      return;
    } else {
      alertInDOM = false;
    }

    var userInputs = {
      timeframe: getSpecialDay(document.getElementById("timeframe").options[document.getElementById("timeframe").selectedIndex].value),
      start: newStart,
      end: newEnd,
      product: document.getElementById("product").options[document.getElementById("product").selectedIndex].value
    };

    updateDataandRender(userInputs);
  }
);

///////////////////////////////////////////////////////////////////
//RE-RENDER ON WINDOW CHANGE///////////////////////////////////////
window.onresize = resizeRender;

///////////////////////////////////////////////////////////////////
//HELPER FUNCTIONS/////////////////////////////////////////////////
Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
}

function formatData(highEstimate, surgeEstimate){
  // ADD VARIABLE TO ADJUST FOR TIMEZONE IF IN NY
  var start = document.getElementById("startLoc").options[document.getElementById("startLoc").selectedIndex].value;
  var end = document.getElementById("endLoc").options[document.getElementById("endLoc").selectedIndex].value;
  var NY = (sameCities(start, end)[0] === 40.7127) ? true : false;

  var maxSurge = 0;
  var maxAvgSurge = 0;
  var maxAvgFare = 0;
  var minAvgFareMTWTF = Infinity;
  var minAvgFareSS = Infinity;
  var bestTimesMTWTF = [];
  var bestTimesSS = [];
  var originalSortedData = {};

  // ALLOCATE SPACE IN RESULT VARIABLE
  var result = { 'MTWTF':{}, 'SS':{} };
  Object.keys(result).forEach(function(daySegment){
    result[daySegment]['surge'] = [];
    result[daySegment]['maxFare'] = [];
    for (var i = 0; i < 24; i++){
      result[daySegment]['surge'].push([]);
      result[daySegment]['maxFare'].push([]);
    }
  });

  // DUMP HIGH ESTIMATES INTO WEEKEND AND WEEKDAY BUCKETS
  highEstimate.forEach(function(estimate){
    if (estimate.value !== null){
      var timestamp = (NY) ? new Date(estimate.timeframe.start).addHours(3) : new Date(estimate.timeframe.start);
      var day = timestamp.getDay();
      var hour = timestamp.getHours();
      if ( day === 1 ||  day === 2 || day === 3 || day === 4 || day === 5 ){
        result.MTWTF.maxFare[hour].push(estimate.value);
      } else {
        result.SS.maxFare[hour].push(estimate.value);
      }
    }
  });

  // DUMP SURGE ESTIMATES INTO WEEKEND AND WEEKDAY BUCKETS
  surgeEstimate.forEach(function(estimate){
    if (estimate.value !== null){
      var timestamp = (NY) ? new Date(estimate.timeframe.start).addHours(3) : new Date(estimate.timeframe.start);
      var day = timestamp.getDay();
      var hour = timestamp.getHours();
      if ( day === 1 ||  day === 2 || day === 3 || day === 4 || day === 5 ){
        result.MTWTF.surge[hour].push(estimate.value);
      } else {
        result.SS.surge[hour].push(estimate.value);
      }
    }
  });

  Object.keys(result).forEach(function(daySegment){
    var bestHours = [];
    originalSortedData[daySegment] = {};
    Object.keys(result[daySegment]).forEach(function(dataType){
      originalSortedData[daySegment][dataType] = [];
      result[daySegment][dataType] = result[daySegment][dataType].map(function(collection, hour){
        collection.forEach(function(value){
          if (dataType === 'surge' && value > maxSurge) maxSurge = value;
          originalSortedData[daySegment][dataType].push([hour, value])
        })
        var mean = d3.mean(collection);
        if ( dataType === 'maxFare' && daySegment === 'SS' ){
          if ( mean < minAvgFareSS ){
            minAvgFareSS = mean;
            bestHours = [hour];
          } else if ( mean === minAvgFareSS ) {
            bestHours.push(hour);
          }
        }
        if ( dataType === 'maxFare' && daySegment === 'MTWTF' ){
          if ( mean < minAvgFareMTWTF ){
            minAvgFareMTWTF = mean;
            bestHours = [hour];
          } else if ( mean === minAvgFareMTWTF ) {
            bestHours.push(hour);
          }
        }
        if ( dataType === 'maxFare' && mean > maxAvgFare ){
          maxAvgFare = mean;
        } else if ( dataType === 'surge' && mean > maxAvgSurge ){
          maxAvgSurge = mean;
        }
        if (dataType === 'surge') return {hour:hour, surge: mean};
        return mean;
      });
    });
    if ( daySegment === 'MTWTF' ) bestTimesMTWTF = bestHours;
    if ( daySegment === 'SS' ) bestTimesSS = bestHours;
  });

  result['maxAvgSurge'] = maxAvgSurge;
  result['maxAvgFare'] = maxAvgFare;
  result['bestTimesMTWTF'] = bestTimesMTWTF;
  result['bestTimesSS'] = bestTimesSS;
  result['originalSortedData'] = originalSortedData;
  result['maxSurge'] = maxSurge;
  result['minAvgFareMTWTF'] = minAvgFareMTWTF;
  result['minAvgFareSS'] = minAvgFareSS;
  return result;
}

function sameCities(start, end){
  // SF LOCATIONS
  // 37.7833° N, 122.4167° W
  if ( start === "gogp" && end === "pwll" || start === "gogp" && end === "warf" ) return [37.7833, 122.4167];
  if ( start === "pwll" && end === "gogp" || start === "pwll" && end === "warf" ) return [37.7833, 122.4167];
  if ( start === "warf" && end === "pwll" || start === "warf" && end === "gogp" ) return [37.7833, 122.4167];

  // LA LOCATIONS
  // 34.0500° N, 118.2500° W
  if ( start === "dtla" && end === "smon" || start === "dtla" && end === "hlwd" ) return [34.0500, 118.2500];
  if ( start === "smon" && end === "dtla" || start === "smon" && end === "hlwd" ) return [34.0500, 118.2500];
  if ( start === "hlwd" && end === "smon" || start === "hlwd" && end === "dtla" ) return [34.0500, 118.2500];

  // NY LOCATIONS
  // 40.7127° N, 74.0059° W
  if ( start === "grct" && end === "upma" || start === "grct" && end === "brok" ) return [40.7127, 74.0059];
  if ( start === "upma" && end === "grct" || start === "upma" && end === "brok" ) return [40.7127, 74.0059];
  if ( start === "brok" && end === "upma" || start === "brok" && end === "grct" ) return [40.7127, 74.0059];

  return false;
}

function formatTime(d,i){
  if ( i === 0 ) return '12a'
  if ( i === 12 ) return i + 'p';
  if ( i > 12 ) return i - 12 + 'p';
  return i + 'a';
}

function getSpecialDay(input){
  if ( input === 'halloween'){
    return {
      "start" : "2014-10-27T00:00:00.000Z",
      "end" : "2014-11-03T00:00:00.000Z"
    };
  } else if ( input === 'q4'){
    return {
      "start" : "2014-10-01T00:00:00.000Z",
      "end" : "2014-12-31T00:00:00.000Z"
    };
  } else if ( input === 'january'){
    return {
      "start" : "2015-01-01T00:00:00.000Z",
      "end" : "2015-01-30T00:00:00.000Z"
    };
  } else if ( input === 'december'){
    return {
      "start" : "2014-12-01T00:00:00.000Z",
      "end" : "2014-12-31T00:00:00.000Z"
    };
  } else if ( input === 'november'){
    return {
      "start" : "2014-11-01T00:00:00.000Z",
      "end" : "2014-11-30T00:00:00.000Z"
    };
  } else if ( input === 'october'){
    return {
      "start" : "2014-10-01T00:00:00.000Z",
      "end" : "2014-10-31T00:00:00.000Z"
    };
  } else if ( input === 'newyears'){
    return {
      "start" : "2014-12-29T00:00:00.000Z",
      "end" : "2015-01-04T00:00:00.000Z"
    };
  }
  return input;
}

function getSunriseSunset(date, start, end){
  var latLon = sameCities(start, end);
  if ( typeof date === 'string'){
    var averageDate = new Date();
    if (date === "this_7_days") averageDate.setDate( averageDate.getDate() - Math.round(7 / 2) );
    if (date === "this_14_days") averageDate.setDate( averageDate.getDate() - Math.round(14 / 2) );
    if (date === "this_21_days") averageDate.setDate( averageDate.getDate() - Math.round(21 / 2) );
    if (date === "this_28_days") averageDate.setDate( averageDate.getDate() - Math.round(28 / 2) );
    if (date === "this_60_days") averageDate.setDate( averageDate.getDate() - Math.round(60 / 2) );
    if (date === "this_183_days") averageDate.setDate( averageDate.getDate() - Math.round(183 / 2) );
  } else {
    var averageDate = new Date(date.start);
  }

  var timezoneOffset = (latLon[0] === 40.7127) ? (averageDate.getTimezoneOffset() + 180) * 60000 : averageDate.getTimezoneOffset() * 60000;
  var calculatedTimes = SunCalc.getTimes(averageDate, latLon[0], latLon[1]);

  // Convert calculatedTimestamp to hours
  for (var key in calculatedTimes){
    // convert from UTC to current timezone
    var timezoneTime = new Date(Date.parse(calculatedTimes[key]) - timezoneOffset);

    // save as hour and minutes
    currentTime = timezoneTime.toString().split(' ')[4].split(':');
    calculatedTimes[key] = currentTime;
  }

  return calculatedTimes;
}

function verticalFont(){
  if (graphLeftHeight < 200) return 6;
  if (graphLeftHeight < 300) return 8;
  if (graphLeftHeight < 400) return 10;
  if (graphLeftHeight < 500) return 12;
  return 14;
}

function horizontalFont(){
  if (graphLeftWidth < 300) return 10;
  if (graphLeftWidth < 500) return 12;
  return 14;
}

function graphLeftBarHeight(){
  if (graphLeftHeight < 200) return 6;
  if (graphLeftHeight < 300) return 8;
  if (graphLeftHeight < 400) return 10;
  if (graphLeftHeight < 500) return 12;
  return 14;
}
