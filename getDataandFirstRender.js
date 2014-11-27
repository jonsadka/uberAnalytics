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
    var maxSurge = dataCollection.maxSurge;
    var maxAvgSurge = dataCollection.maxAvgSurge;
    var maxAvgFare = dataCollection.maxAvgFare;
    var bestTimesMTWTF = dataCollection.bestTimesMTWTF;
    var bestTimesSS = dataCollection.bestTimesSS;

console.log(dataCollection)

    // LEFT GRAPH COMPONENTS
    graphLeftXScale.domain([0, maxAvgFare]);
    graphLeftIntensityScale.domain([1, maxAvgSurge]);
    // GET SUNRISE AND SUNSET
    var times = getSunriseSunset(userInputs.timeframe);

    // BOTTOM RIGHT GRAPH COMPONENTS
    graphRightBottomYScale.domain([maxSurge, 1]);
    graphRightBottomLine.y(function(d){ return graphRightBottomYScale(d.surge); });
    var graphRightBottomYAxis = d3.svg.axis().scale(graphRightBottomYScale).orient("left");
    var graphRightBottomXAxis = d3.svg.axis().scale(graphRightBottomXScale).orient("bottom")
      .ticks(24).tickFormat(formatTime);

    // DRAW AXIES
    graphRightBottomSVG.append("g").attr("class", "y axis")
      .call(graphRightBottomYAxis);
    graphRightBottomSVG.append("g").attr("class", "x axis")
      .attr("transform","translate(" + 0 + "," + (graphRightBottomHeight - rightBottomTopPad - rightBottomBottomPad) + ")")
      .call(graphRightBottomXAxis)

    // DRAW VIEW FOR EACH SET OF DATA
    Object.keys(dataCollection).forEach(function(collection){
      if ( collection === 'MTWTF' || collection === 'SS' ){
        // SURGE INTENSITIES  
        graphLeftSVG.append("g").attr("class", "surgeintensities--" + collection )
          .selectAll(".surgeintensity").data(dataCollection[collection].surge)
          .enter().append("rect").attr("class", "surgeintensity--" + collection)
          .attr("width", 6)
          .attr("height", graphLeftBarHeight)
          .attr("x", function(){
            var shift = collection === 'MTWTF' ? -36 : 18;
            return graphLeftWidth / 2 + shift;
          })
          .attr("y",function(d,i){ return graphLeftYScale(i) + leftTopPad - graphLeftBarHeight; })
          .style("fill", function(d){ return graphLeftIntensityScale(d.surge); })
          .style("stroke-width",1)
          .style("stroke", function(d){ return graphLeftIntensityScale(d.surge); })
          .style("opacity",0)
          .transition().duration(800).delay(function(d,i){ return i * 100; })
          .style("opacity",1);

        // FARE BARS
        graphLeftSVG.append("g").attr("class", "minfares--" + collection )
          .selectAll(".minfare--" + collection).data(dataCollection[collection].minFare)
          .enter().append("rect").attr("class", "minfare--" + collection)
          .attr("width", function(d,i){ return graphLeftBarWidth * (d / maxAvgFare); })
          .attr("height", graphLeftBarHeight)
          .attr("x", function(d){
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) -36 - 10 : 18 + 10;
            return graphLeftWidth / 2 + shiftAmount;
          })
          .attr("y",function(d,i){ return graphLeftYScale(i) + leftTopPad - graphLeftBarHeight; })
          .style("fill", "RGBA(0,0,0,0)")
          .style("stroke-width",1)
          .style("stroke", function(d,i){
            if (collection === 'MTWTF' && d > dataCollection.SS.minFare[i]){
              return "white";
            } else if (collection === 'SS' && d > dataCollection.MTWTF.minFare[i]){
              return "white";
            }
            return "RGBA(108, 108, 117, 1)";
          })
          .style("opacity",0)
          .transition().duration(800).delay(function(d,i){ return i * 100; })
          .style("opacity",1)

        graphLeftSVG.append("g").attr("class", "maxfares--" + collection)
          .selectAll(".maxfare--" + collection).data(dataCollection[collection].maxFare)
          .enter().append("rect").attr("class","maxfare--" + collection)
          .attr("width", function(d,i){ return graphLeftBarWidth * (d / maxAvgFare); })
          .attr("height", graphLeftBarHeight)
          .attr("x", function(d){
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) -36 - 10 : 18 + 10;
            return graphLeftWidth / 2 + shiftAmount;
          })
          .attr("y",function(d,i){ return graphLeftYScale(i) + leftTopPad - graphLeftBarHeight; })
          .style("fill", "RGBA(0,0,0,0)")
          .style("stroke-width",1)
          .style("stroke", function(d,i){
            if (collection === 'MTWTF' && d > dataCollection.SS.maxFare[i]){
              return "white";
            } else if (collection === 'SS' && d > dataCollection.MTWTF.maxFare[i]){
              return "white";
            }
            return "RGBA(108, 108, 117, 1)";
          })
          .attr("mouseenter", "none")
          .style("opacity",0)
          .transition().duration(800).delay(function(d,i){ return i * 100; })
          .style("opacity",1)
          .each("end", growBars)

        // FARE BAR LABELS
        graphLeftSVG.append("g").attr("class", "minfares--labels " + collection )
          .selectAll(".minfare--label." + collection).data(dataCollection[collection].minFare)
          .enter().append("text").attr("class", function(d,i){
              return "minfare--label " + collection + " hour" + i;
            })
          .text(function(d,i){
            return '$' + Math.round(d * 10) / 10;
          })
          .attr("x", function(d){
            var barWidth = graphLeftBarWidth * (d / maxAvgFare);
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) -36 - 10 + 6 : 18 + 10 + barWidth - 6;
            return graphLeftWidth / 2 + shiftAmount;
          })
          .attr("y",function(d,i){ 
            return graphLeftYScale(i) + leftTopPad - 2;
           })
          .style("fill", "none")
          .style("opacity",0)
          .style("font-size", "10px")
          .style("text-anchor", function(d){
            if (collection === 'MTWTF') return "start";
            if (collection === 'SS') return "end";
          })
          .transition().duration(800).delay(function(d,i){ return i * 100; })
          .style("opacity",1)        

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
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) -36 - 10 - 6 : 18 + 10 + barWidth + 6;
            return graphLeftWidth / 2 + shiftAmount;
          })
          .attr("y",function(d,i){ 
            return graphLeftYScale(i) + leftTopPad - 2;
           })
          .style("fill", "white")
          .style("font-size", "10px")
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
            .attr("r", function(d,i){
              if ( d[1] === maxSurge ) return 8;
              return 2;
            })
            .attr("stroke-width", 0)
            .transition().duration(400)
            .attr("stroke", function(d,i){
              if ( d[1] === maxSurge && set === 'SS' ) return "RGBA(33, 188, 215, .5)";
              if ( d[1] === maxSurge && set === 'MTWTF' ) return "RGBA(173, 221, 237, .5)";
            })
            .attr("stroke-width", function(d,i){
              if ( d[1] === maxSurge ) return 12;
            })
            .transition().duration(400)
            .attr("stroke-width", function(d,i){
              if ( d[1] === maxSurge ) return 2;
            })
            .transition().duration(400)
            .attr("stroke-width", function(d,i){
              if ( d[1] === maxSurge ) return 12;
            })
            .transition().duration(400)
            .attr("stroke-width", 0)
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
          .attr('x', 20)
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

    // SUNRISE AND SUNSET
    Object.keys(times).forEach(function(type){
      var hour = times[type];
      var description = type;
      if (description === 'sunrise' || description === 'sunset'){
console.log(description, hour)
        graphRightBottomSVG.append("g").attr("class", "ABC")
          .append("line")
          .attr("x1", graphRightBottomXScale(hour))
          .attr("x2", graphRightBottomXScale(hour))
          .attr("y1", 0)
          .attr("y2", 300)
          .style("stroke", "red")
          .style("stroke-width", 1)
      }
    })

    function growBars(){
      var thisNode = d3.select(this);
      var finalWidth = +thisNode.attr("width");
      var finalX = +thisNode.attr("x");

      // assign transistion events
      if ( thisNode.attr("class") === 'maxfare--MTWTF' ){
        thisNode.on("mouseenter", function(d,i){
          var startX = graphLeftWidth / 2 - 36 - 10;
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