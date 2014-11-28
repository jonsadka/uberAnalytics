function resizeRender (){
  var graphsContainerHeight = window.innerHeight - document.getElementById('header').offsetHeight;
  document.getElementById('graph-left').setAttribute("style","height:" + (graphsContainerHeight - 80) + "px")
  document.getElementById('graph-right-top').setAttribute("style","height: 70px")
  document.getElementById('graph-right-bottom').setAttribute("style","height:" + (graphsContainerHeight - 192) + "px")

  ///////////////////////////////////////////////////////////////////
  //SETUP LEFT GRAPH VARIABLES //////////////////////////////////////
  var graphLeftWidth = document.getElementById('graph-left').offsetWidth;
  var graphLeftHeight = document.getElementById('graph-left').offsetHeight - leftTopPad - leftBottomPad;

  var graphLeftBarWidth = graphLeftWidth / 2 - 2 * 36;

  // CREATE CANVAS
  var graphLeftSVG = d3.select("#graph-left-content")

  graphLeftSVG
    .attr("width", graphLeftWidth)
    .attr("height", document.getElementById('graph-left').offsetHeight)

  // ESTABLISH SCALES
  graphLeftXScale = d3.scale.linear().range([0, graphLeftWidth]);
  graphLeftYScale = d3.scale.linear().range([leftTopPad, graphLeftHeight - leftTopPad - leftBottomPad]).domain([0, 23]);

  // APPEND TIME LABELS
  d3.selectAll(".hours").data(new Array(24))
    .attr("x", function(){
      if (graphLeftHeight < 400){
        return graphLeftWidth / 2 - 10 / 2 + 6;
      }
      return graphLeftWidth / 2 - 12 / 2 + 6;
    })
    .attr("y",function(d,i){ return graphLeftYScale(i) + leftTopPad; })
    .style("font-size", function(){ if (graphLeftHeight < 400) return 10; return 12; })

  // // APPEND LEGEND
  // var graphLeftLegendContainer = graphLeftSVG.append("g").attr("class", "graph-left-legend").attr("fill", "white");

  //   // DAY OF WEEK
  //   var graphLeftLegendData = [{className:"SS", label:"WEEKEND"},{className:"MTWTF", label:"WEEKDAY"}];
  //   graphLeftLegendContainer.selectAll("legendText").data(graphLeftLegendData)
  //     .enter().append("text")
  //     .attr("timeframe", function(d,i){ return d.className; })
  //     .text(function(d,i){
  //       return d.label;
  //     })
  //     .attr("x", function(d){
  //       var shiftAmount = d.className === 'MTWTF' ? -20 : 20;
  //       return graphLeftWidth / 2 + shiftAmount;
  //     })
  //     .attr("y", 22)
  //     .style("font-size", "18px")
  //     .attr("dy", "0.35em")
  //     .style("fill", "white")
  //     .attr("text-anchor", function(d){
  //       if (d.className === "SS") return "start";
  //       return "end";
  //     })
  //     .style("opacity", 0)
  //     .transition().delay(1000).duration(2000)
  //     .style("opacity", 1)

  //   // SURGE INTESNSITY
  //   graphLeftIntensityScale.domain([0,6])
  //   graphLeftLegendContainer.selectAll("rect").data(d3.range(6).map(function(a,i){ return i;})).enter().append("rect")
  //     .attr("width", graphLeftWidth / 12)
  //     .attr("height", 4)
  //     .attr("y", function(d,i){
  //       return graphLeftHeight + leftTopPad + leftBottomPad - 30;
  //     })
  //     .attr("x", function(d,i){
  //       var shift = graphLeftWidth / 4;
  //       return i * (graphLeftWidth / 12 + 1.5) + shift - 1.5 * 5;
  //     })
  //     .style("fill", graphLeftIntensityScale)
  //     .style("opacity", 0)
  //     .transition().delay(1000).duration(2000)
  //     .style("opacity", 1)

  // graphLeftLegendContainer.selectAll(".someText")
  //   .data(d3.range(6).map(function(a,i){ if ( i === 0 ){ return "Low Price"; } else{return "High Price";} }))
  //   .enter().append("text")
  //   .text(function(d,i){
  //     // return d
  //     if (i === 0 || i === 5) return d;
  //   })
  //   .attr("y", function(d,i){
  //     return graphLeftHeight + leftTopPad + leftBottomPad - 10;
  //   })
  //   .attr("x", function(d,i){
  //     var shift = i === 5 ? graphLeftWidth / 4 + (graphLeftWidth / 12) - 50 : graphLeftWidth / 4;
  //     return i * (graphLeftWidth / 12 + 1.5) + shift - 1.5 * 5;
  //   })
  //   .style("fill", "white")
  //   .style("font-size", "10px")
  //   .style("opacity", 0)
  //   .transition().delay(1000).duration(2000)
  //   .style("opacity", 1)

  // ///////////////////////////////////////////////////////////////////
  // //SETUP TOP RIGHT GRAPH VARIABLES /////////////////////////////////
  // var graphRightTopWidth = document.getElementById('graph-right-top').offsetWidth;
  // var graphRightTopHeight = document.getElementById('graph-right-top').offsetHeight;

  // // CREATE CANVAS
  // var graphRightTopSVG = d3.select("#graph-right-top").append("svg")
  //   .attr("width", graphRightTopWidth)
  //   .attr("height", graphRightTopHeight)
  //   .attr("id", "graph-right-top-content");

  // ///////////////////////////////////////////////////////////////////
  // //SETUP BOTTOM RIGHT GRAPH VARIABLES //////////////////////////////
  // var rightBottomTopPad = 15;
  // var rightBottomBottomPad = 10;
  // var rightBottomLeftPad = 50;
  // var rightBottomRightPad = 20;

  // var graphRightBottomWidth = document.getElementById('graph-right-bottom').offsetWidth;
  // var graphRightBottomHeight = document.getElementById('graph-right-bottom').offsetHeight - rightBottomTopPad - rightBottomBottomPad;

  // // CREATE CANVAS
  // var graphRightBottomSVG = d3.select("#graph-right-bottom").append("svg")
  //   .attr("width", graphRightBottomWidth)
  //   .attr("height", document.getElementById('graph-right-bottom').offsetHeight)
  //   .append("g")
  //     .attr("transform","translate(" + rightBottomLeftPad + "," + rightBottomTopPad + ")")
  //     .attr("id", "graph-right-bottom-content");

  // // ESTABLISH SCALES
  // var graphRightBottomXScale = d3.scale.linear().range([0, graphRightBottomWidth - rightBottomRightPad - rightBottomLeftPad]).domain([0, 23]);
  // var graphRightBottomYScale = d3.scale.linear().range([rightBottomTopPad, graphRightBottomHeight - rightBottomTopPad - rightBottomBottomPad]);

  // // ESTABLISH LINE PATH
  // var graphRightBottomLine = d3.svg.line().interpolate("monotone")
  //   .x(function(d){ return graphRightBottomXScale(d.hour); })

  // // APPEND LEGEND
  // var graphRightBottomLegendContainer = graphRightBottomSVG.append("g").attr("class", "graph-right-bottom-legend").attr("fill", "white");
  // var graphRightBottomLegendData = [{className:"SS", label:"weekend", color:"RGBA(33, 188, 215, 1)"},{className:"MTWTF", label:"weekday", color:"RGBA(173, 221, 237, 1)"}];
  // graphRightBottomLegendContainer.selectAll("legendCircles").data(graphRightBottomLegendData)
  //   .enter().append("circle")
  //   .attr("timeframe", function(d,i){ return d.className; })
  //   .attr("r", 5)
  //   .attr("cx", function(d,i){
  //     return graphRightBottomXScale(23) - 72 * (i+1) + 14;
  //   })
  //   .attr("cy", -2)
  //   .style("fill", function(d){
  //     return d.color;
  //   })
  //   .style("opacity", 0)
  //   .transition().duration(3400)
  //   .style("opacity", 1)
  //   .each("end", highlighLine)

  // graphRightBottomLegendContainer.selectAll("legendText").data(graphRightBottomLegendData)
  //   .enter().append("text")
  //   .attr("timeframe", function(d,i){ return d.className; })
  //   .text(function(d,i){
  //     return d.label;
  //   })
  //   .attr("x", function(d,i){
  //     return graphRightBottomXScale(23) - 72 * i;
  //   })
  //   .attr("y", -3)
  //   .style("font-size", "12px")
  //   .attr("dy", "0.35em")
  //   .style("fill", function(d){
  //     return d.color;
  //   })
  //   .style("text-anchor", "end")
  //   .style("opacity", 0)
  //   .transition().duration(3400)
  //   .style("opacity", 1)
  //   .each("end", highlighLine)

  //   function highlighLine(){
  //     var thisNode = d3.select(this);
  //     var timeframe = thisNode.attr("timeframe");

  //     thisNode.on("mouseover", function(d,i){
  //       d3.selectAll(".surgetrends--line." + timeframe)
  //         .transition().duration(400)
  //         .style("stroke-width", 6)
  //     });

  //     // prevent premature termination of transition event
  //     thisNode.on("mouseout", function(d,i){
  //       d3.selectAll(".surgetrends--line." + timeframe)
  //         .transition().duration(400).style("stroke-width", 1.5);
  //     });
  //   }
}