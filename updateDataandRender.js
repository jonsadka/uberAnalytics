function updateDataandRender(userInputs){
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
  console.log('Retrieving new data from server.');
  client.run([highEstimateQuery, lowEstimateQuery, surgeEstimateQuery], function(response){
    console.log('Retrieved new data from server!');
    console.log(response)
    var dataCollection = formatData(response[0].result, response[1].result, response[2].result);
    var maxSurge = dataCollection.maxSurge;
    var maxAvgSurge = dataCollection.maxAvgSurge;
    var maxAvgFare = dataCollection.maxAvgFare;
    var bestTimesMTWTF = dataCollection.bestTimesMTWTF;
    var bestTimesSS = dataCollection.bestTimesSS;

    // UPDATE LEFT GRAPH COMPONENTS
    graphLeftXScale.domain([0, maxAvgFare]);
    graphLeftIntensityScale.domain([1, maxAvgSurge]);

    // UPDATE BOTTOM RIGHT GRAPH COMPONENTS
    graphRightBottomYScale.domain([maxSurge, 1]);
    graphRightBottomLine.y(function(d){ return graphRightBottomYScale(d.surge); });
    var graphRightBottomYAxis = d3.svg.axis().scale(graphRightBottomYScale).orient("left");

    // UPDATE XIES
    d3.selectAll(".y.axis").transition().duration(1500).call(graphRightBottomYAxis);

    // UPDATE VIEW FOR EACH SET OF DATA
    Object.keys(dataCollection).forEach(function(collection){
      if (  collection === 'MTWTF' || collection === 'SS' ){
        // SURGE INTENSITIES 
        d3.selectAll(".surgeintensity--" + collection).data(dataCollection[collection].surge)
          .transition().duration(1500)
          .style("stroke", function(d){ return graphLeftIntensityScale(d.surge); })
          .style("fill", function(d){ return graphLeftIntensityScale(d.surge); })

        // FARE BARS
        d3.selectAll(".minfare--" + collection).data(dataCollection[collection].minFare)
          .style("stroke", function(d,i){
            if (collection === 'MTWTF' && d > dataCollection.SS.minFare[i]){
              return "white";
            } else if (collection === 'SS' && d > dataCollection.MTWTF.minFare[i]){
              return "white";
            }
            return "RGBA(108, 108, 117, 1)";
          })
          .transition().duration(1500)
          .attr("width", function(d,i){ return graphLeftBarWidth * (d / maxAvgFare); })
          .attr("x", function(d){
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) -36 - 10 : 18 + 10;
            return graphLeftWidth / 2 + shiftAmount;
          })

        d3.selectAll(".maxfare--" + collection).data(dataCollection[collection].maxFare)
          .style("stroke", function(d,i){
            if (collection === 'MTWTF' && d > dataCollection.SS.maxFare[i]){
              return "white";
            } else if (collection === 'SS' && d > dataCollection.MTWTF.maxFare[i]){
              return "white";
            }
            return "RGBA(108, 108, 117, 1)";
          })
          .transition().duration(1500)
          .attr("width", function(d,i){ return graphLeftBarWidth * (d / maxAvgFare); })
          .attr("x", function(d){
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) -36 - 10 : 18 + 10;
            return graphLeftWidth / 2 + shiftAmount;
          })
          .attr("mouseenter", "none")
          .each("end", growBars)

        // SURGE TRENDS
        d3.select(".surgetrends--line." + collection)
          .datum(dataCollection[collection].surge)
          .transition().duration(1500)
          .attr("d", graphRightBottomLine )

        // FARE BAR LABELS
        d3.selectAll(".minfare--label." + collection).data(dataCollection[collection].minFare)
          .attr("class", function(d,i){
              return "minfare--label " + collection + " hour" + i;
            })
          .transition().duration(1500)
          .text(function(d,i){
            return '$' + Math.round(d * 10) / 10;
          })
          .attr("x", function(d){
            var barWidth = graphLeftBarWidth * (d / maxAvgFare);
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) -36 - 10 + 6 : 18 + 10 + barWidth - 6;
            return graphLeftWidth / 2 + shiftAmount;
          })

          d3.selectAll(".maxfare--label." + collection).data(dataCollection[collection].maxFare)
          .attr("class", function(d,i){
              return "maxfare--label " + collection + " hour" + i;
            })
          .transition().duration(1500)
          .text(function(d,i){
            return '$' + Math.round(d * 10) / 10;
          })
          .attr("x", function(d){
            var barWidth = graphLeftBarWidth * (d / maxAvgFare);
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) -36 - 10 - 6 : 18 + 10 + barWidth + 6;
            return graphLeftWidth / 2 + shiftAmount;
          })


      }

      // SURGE TREND DATA DOTS
      if ( collection === 'originalSortedData' ){
        Object.keys(dataCollection[collection]).forEach(function(set){
          var dataPoints = dataCollection[collection][set].surge;

          var container = d3.select('#graph-right-bottom-content');

          var circles = container.selectAll(".surgetrends--dot." + set).data(dataPoints);

          circles
            .attr("class", function(d){
              return "surgetrends--dot " + set + " hour" + d[0];
            })
            .transition().duration(1000)
            .attr("cx", function(d){
              return graphRightBottomXScale(d[0]);
            })
            .attr("cy", function(d){
              return graphRightBottomYScale(d[1]);
            })
            .attr("stroke-width", 0)
            .attr("r", 2)
            .transition().duration(400)
            .attr("r", function(d,i){
              if ( d[1] === maxSurge ) return 8;
              return 2;
            })
            .attr("stroke", function(d,i){
              if ( d[1] === maxSurge && set === 'SS' ) return "RGBA(33, 188, 215, .5)";
              if ( d[1] === maxSurge && set === 'MTWTF' ) return "RGBA(173, 221, 237, .5)";
              return "none";
            })
            .transition().duration(400)
            .attr("stroke-width", function(d,i){
              if ( d[1] === maxSurge ) return 12;
            })
            .transition().duration(400)
            .attr("stroke-width", 0)
            .transition().duration(400)
            .attr("stroke-width", function(d,i){
              if ( d[1] === maxSurge ) return 12;
            })
            .transition().duration(400)
            .attr("stroke-width", 0)

          circles.enter().append("circle")
            .attr("class", function(d){
              var maxClass = ( d[1] === maxSurge ) ? 'maxsurge' : '';
              return "surgetrends--dot " + set + " hour" + d[0] + ' ' + maxClass;
            })
            .attr("cy", function(d){
              return graphRightBottomYScale(d[1]);
            })
            .attr("cx", graphRightBottomXScale(24) )
            .attr("r", 0)
            .transition().duration(1000)
            .attr("cx", function(d){
              return graphRightBottomXScale(d[0]);
            })
            .attr("r", function(d,i){
              if ( d[1] === maxSurge ) return 8;
              return 2;
            })
            .attr("stroke-width", 0)
            .transition().delay(1000).duration(400)
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

          // ALTERNATIVE ANIMATION
          // circles.transition().duration(800)
          //   .attr("cy", graphRightBottomYScale(1) )

          // circles
          //   .transition().delay(800)
          //   .attr("cx", function(d){
          //     return graphRightBottomXScale(d[0]);
          //   })
          //   .transition().delay(800).duration(800)
          //   .attr("cy", function(d){
          //     return graphRightBottomYScale(d[1]);
          //   })

          // circles.enter().append("circle")
          //   .attr("class","surgetrends--dot " + set)
          //   .attr("cx", function(d){
          //     return graphRightBottomXScale(d[0]);
          //   })
          //   .attr("cy", graphRightBottomYScale(1) )
          //   .attr("r", 0)
          //   .transition().delay(800).duration(800)
          //   .attr("r", 2)
          //   .attr("cy", function(d){
          //     return graphRightBottomYScale(d[1]);
          //   })

          circles.exit().remove();
        });
      }

      // UPDATE RATE TEXT
      if ( collection === 'bestTimesMTWTF' || collection === 'bestTimesSS' ){
        var set = collection === 'bestTimesSS' ? 'SS' : 'MTWTF';

        var container = d3.select('#graph-right-top-content');

        var text = container.selectAll(".besttimes--time." + set).data(dataCollection[collection]);

        text
          .attr("class", function(d){
            return "besttimes--time " + set + " hour" + d;
          })
          .text(function(d,i){
            return formatTime(0, d).slice(-3,-1);
            return formatTime(0, d);
          })
          .transition().duration(1000)
          .attr('x', function(d,i){
            return graphRightBottomXScale(d) + 40;
          })

        text.enter().append("text")
          .attr("class", function(d){
            return "besttimes--time " + set + " hour" + d;
          })
          .text(function(d,i){
            return formatTime(0, d).slice(-3,-1);
          })
          .attr('y', function(d,i){
            if ( set === 'SS' ) return 50;
            return 25;
          })
          .attr('x', function(d,i){
            return graphRightBottomXScale(d) + 40;
          })
          .style("font-size", "18px")
          .style("fill", "white")
          .style("opacity",0)
          .transition().duration(1400)
          .style("opacity",1) 

        text.exit().remove();

        var hour = container.selectAll(".besttimes--hour." + set).data(dataCollection[collection]);

        hour.attr("class", function(d,i){
            return "besttimes--hour " + set + " hour" + d;
          })
          .text(function(d,i){
            return formatTime(0, d).slice(-1);
          })
          .transition().duration(1000)
          .attr('x', function(d,i){
            var offset = ( (d === 0) || d > 21 || (d > 9 && d < 13) ) ? 44/2 : 22 / 2;
            return graphRightBottomXScale(d) + offset + 40;
          })

        hour.enter().append("text")
          .attr("class", function(d,i){
            return "besttimes--hour " + set + " hour" + d;
          })
          .text(function(d,i){
            return formatTime(0, d).slice(-1);
          })
          .style("font-size", "10px")
          .attr('y', function(d,i){
            if ( set === 'SS' ) return 50;
            return 25;
          })
          .attr('x', function(d,i){
            var offset = ( (d === 0) || d > 21 || (d > 9 && d < 13) ) ? 44/2 : 22 / 2;
            return graphRightBottomXScale(d) + offset + 40;
          })
          .style("fill", "white")
          .style("opacity",0)
          .transition().duration(1400)
          .style("opacity",1) 

        hour.exit().remove();

      }

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

  });
}
