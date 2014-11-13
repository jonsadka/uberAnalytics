///////////////////////////////////////////////////////////////////
//GATHER DATA AND PERFORM FIRST RENDER/////////////////////////////
var getDataandFirstRender = function(userInputs){
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
    surgeIntensityScale.domain([1, maxAvgFare]);

    // DRAW VIEW FOR EACH SET OF DATA
    Object.keys(dataCollection).forEach(function(collection){
      if ( typeof dataCollection[collection] === 'object' ){
        // SURGE INTENSITIES  
        svg.append("g").attr("class", "surgeintensities--" + collection )
        .selectAll(".surgeintensity").data(dataCollection[collection].surge)
        .enter().append("rect").attr("class", "surgeintensity--" + collection)
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
        svg.append("g").attr("class", "minfares--" + collection )
          .selectAll(".maxfare").data(dataCollection[collection].minFare)
          .enter().append("rect").attr("class", "minfare--" + collection)
          .attr("width", function(d,i){ return 300 * (d / maxAvgFare); })
          .attr("height", barHeight)
          .attr("x", function(d){
            var shiftAmount = collection === 'MTWT' ? - 300*(d/maxAvgFare) -36 - 10 : 36 + 10;
            return graphWidth / 2 + leftPad + shiftAmount;
          })
          .attr("y",function(d,i){ return yScale(i) - barHeight; })
          .attr("fill", "RGBA(0,0,0,0)")
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

        svg.append("g").attr("class", "maxfares--" + collection)
          .selectAll(".maxfare").data(dataCollection[collection].maxFare)
          .enter().append("rect").attr("class","maxfare--" + collection)
          .attr("width", function(d,i){ return 300 * (d / maxAvgFare); })
          .attr("height", barHeight)
          .attr("x", function(d){
            var shiftAmount = collection === 'MTWT' ? - 300*(d/maxAvgFare) -36 - 10 : 36 + 10;
            return graphWidth / 2 + leftPad + shiftAmount;
          })
          .attr("y",function(d,i){ return yScale(i) - barHeight; })
          .attr("fill", "RGBA(0,0,0,0)")
          .attr("stroke-width",1)
          .attr("stroke", function(d,i){
            if (collection === 'MTWT' && d > dataCollection.FSS.maxFare[i]){
              return "RGBA(239, 72, 119, 1)";
            } else if (collection === 'FSS' && d > dataCollection.MTWT.maxFare[i]){
              return "RGBA(239, 72, 119, 1)";
            }
            return "grey";
          })
          .on("mouseenter", function(d,i){
            var thisNode = d3.select(this);
            // thisNode.call(growBar, 1000).call(shiftX, 1000)

            // function growBar(){}


            var finalWidth = +thisNode.attr("width");
            thisNode.attr("width", 0).transition().duration(1000).attr("width", finalWidth);

            if ( thisNode.attr("class") === 'maxfare--MTWT' ){
              var startX = graphWidth / 2 + leftPad - 36 - 10
              var finalX = +thisNode.attr("x");
              console.log(startX, finalX)
              thisNode.attr("x", startX).transition().duration(1000).attr("x", 0);
            }
          })
          .attr("opacity",0).transition().duration(1000).delay(function(d,i){ return i * 100}).attr("opacity",1)
      }
    })

  });
};