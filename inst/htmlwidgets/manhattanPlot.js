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


        //if data is large (low performance) or animation speed is super, low kill transitions.
        if (transitionSpeed < 1) {
            console.log("big data or low transition speed!")
            updateTime = 0
            delayTime  = 0
        }

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
                .attr("transform", "translate(" + 22 + ",0)")
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

            var dataMax    = d3.max(data, function(d) { return d.PVal }),
                bonferroni = -Math.log10(.05 / data.length),
                maxVal     = d3.max([dataMax, bonferroni + .5]),
                minVal     = d3.min(data, function(d) { return d.PVal });

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
                .enter()
                .append("circle")
                .attr("cx", function(d, i) { return xScale(i); })
                .attr("cy", height + 10)
                .attr("r", 5)
                .on("mouseover", function(d) {
                    d3.select(this).transition() //make the point bigger
                        .attr("r", 10)

                    d3.select("#" + d.SNP).transition() //move the line with it.
                        .attr("y2", function(d) { return (yScale(d.PVal) + 10);})

                    var xPos = parseFloat(d3.select(this).attr("cx"));
                    var yPos = parseFloat(d3.select(this).attr("cy"));
                    drawTooltip(d, xPos, yPos)
                })
                .on("mouseout", function(d){
                    d3.select(this) //bring the dot size back down
                        .transition()
                        .attr("r", 5)

                    d3.select("#" + d.SNP).transition()
                        .attr("y2", function(d) { return (yScale(d.PVal) + 5);})

                    d3.select("#tooltip").remove(); //kill the tooltip.
                })
                .transition()
                .duration(updateTime)
                .delay(function(d, i) {
                    return delayTime * i;
                })
                .attr("fill", function(d) {
                    return colorScale(d.PVal);
                })
                .attr("cy", function(d) {
                    return (yScale(d.PVal));
                })

            //Draw the lines (or balloon strings) beneath the points.
            var lines = svg.selectAll(".balloonString")
                .data(data, function(d) { return d.SNP; })

            lines
                .enter()
                .append("line")
                .attr("id", function(d){return d.SNP})
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

            gy.transition()
                .duration(updateTime)
                .call(yAxis)
                .selectAll("text") // cancel transition on customized attributes
                .tween("attr.x", null)
                .tween("attr.dy", null);

            gy.call(customAxis);

        }

        function drawTooltip(d, x, y){
            var right = x > width/2,
                w = 130,
                xLoc = right ? (x - w - 5) : (x + 5);

            var tip = svg.append("g") //Make a holder for the text
                .attr("id", "tooltip")
                .attr("transform", "translate(" + xLoc + ", " + (y+5) + ")") //position it over the point

            tip.append("rect")
                .attr("class", "tooltipRect")
                .attr("width", w)
                .attr("height", 50)
                .attr("rx", 15)
                .attr("ry", 15)
                .attr("fill", "#f0f0f0")

            var name = tip.append("text") //write the snp name
                .attr("y", 20)
                .attr("x", 5)
                .style("font-size", "0px")

            name.append("tspan")
                .style("font-weight", "bold")
                .text("SNP: ")

            name.append("tspan")
                .text( d.SNP )

            name.transition().duration(250)
                .style("font-size", "14px")

            var ps = tip.append("text") //write the pvalue
                .attr("y", 40)
                .attr("x", 5)
                .style("font-size", "0px")

            ps.append("tspan")
                .style("font-weight", "bold")
                .text("P-Value: ")

            ps.append("tspan")
                .text( Math.pow(10, -d.PVal).toExponential(4) )

            ps.transition().duration(250)
                .style("font-size", "14px")
            }

        updateManhattan(data, transitionSpeed) //get it all running!

    },

    resize: function(el, width, height, instance) {

    }

});
