///////////////////////////////////////////////////////////////////
//GLOBAL STORAGE FOR RERENDERING///////////////////////////////////
var dataCollection;
var maxSurge;
var maxAvgSurge;
var maxAvgFare;
var bestTimesMTWTF;
var bestTimesSS;
var sunTimes;
var minAvgFareMTWTF;
var minAvgFareSS;

///////////////////////////////////////////////////////////////////
//GATHER DATA AND PERFORM FIRST RENDER/////////////////////////////
function getDataandFirstRender(userInputs){
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
  client.run([highEstimateQuery, surgeEstimateQuery], function(response){
    console.log('Retrieved data from server!');

    // LAYUP DATA
    dataCollection = formatData(response[0].result, response[1].result);
    maxSurge = dataCollection.maxSurge;
    maxAvgSurge = dataCollection.maxAvgSurge;
    maxAvgFare = dataCollection.maxAvgFare;
    bestTimesMTWTF = dataCollection.bestTimesMTWTF;
    bestTimesSS = dataCollection.bestTimesSS;
    minAvgFareMTWTF = dataCollection.minAvgFareMTWTF;
    minAvgFareSS = dataCollection.minAvgFareSS;

    // LEFT GRAPH COMPONENTS
    graphLeftXScale.domain([0, maxAvgFare]);
    graphLeftIntensityScale.domain([1, maxAvgSurge]);
    // GET SUNRISE AND SUNSET
    sunTimes = getSunriseSunset(userInputs.timeframe, userInputs.start, userInputs.end);

    // BOTTOM RIGHT GRAPH COMPONENTS
    graphRightBottomYScale.domain([maxSurge, 1]);
    graphRightBottomLine.y(function(d){ return graphRightBottomYScale(d.surge); });
    var graphRightBottomYAxis = d3.svg.axis().scale(graphRightBottomYScale).orient("left");
    var graphRightBottomXAxis = d3.svg.axis().scale(graphRightBottomXScale).orient("bottom")
      .ticks(24).tickFormat(formatTime);

    // DRAW AXIES
    graphRightBottomSVG.append("g").attr("class", "y axis")
      .call(graphRightBottomYAxis)
      .style("opacity",0)
      .transition().duration(500)
      .style("opacity",1)

    graphRightBottomSVG.append("g").attr("class", "x axis")
      .attr("transform","translate(" + 0 + "," + (graphRightBottomHeight - rightBottomTopPad - rightBottomBottomPad) + ")")
      .call(graphRightBottomXAxis)
      .style("opacity",0)
      .transition().duration(500)
      .style("opacity",1)

    // APPEND CHART AXIS LABEL
    graphRightBottomLegendContainer
      .append("text")
      .text("surge multiplier")
      .attr("text-anchor", "end")
      .attr("x", -rightBottomTopPad)
      .attr("y", 4)
      .attr("dy", "0.75em")
      .attr("transform","rotate(-90)")
      .attr("fill", "#777")
      .style("font-size", "10px")
      .style("opacity",0)
      .transition().duration(500)
      .style("opacity",1)

    // DRAW SUNRISE AND SUNSET LINES
    graphRightBottomSVG.append("g").attr("class", "sunpositions");
    Object.keys(sunTimes).forEach(function(type){
      var hour = Number(sunTimes[type][0]) + (Number(sunTimes[type][1]) / 60);
      var description = type;
      if (description === 'sunrise' || description === 'goldenHour' || description === 'sunset'){
        d3.select(".sunpositions")
          .append("text").attr("class", "sunposition--text " + description)
          .text(function(){
            var displayHour = +sunTimes[type][0] > 12 ? +sunTimes[type][0] - 12 : +sunTimes[type][0];
            var displayDesc = description === "goldenHour" ? "golden hour" : description
            return displayDesc.toUpperCase() + "  " + displayHour + ":" + sunTimes[type][1];
          })
          .attr("transform", "rotate(-90)")
          .attr("dy", ".3em")
          .style("stroke-width", 0)
          .style("fill", "white")
          .style("font-size", "10px")
          .style("text-anchor", "end")
          .attr("y", graphRightBottomXScale(hour))
          .attr("x", graphRightBottomYScale(1))
          .transition().duration(1500)
          .attr("x", graphRightBottomYScale(maxSurge) - rightBottomTopPad - rightBottomBottomPad)

        var textSize = document.getElementsByClassName("sunposition--text " + description)[0].getBBox();

        d3.select(".sunpositions")
          .append("line").attr("class", "sunposition--line " + description)
          .attr("x1", graphRightBottomXScale(hour))
          .attr("y1", graphRightBottomYScale(1))
          .attr("x2", graphRightBottomXScale(hour))
          .attr("y2", graphRightBottomYScale(1))
          .style("stroke", "white")
          .style("stroke-width", 1)
          .style("stroke-dasharray", "1,1")
          .transition().duration(1500)
          .attr("y2", graphRightBottomYScale(maxSurge) + textSize.width)

      }
    })

    // DRAW VIEW FOR EACH SET OF DATA
    Object.keys(dataCollection).forEach(function(collection){
      if ( collection === 'MTWTF' || collection === 'SS' ){
        // SURGE INTENSITIES  
        graphLeftSVG.append("g").attr("class", "surgeintensities--" + collection )
          .selectAll(".surgeintensity").data(dataCollection[collection].surge)
          .enter().append("rect").attr("class", "surgeintensity--" + collection)
          .attr("width", 6)
          .attr("height", fareBarSize)
          .attr("x", function(){
            var shift = collection === 'MTWTF' ? - 25 : 18;
            return graphLeftWidth / 2 + shift;
          })
          .attr("y",function(d,i){ return graphLeftYScale(i) + leftTopPad - fareBarSize(); })
          .style("fill", function(d){ return graphLeftIntensityScale(d.surge); })
          .style("stroke-width",1)
          .style("stroke", function(d){ return graphLeftIntensityScale(d.surge); })
          .style("opacity",0)
          .transition().duration(800).delay(function(d,i){ return i * 100; })
          .style("opacity",1);

        // FARE BARS
        graphLeftSVG.append("g").attr("class", "maxfares--" + collection)
          .selectAll(".maxfare--" + collection).data(dataCollection[collection].maxFare)
          .enter().append("rect").attr("class","maxfare--" + collection)
          .attr("width", function(d,i){ return graphLeftBarWidth * (d / maxAvgFare); })
          .attr("height", fareBarSize)
          .attr("x", function(d){
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) - 19 - 10 : 18 + 10;
            return graphLeftWidth / 2 + shiftAmount;
          })
          .attr("y",function(d,i){ return graphLeftYScale(i) + leftTopPad - fareBarSize(); })
          .style("fill", function(d){ 
            if ( d === minAvgFareSS || d === minAvgFareMTWTF ) return "#e5f5e0";
            return graphLeftIntensityScale( (d / maxAvgFare) * maxAvgSurge);
           })
          .style("stroke-width",1)
          .style("stroke", function(d){ 
            if ( d === minAvgFareSS || d === minAvgFareMTWTF ) return "#e5f5e0";
            return graphLeftIntensityScale( (d / maxAvgFare) * maxAvgSurge);
           })
          .attr("mouseenter", "none")
          .style("opacity",0)
          .transition().duration(800).delay(function(d,i){ return i * 100; })
          .style("opacity",1)
          .each("end", growBars)

        // FARE BAR LABELS
        graphLeftSVG.append("g").attr("class", "maxfares--labels " + collection )
          .selectAll(".maxfare--label." + collection).data(dataCollection[collection].maxFare)
          .enter().append("text")
          .attr("class", function(d,i){
              return "maxfare--label " + collection + " hour" + i;
            })
          .text(function(d,i){
            return '$' + Math.round(d * 10) / 10;
          })
          .attr("x", function(d){
            var barWidth = graphLeftBarWidth * (d / maxAvgFare);
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) - 19 - 10 - 6 : 18 + 10 + barWidth + 6;
            return graphLeftWidth / 2 + shiftAmount;
          })
          .attr("y",function(d,i){ 
            return graphLeftYScale(i) + leftTopPad - 2;
           })
          .style("fill", function(d){ 
            if ( d === minAvgFareSS || d === minAvgFareMTWTF ) return "#e5f5e0";
            return graphLeftIntensityScale( (d / maxAvgFare) * maxAvgSurge);
           })
          .style("font-size", verticalFont)
          .style("text-anchor", function(d){
            if (collection === 'MTWTF') return "end";
            if (collection === 'SS') return "start";
          })
          .style("opacity",0)
          .transition().duration(800).delay(function(d,i){ return i * 100; })
          .style("opacity",1)   

        // SURGE TRENDS
        graphRightBottomSVG.append("g").attr("class", "surgetrends--lines " + collection)
          .append("path").datum(d3.range(24).map(function(val, idx){
            return {hour: idx, surge: 1};
          }))
          .attr("class","surgetrends--line " + collection)
          .attr("d", graphRightBottomLine )

        d3.select(".surgetrends--line." + collection)
          .datum(dataCollection[collection].surge)
          .transition().delay(1000).duration(2000)
          .attr("d", graphRightBottomLine )
      }

      // SURGE TREND DATA DOTS
      if ( collection === 'originalSortedData' ){
        Object.keys(dataCollection[collection]).forEach(function(set){

          var container = graphRightBottomSVG.append("g")
            .attr("class", "surgetrends--dots " + set);

          var dataPoints = dataCollection[collection][set].surge;

          container.selectAll(".surgetrends--dot " + set).data(dataPoints).enter()
            .append("circle").attr("class", function(d){
              var maxClass = ( d[1] === maxSurge ) ? 'maxsurge' : '';
              return "surgetrends--dot " + set + " hour" + d[0] + ' ' + maxClass;
            })
            .attr("cx", function(d){
              return graphRightBottomXScale(d[0]);
            })
            .attr("cy", function(d){
              return graphRightBottomYScale(d[1]);
            })
            .attr("r", 0)
            .transition().duration(1500)
            .attr("r", 1.5)
            .attr("stroke-width", 0)
            .transition().delay(3000).duration(400)
            .attr("stroke", function(d,i){
              if ( d[1] === maxSurge && set === 'SS' ) return "RGBA(33, 188, 215, .5)";
              if ( d[1] === maxSurge && set === 'MTWTF' ) return "RGBA(173, 221, 237, .5)";
            })
            .attr("stroke-width", function(d,i){
              if ( d[1] === maxSurge ) return 20;
            })
            .transition().duration(400)
            .attr("stroke-width", function(d,i){
              if ( d[1] === maxSurge ) return 0;
            })
            .transition().duration(400)
            .attr("stroke-width", function(d,i){
              if ( d[1] === maxSurge ) return 20;
            })
            .transition().duration(400)
            .attr("stroke-width", 0)
            .transition()
            .attr("stroke-width", 10)
            .attr("stroke", "RGBA(225,225,225,0)")
            .each("end", detailDot)
        });
      }

      function detailDot(){
        var thisNode = d3.select(this);
        thisNode.on("mouseover", function(d,i){
          var nodeHour = thisNode[0][0].__data__[0];
          var nodeSurge = thisNode[0][0].__data__[1];
          d3.select("#graph-right-bottom-content").append("text")
            .attr("id", "specialText").text("Surge | " + Math.round(nodeSurge*100)/100 )
            .attr("x", function(){
              if (nodeHour > 20 ) return graphRightBottomXScale(nodeHour) - 12;
              return graphRightBottomXScale(nodeHour) + 12;
            })
            .attr("text-anchor", function(){
              if (nodeHour > 20 ) return "end";
              return "start";
            })
            .attr("y", graphRightBottomYScale(nodeSurge) - 12)
            .style("font-size", "12px")
            .style("fill", "RGBA(194, 230, 153, 1)")
            .style("opacity", 0)
            .transition().duration(400)
            .style("opacity", 1)

          thisNode.transition().duration(400)
            .attr("r", 8)
        });

        // prevent premature termination of transition event
        thisNode.on("mouseout", function(d,i){
          d3.select("#specialText").remove()
          thisNode.transition().duration(400)
            .attr("r", 1.5)
        });
      }

      // APPEND RATE TEXT
      if ( collection === 'bestTimesMTWTF' || collection === 'bestTimesSS' ){
        var set = collection === 'bestTimesSS' ? 'SS' : 'MTWTF';
        graphRightTopSVG.append("g").attr("class", "besttimes--times " + set)
          .style("fill", "white")
          .selectAll(".besttimes--time." + set)
          .data(dataCollection[collection]).enter().append('text')
          .attr("class", function(d,i){
            return "besttimes--time " + set + " hour" + d;
          })
          .text(function(d,i){
            return formatTime(0, d).slice(-3,-1);
          })
          .style("font-size", "18px")
          .attr('y', function(d,i){
            if ( set === 'SS' ) return 50;
            return 25;
          })
          .attr('x', 20)
          .transition().duration(1500)
          .attr('x', function(d,i){
            return graphRightBottomXScale(d) + 40;
          })

        d3.select(".besttimes--times." + set)
          .selectAll(".besttimes--hour." + set)
          .data(dataCollection[collection]).enter().append('text')
          .attr("class", function(d,i){
            return "besttimes--hour " + set + " hour" + d;
          })
          .text(function(d,i){
            return formatTime(0, d).slice(-1);
          })
          .attr('y', function(d,i){
            if ( set === 'SS' ) return 50;
            return 25;
          })
          .attr('x', function(d,i){
            var offset = ( (d === 0) || d > 21 || (d > 9 && d < 13) ) ? 44/2 : 22 / 2;
            return offset + 20;
          })
          .transition().duration(1500)
          .attr('x', function(d,i){
            var offset = ( (d === 0) || d > 21 || (d > 9 && d < 13) ) ? 44/2 : 22 / 2;
            return graphRightBottomXScale(d) + offset + 40;
          })
          .style("font-size", "10px")
          .style("text-anchor", "start")

        graphRightTopSVG.append("text")
          .text(function(){
            if (set === 'SS') return 'weekend';
            return 'weekday';
          }).style("fill", "white")
          .attr("x", 0).attr('y', function(d,i){
            if ( set === 'SS' ) return 50;
            return 25;
          })
          .style("font-size", "10px")
          .style("text-anchor", "start")
      }
    });

    function growBars(){
      var thisNode = d3.select(this);
      var finalWidth = +thisNode.attr("width");
      var finalX = +thisNode.attr("x");

      // assign transistion events
      if ( thisNode.attr("class") === 'maxfare--MTWTF' ){
        thisNode.on("mouseenter", function(d,i){
          var startX = graphLeftWidth / 2 - 13 - 10 - 6;
          thisNode.attr("x", startX).attr("width", 0).transition().duration(800)
                  .attr("x", finalX).attr("width", finalWidth);
        });
      } else {
        thisNode.on("mouseenter", function(d,i){
          thisNode.attr("width", 0).transition().duration(800).attr("width", finalWidth);
        });
      }

      // prevent premature termination of transition event
      thisNode.on("mouseout", function(d,i){
        thisNode.transition().duration(800).attr("width", finalWidth).attr("x", finalX);
      });
    }

  });
}