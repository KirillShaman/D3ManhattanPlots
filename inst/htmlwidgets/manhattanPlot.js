HTMLWidgets.widget({

    name: 'manhattanPlot',

    type: 'output',

    initialize: function(el, width, height) {

        return {
            // TODO: add instance fields as required
        }

    },

    renderValue: function(el, x, instance) {

        var data = HTMLWidgets.dataframeToD3(x.data);

        var width = el.getBoundingClientRect().width,
            height = el.getBoundingClientRect().height,
            padding = 15,
            red = "#e41a1c",
            blue = "#377eb8",
            transitionSpeed = x.settings.animationSpeed,
            delayTime = transitionSpeed/x.data.SNP.length;
            yScale = d3.scale.linear().domain([0, 1]).range([height, padding]), //values wont exceed 1 ever.
            xScale = d3.scale.ordinal().domain([0, 1]).rangePoints([padding * 4, width - padding], 0),
            colorScale = d3.scale.linear().domain([0, 1]).range([blue, red]),
            yAxis = d3.svg.axis().scale(yScale).orient("right");

        var svg = d3.select(el)
            .append("svg:svg")
            .attr("width", width)
            .attr("height", height);

        var axisLabel = svg.append("text")
            .text("-log10(P-Val)")
            .attr("transform", "translate(" + (13) + "," + (height / 2) + ")rotate(-90)")

        function customAxis(g) {
            g.selectAll("line")
                .style("fill", "none")
                .style("stroke", "#000")
                .style("shape-rendering", "crispEdges")

            g.selectAll("text")
                .attr("x", 4)
                .attr("dy", -2);
            g
                .attr("transform", "translate(" + 30 + ",0)")
        }

        var gy = svg.append("g")
            .attr("class", "axis")
            .call(yAxis)
            .call(customAxis)

        if (x.settings.sigLine){
            var significanceBar = svg.append("line")
                .attr("x1", padding * 2)
                .attr("x2", width - padding)
                .attr("y1", yScale(0))
                .attr("y2", yScale(0))
                .attr("stroke-width", 2)
                .attr("stroke", "black")

            var significanceText = svg.append("text")
                .attr("x", width - padding)
                .attr("y", 0)
                .attr("text-anchor", "end")
                .text("")
        }

        function updateManhattan(data, updateTime) {
            // delayTime = 20;
            console.log(delayTime)
            if (data.length > 200) { //if it is a small dataset do transitions.
                updateTime = 0
                delayTime = 0
            }

            for (var i = 0; i < data.length; i++) {
                data[i].PVal = parseFloat(data[i].PVal);
                delete data[i][""] //because I am a neat freak.
            }

            var dataMax = d3.max(data, function(d) {
                    return d.PVal
                }),
                bonferroni = -Math.log10(.05 / data.length),
                maxVal = d3.max([dataMax, bonferroni + .5]),
                minVal = d3.min(data, function(d) {
                    return d.PVal
                });

            yScale.domain([0, maxVal])
            xScale.domain(d3.range(data.length + 1))
            colorScale.domain([minVal, maxVal])

            if(x.settings.sigLine){
                significanceBar
                    .transition()
                    .duration(updateTime)
                    .attr("y1", yScale(bonferroni))
                    .attr("y2", yScale(bonferroni))

                significanceText
                    .transition()
                    .duration(updateTime)
                    .attr("y", yScale(bonferroni) - 5)
                    .text("Needed for significance")
            }

            //Draw the points
            var points = svg.selectAll("circle")
                .data(data, function(d) {
                    return d.SNP;
                })

            points
                .exit()
                .transition()
                .duration(updateTime / 2)
                .attr("cy", 0)
                .remove()

            points
                .enter()
                .append("circle")
                .attr("cx", function(d, i) {
                    return xScale(i);
                })
                .attr("cy", height + 10)
                .attr("r", 5)
                .on("mouseover", function(d) {
                    d3.select(this)
                        .transition()
                        .attr("r", 10)
                    var xPos = parseFloat(d3.select(this).attr("cx"));
                    var yPos = parseFloat(d3.select(this).attr("cy"));
                    updateTooltip(d, xPos, yPos)
                })
                .on("mouseout", function(){
                    d3.select(this) //bring the dot size back down
                        .transition()
                        .attr("r", 5)

                    d3.select("#tooltip").classed("hidden", true); //hide the tooltip.
                })
                .transition()
                .duration(updateTime)
                .delay(function(d, i) {
                    return delayTime * i;
                })
                .attr("cy", function(d) {
                    return (yScale(d.PVal));
                })
                .transition()
                .attr("fill", function(d) {
                    return colorScale(d.PVal);
                })


            points
                .transition()
                .duration(updateTime)
                .delay(function(d, i) {
                    return delayTime * i;
                })
                .attr("cx", function(d, i) {
                    return xScale(i);
                })
                .attr("cy", function(d) {
                    return (yScale(d.PVal));
                })
                .attr("fill", function(d) {
                    return colorScale(d.PVal);
                })


            //Draw the lines beneath the points.

            var lines = svg.selectAll(".balloonString")
                .data(data, function(d) { return d.SNP; })

            lines
                .exit()
                .transition()
                .duration(updateTime / 2)
                .attr("y1", height + 10)
                .attr("y2", height + 10)
                .remove()

            lines
                .enter()
                .append("line")
                .attr("x1", function(d, i) { return xScale(i); })
                .attr("x2", function(d, i) { return xScale(i); })
                .attr("y1", height + 10)
                .attr("y2", height + 10)
                .attr("stroke-width", 1)
                .attr("stroke", "black")
                .transition()
                .duration(updateTime)
                .delay(function(d, i) { return delayTime * i; })
                .attr("y2", function(d) { return (yScale(d.PVal) + 5);})


            lines
                .transition()
                .duration(updateTime)
                .delay(function(d, i) { return delayTime * i; })
                .attr("x1", function(d, i) { return xScale(i); }) //doesnt matter because user cant change data.
                .attr("x2", function(d, i) { return xScale(i); }) //But I guess it's good to keep.
                .attr("y2", function(d) { return (yScale(d.PVal) + 5);})


            gy.transition()
                .duration(updateTime)
                .call(yAxis)
                .selectAll("text") // cancel transition on customized attributes
                .tween("attr.x", null)
                .tween("attr.dy", null);

            gy.call(customAxis);

        }

        function startTooltip(){
            var tip = d3.select(el).append("div")
                .attr("id", "tooltip")
                .attr("class", "hidden")

            var snpName = tip.append("p")

            snpName.append("strong")
                .text("SNP: ")

            snpName.append("span")
                .attr("id", "snpName")
                .text("")

            var pValueShow = tip.append("p")

            pValueShow.append("strong")
                .text("P-Value: ")

            pValueShow.append("span")
                .attr("id", "pValueShow")
        }

        function updateTooltip(d, x, y){
            var right = x > width/2,
            xLoc;
            //if tooltip is on right side of viz put it on the left side of the point
            if (right){//so that it doesnt run off the screen.
                var xLoc = x - 150 - padding //the tooltip is 150px wide.
            } else { //if it is on left half
                xLoc = x  + padding; //frustratingly uneven.
            }
            d3.select("#snpName").text(d.SNP)
            d3.select("#pValueShow").text(Math.pow(10, -d.PVal).toExponential(4))

            //Update the tooltip position and value
            d3.select("#tooltip")
              .style("left", xLoc + "px")
              .style("top",  y + padding + "px");

            //Show the tooltip
            d3.select("#tooltip").classed("hidden", false);
        }

        startTooltip() //Initialize the tooltip.
        updateManhattan(data, transitionSpeed) //get it all running!

    },

    resize: function(el, width, height, instance) {

    }

});
