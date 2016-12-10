/**
 * Created by sophiasi on 11/26/16.
 * This barchart_month.js is a constructor for month bar chart
 * Sum the number of air accidents/ total fatalities by month
 */

Barchart_month = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = _data;
    this.initVis();
}

Barchart_month.prototype.initVis = function(){
    var vis = this;

    vis.margin = { top: 50, right: 20, bottom: 20, left: 60 };

    vis.width = 500 - vis.margin.left - vis.margin.right,
        vis.height = 300 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom);


    vis.selectbar = vis.svg
        .append("g")
        .attr("transform", "translate(" + 300 + " ," + vis.margin.top + ")");

    vis.barchart = vis.svg
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


    // Scales and axes
    vis.x = d3.scale.ordinal()
        .rangeBands([0, vis.width], .5)
        .domain(d3.range(0,12));

    vis.y = d3.scale.linear()
        .range([vis.height,0]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .ticks(5)
        .orient("left");

    vis.barchart.append("g")
        .attr("class", "x-axis xsaxis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.barchart.append("g")
        .attr("class", "y-axis xsaxis");

    // Axis title
    vis.barchart.append("text")
        .attr("x", -50)
        .attr("y", -8)
        .text("Fatalities")
        .attr("fill","rgba(217, 27, 40, 0.75)");

    //default selection
    vis.selectValue = "total_fatalities";

    vis.filterData = vis.data;
    //console.log(vis.data);
    // (Filter, aggregate, modify data)
    vis.wrangleData();
}

Barchart_month.prototype.wrangleData = function(){
    var vis = this;

    vis.displayData = d3.nest()
        .key(function(d) { return d.month; })
        .sortKeys(function (a,b) {return month(monthNameFormat.parse(a)) -
            month(monthNameFormat.parse(b));
        })
        .rollup(function(leaves) { return {"total_accidents": leaves.length,
            "total_fatalities": d3.sum(leaves, function(d) {return d["total_fatalities"];})} })
        .entries(vis.filterData);

    //console.log(vis.displayData);

    vis.updateVis();

    //console.log(nested_data);
}

Barchart_month.prototype.updateVis = function(){
    var vis = this;

    // Update domains
    vis.y.domain([0, d3.max(vis.displayData, function (d) {
        return d.values[vis.selectValue]
    })]);



    // Draw actual bars
    var bars = vis.barchart.selectAll(".bar")
        .data(this.displayData)

    bars.enter().append("rect")
        .attr("class", "bar")
        .on("mouseover", function() {
             d3.select(this)
                 //.transition()
                 .style("fill", "rgba(239, 28, 40, 0.42)");
        })
        .on("mouseout", function(d) {
            d3.select(this)
                .style("fill", "rgba(217, 27, 40, 0.75)");
        });

    bars
        .transition()
        .attr("width", vis.x.rangeBand())
        .attr("height", function(d){
            return vis.height - vis.y(d.values[vis.selectValue]);
        })
        .attr("x", function(d, index){
            return vis.x(index);
        })
        .attr("y", function(d){
            return vis.y(d.values[vis.selectValue]);
        });


    bars.exit().remove();


    // Call axis function with the new domain
    vis.barchart.select(".y-axis").call(vis.yAxis);

    vis.barchart.select(".x-axis").call(vis.xAxis)
        .selectAll("text")
        .text(function (i) {
            return vis.displayData[i].key;
        })
        .style("text-anchor", "middle");
        //.attr("dx", "-.8em")
        //.attr("dy", ".15em");
        /*.attr("transform", function(d) {
            return "rotate(-45)"
        });*/
}

Barchart_month.prototype.selectionChanged = function(brushRegion){
    var vis = this;

    // Filter data accordingly without changing the original data

    var min = brushRegion[0] > brushRegion[1] ? brushRegion[1] : brushRegion[0];
    var max = brushRegion[0] > brushRegion[1] ? brushRegion[0] : brushRegion[1];
    //filter initial form data!
    vis.filterData = vis.data.filter(function (d) {
        return yearFormatter.parse(d.year.toString()) >= min && yearFormatter.parse(d.year.toString()) <= max;
    });
    //console.log(vis.filterData);
    // Update the visualization
    vis.wrangleData();

}
