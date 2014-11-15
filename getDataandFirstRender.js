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
    var maxAvgSurge = dataCollection.maxAvgSurge;
    var maxAvgFare = dataCollection.maxAvgFare;
    var bestTimesMTWTF = dataCollection.bestTimesMTWTF;
    var bestTimesSS = dataCollection.bestTimesSS;

    // LEFT GRAPH COMPONENTS
    graphLeftXScale.domain([0, maxAvgFare]);
    graphLeftIntensityScale.domain([1, maxAvgSurge]);

    // BOTTOM RIGHT GRAPH COMPONENTS
    graphRightBottomYScale.domain([maxAvgSurge, 0.8]);
    graphRightBottomLine.y(function(d){ return graphRightBottomYScale(d.surge); });
    var graphRightBottomYAxis = d3.svg.axis().scale(graphRightBottomYScale).orient("left");


    // DRAW SCALE
    graphRightBottomSVG.append("g").attr("class","y axis").call(graphRightBottomYAxis);

    // DRAW VIEW FOR EACH SET OF DATA
    Object.keys(dataCollection).forEach(function(collection){
      if ( typeof dataCollection[collection] === 'object' && !Array.isArray(dataCollection[collection]) ){
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
          .attr("fill", function(d){ return graphLeftIntensityScale(d.surge); })
          .attr("stroke-width",1)
          .attr("stroke", function(d){ return graphLeftIntensityScale(d.surge); })
          .attr("opacity",0)
          .transition().duration(800).delay(function(d,i){ return i * 100; })
          .attr("opacity",1);

        // FARE BARS
        graphLeftSVG.append("g").attr("class", "minfares--" + collection )
          .selectAll(".maxfare").data(dataCollection[collection].minFare)
          .enter().append("rect").attr("class", "minfare--" + collection)
          .attr("width", function(d,i){ return graphLeftBarWidth * (d / maxAvgFare); })
          .attr("height", graphLeftBarHeight)
          .attr("x", function(d){
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) -36 - 10 : 18 + 10;
            return graphLeftWidth / 2 + shiftAmount;
          })
          .attr("y",function(d,i){ return graphLeftYScale(i) + leftTopPad - graphLeftBarHeight; })
          .attr("fill", "RGBA(0,0,0,0)")
          .attr("stroke-width",1)
          .attr("stroke", function(d,i){
            if (collection === 'MTWTF' && d > dataCollection.SS.minFare[i]){
              return "RGBA(239, 72, 119, 1)";
            } else if (collection === 'SS' && d > dataCollection.MTWTF.minFare[i]){
              return "RGBA(239, 72, 119, 1)";
            }
            return "grey";
          })
          .attr("opacity",0).transition().duration(800).delay(function(d,i){ return i * 100; }).attr("opacity",1)

        graphLeftSVG.append("g").attr("class", "maxfares--" + collection)
          .selectAll(".maxfare").data(dataCollection[collection].maxFare)
          .enter().append("rect").attr("class","maxfare--" + collection)
          .attr("width", function(d,i){ return graphLeftBarWidth * (d / maxAvgFare); })
          .attr("height", graphLeftBarHeight)
          .attr("x", function(d){
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) -36 - 10 : 18 + 10;
            return graphLeftWidth / 2 + shiftAmount;
          })
          .attr("y",function(d,i){ return graphLeftYScale(i) + leftTopPad - graphLeftBarHeight; })
          .attr("fill", "RGBA(0,0,0,0)")
          .attr("stroke-width",1)
          .attr("stroke", function(d,i){
            if (collection === 'MTWTF' && d > dataCollection.SS.maxFare[i]){
              return "RGBA(239, 72, 119, 1)";
            } else if (collection === 'SS' && d > dataCollection.MTWTF.maxFare[i]){
              return "RGBA(239, 72, 119, 1)";
            }
            return "grey";
          })
          .attr("mouseenter", "none")
          .attr("opacity",0).transition().duration(800).delay(function(d,i){ return i * 100; }).attr("opacity",1)
          .each("end", growBars)

        // SURGE TRENDS
        graphRightBottomSVG.append("g").attr("class", "surgetrends--lines" + collection)
          .append("path").datum(dataCollection[collection].surge)
          .attr("class","surgetrends--line " + collection)
          .attr("d", graphRightBottomLine )

        // !!!!!!add surgetrends--dot
        graphRightBottomSVG.append("g").attr("class", "surgetrends--dots" + collection)
          // .attr("class","surgetrend--dot " + collection)
      }
    });

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
};