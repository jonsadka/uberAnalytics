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
    var dataCollection = formatData(response[0].result, response[1].result, response[2].result);
    var maxAvgSurge = dataCollection.maxAvgSurge;
    var maxAvgFare = dataCollection.maxAvgFare;
    var bestTimesMTWTF = dataCollection.bestTimesMTWTF;
    var bestTimesSS = dataCollection.bestTimesSS;

    graphLeftXScale.domain([0, maxAvgFare]);
    graphLeftIntensityScale.domain([1, maxAvgSurge]);

    // UPDATE VIEW FOR EACH SET OF DATA
    Object.keys(dataCollection).forEach(function(collection){
      if ( typeof dataCollection[collection] === 'object' && !Array.isArray(dataCollection[collection]) ){
        // SURGE INTENSITIES 
        d3.selectAll(".surgeintensity--" + collection).data(dataCollection[collection].surge)
          .transition().duration(1200)
          .attr("stroke", function(d){ return graphLeftIntensityScale(d.surge); })
          .attr("fill", function(d){ return graphLeftIntensityScale(d.surge); })

        // FARE BARS
        d3.selectAll(".minfare--" + collection).data(dataCollection[collection].minFare)
          .attr("stroke", function(d,i){
            if (collection === 'MTWTF' && d > dataCollection.SS.minFare[i]){
              return "RGBA(239, 72, 119, 1)";
            } else if (collection === 'SS' && d > dataCollection.MTWTF.minFare[i]){
              return "RGBA(239, 72, 119, 1)";
            }
            return "grey";
          })
          .transition().duration(1200)
          .attr("width", function(d,i){ return graphLeftBarWidth * (d / maxAvgFare); })
          .attr("x", function(d){
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) -36 - 10 : 18 + 10;
            return graphLeftWidth / 2 + shiftAmount;
          })

        d3.selectAll(".maxfare--" + collection).data(dataCollection[collection].maxFare)
          .attr("stroke", function(d,i){
            if (collection === 'MTWTF' && d > dataCollection.SS.maxFare[i]){
              return "RGBA(239, 72, 119, 1)";
            } else if (collection === 'SS' && d > dataCollection.MTWTF.maxFare[i]){
              return "RGBA(239, 72, 119, 1)";
            }
            return "grey";
          })
          .transition().duration(1200)
          .attr("width", function(d,i){ return graphLeftBarWidth * (d / maxAvgFare); })
          .attr("x", function(d){
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) -36 - 10 : 18 + 10;
            return graphLeftWidth / 2 + shiftAmount;
          })
          .attr("mouseenter", "none")
          .each("end", growBars)


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
      }
    });

  });
}