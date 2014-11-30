function resizeRender (){
  graphsContainerHeight = window.innerHeight - document.getElementById('header').offsetHeight;
  document.getElementById('graph-left').setAttribute("style","height:" + (graphsContainerHeight - 80) + "px")
  document.getElementById('graph-right-top').setAttribute("style","height: 70px")
  document.getElementById('graph-right-bottom').setAttribute("style","height:" + (graphsContainerHeight - 192) + "px")

  ///////////////////////////////////////////////////////////////////
  //UPDATE LEFT GRAPH VARIABLES /////////////////////////////////////
  graphLeftWidth = document.getElementById('graph-left').offsetWidth;
  graphLeftHeight = document.getElementById('graph-left').offsetHeight - leftTopPad - leftBottomPad;

  graphLeftBarWidth = graphLeftWidth / 2 - 2 * 36;

  // UPDATE CANVAS
  d3.select("#graph-left-content")
    .attr("width", graphLeftWidth)
    .attr("height", document.getElementById('graph-left').offsetHeight)

  // UPDATE SCALES
  graphLeftXScale = d3.scale.linear().range([0, graphLeftWidth]);
  graphLeftYScale = d3.scale.linear().range([leftTopPad, graphLeftHeight - leftTopPad - leftBottomPad]).domain([0, 23]);

  // UPDATE TIME LABELS
  d3.selectAll(".hours").data(new Array(24))
    .attr("x", function(){
      if (graphLeftHeight < 400){
        return graphLeftWidth / 2 - 10 / 2 + 6;
      }
      return graphLeftWidth / 2 - 12 / 2 + 6;
    })
    .attr("y",function(d,i){ return graphLeftYScale(i) + leftTopPad; })
    .style("font-size", verticalFont )

    // DAY OF WEEK
    d3.selectAll(".legendtext")
      .attr("x", function(d){
        var shiftAmount = d.className === 'MTWTF' ? -20 : 20;
        return graphLeftWidth / 2 + shiftAmount;
      })

    // SURGE INTESNSITY
    d3.selectAll(".surgeintensity--rect")
      .attr("width", graphLeftWidth / 12)
      .attr("y", function(d,i){
        return graphLeftHeight + leftTopPad + leftBottomPad - 30;
      })
      .attr("x", function(d,i){
        var shift = graphLeftWidth / 4;
        return i * (graphLeftWidth / 12 + 1.5) + shift - 1.5 * 5;
      })

  d3.selectAll(".surgeintensity--text")
    .attr("y", function(d,i){
      return graphLeftHeight + leftTopPad + leftBottomPad - 10;
    })
    .attr("x", function(d,i){
      var shift = i === 5 ? graphLeftWidth / 4 + (graphLeftWidth / 12) - 50 : graphLeftWidth / 4;
      return i * (graphLeftWidth / 12 + 1.5) + shift - 1.5 * 5;
    })


  ///////////////////////////////////////////////////////////////////
  //UPDATE TOP RIGHT GRAPH VARIABLES ////////////////////////////////
  graphRightTopWidth = document.getElementById('graph-right-top').offsetWidth;
  graphRightTopHeight = document.getElementById('graph-right-top').offsetHeight;

  // UPDATE CANVAS
  d3.select("#graph-right-top-content")
    .attr("width", graphRightTopWidth)
    .attr("height", graphRightTopHeight)

  ///////////////////////////////////////////////////////////////////
  //UPDATE BOTTOM RIGHT GRAPH VARIABLES /////////////////////////////
  graphRightBottomWidth = document.getElementById('graph-right-bottom').offsetWidth;
  graphRightBottomHeight = document.getElementById('graph-right-bottom').offsetHeight - rightBottomTopPad - rightBottomBottomPad;

  // UPDATE CANVAS
  d3.select("#graph-right-bottom-svg")
    .attr("width", graphRightBottomWidth)
    .attr("height", document.getElementById('graph-right-bottom').offsetHeight)
  d3.select("#graph-right-bottom-content")
    .attr("transform","translate(" + rightBottomLeftPad + "," + rightBottomTopPad + ")")

  // UPDATE SCALES
  graphRightBottomXScale = d3.scale.linear().range([0, graphRightBottomWidth - rightBottomRightPad - rightBottomLeftPad]).domain([0, 23]);
  graphRightBottomYScale = d3.scale.linear().range([rightBottomTopPad, graphRightBottomHeight - rightBottomTopPad - rightBottomBottomPad]).domain([maxSurge, 1]);

  // UPDATE LINE PATH
  graphRightBottomLine = d3.svg.line().interpolate("monotone")
    .x(function(d){ return graphRightBottomXScale(d.hour); })

  // UPDATE LEGEND
  d3.selectAll(".legendcircles")
    .attr("cx", function(d,i){
      return graphRightBottomXScale(23) - 72 * (i+1) + 14;
    })

  d3.selectAll(".legendtext2")
    .attr("x", function(d,i){
      return graphRightBottomXScale(23) - 72 * i;
    })

  resizeData();
}

function resizeData(){
    // UPDATE BOTTOM RIGHT GRAPH COMPONENTS
    graphRightBottomLine.y(function(d){ return graphRightBottomYScale(d.surge); });
    graphRightBottomYAxis = d3.svg.axis().scale(graphRightBottomYScale).orient("left");
    graphRightBottomXAxis = d3.svg.axis().scale(graphRightBottomXScale).orient("bottom")
      .ticks(24).tickFormat(formatTime);

    // UPDATE DRAW AXIES
    d3.select(".y.axis").call(graphRightBottomYAxis)
    d3.select(".x.axis").call(graphRightBottomYAxis)
      .attr("transform","translate(" + 0 + "," + (graphRightBottomHeight - rightBottomTopPad - rightBottomBottomPad) + ")")
      .call(graphRightBottomXAxis)

    // UPDATE SUNRISE AND SUNSET LINES
    Object.keys(sunTimes).forEach(function(type){
      var hour = Number(sunTimes[type][0]) + (Number(sunTimes[type][1]) / 60);
      var description = type;
      if (description === 'sunrise' || description === 'goldenHour' || description === 'sunset'){
        d3.select(".sunposition--text." + description)
          .text(function(){
            var displayHour = +sunTimes[type][0] > 12 ? +sunTimes[type][0] - 12 : +sunTimes[type][0];
            var displayDesc = description === "goldenHour" ? "golden hour" : description
            return displayDesc.toUpperCase() + "  " + displayHour + ":" + sunTimes[type][1];
          })
          .attr("y", graphRightBottomXScale(hour))

        var textSize = document.getElementsByClassName("sunposition--text " + description)[0].getBBox();

        d3.selectAll(".sunposition--line." + description)
          .attr("x1", graphRightBottomXScale(hour))
          .attr("y1", graphRightBottomYScale(1))
          .attr("x2", graphRightBottomXScale(hour))
      }
    })

    // UPDATE VIEW FOR EACH SET OF DATA
    Object.keys(dataCollection).forEach(function(collection){
      if ( collection === 'MTWTF' || collection === 'SS' ){
        // SURGE INTENSITIES  
        d3.selectAll(".surgeintensity--" + collection)
          .attr("height", fareBarSize)
          .attr("x", function(){
            var shift = collection === 'MTWTF' ? - 25 : 18;
            return graphLeftWidth / 2 + shift;
          })
          .attr("y",function(d,i){ return graphLeftYScale(i) + leftTopPad - fareBarSize(); })

        // FARE BARS
        d3.selectAll(".maxfare--" + collection)
          .attr("width", function(d,i){ return graphLeftBarWidth * (d / maxAvgFare); })
          .attr("height", fareBarSize)
          .attr("x", function(d){
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) - 19 - 10 : 18 + 10;
            return graphLeftWidth / 2 + shiftAmount;
          })
          .attr("y",function(d,i){ return graphLeftYScale(i) + leftTopPad - fareBarSize(); })
          .each(growBars)

        // FARE BAR LABELS
        d3.selectAll(".maxfare--label." + collection)
          .attr("x", function(d){
            var barWidth = graphLeftBarWidth * (d / maxAvgFare);
            var shiftAmount = collection === 'MTWTF' ? - graphLeftBarWidth*(d/maxAvgFare) - 19 - 10 - 6 : 18 + 10 + barWidth + 6;
            return graphLeftWidth / 2 + shiftAmount;
          })
          .attr("y",function(d,i){ 
            return graphLeftYScale(i) + leftTopPad - 2;
          })
          .style("font-size", verticalFont)

        // SURGE TRENDS
        d3.select(".surgetrends--line." + collection)
          .attr("d", graphRightBottomLine )
      }

      // SURGE TREND DATA DOTS
      if ( collection === 'originalSortedData' ){
        Object.keys(dataCollection[collection]).forEach(function(set){
          d3.selectAll(".surgetrends--dot." + set)
            .attr("cx", function(d){
              return graphRightBottomXScale(d[0]);
            })
            .attr("cy", function(d){
              return graphRightBottomYScale(d[1]);
            })
        });
      }

      // UPDATE RATE TEXT
      if ( collection === 'bestTimesMTWTF' || collection === 'bestTimesSS' ){
        var set = collection === 'bestTimesSS' ? 'SS' : 'MTWTF';
        graphRightTopSVG.append("g").attr("class", "besttimes--times " + set)
        d3.selectAll(".besttimes--time")
          .attr('x', function(d,i){
            return graphRightBottomXScale(d) + 40;
          })

        d3.selectAll(".besttimes--hour")
          .attr('x', function(d,i){
            var offset = ( (d === 0) || d > 21 || (d > 9 && d < 13) ) ? 44/2 : 22 / 2;
            return graphRightBottomXScale(d) + offset + 40;
          })
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
}