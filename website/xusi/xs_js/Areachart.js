/**
 * Created by sophiasi on 11/26/16.
 */

/*
 * AreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the area chart
 * @param _data						-- the dataset 'household characteristics'
 */

AreaChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = [];
    this.initVis();
}


/*
 * Initialize visualization (static content; e.g. SVG area, axes, brush component)
 */

AreaChart.prototype.initVis = function(){
    var vis = this;
    //margin properties
    vis.margin = { top: 40, right: 20, bottom: 40, left: 60 };
    vis.width = 500 - vis.margin.left - vis.margin.right
    vis.height = 150 - vis.margin.top - vis.margin.bottom

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    //set the x-axis and y-axis
    vis.x = d3.time.scale()
        .range([0,vis.width]);

    vis.y = d3.scale.linear()
        .range([vis.height, 0]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .tickFormat(d3.time.format('%Y'))
        .ticks(d3.time.year, 10)
        .outerTickSize(0)
        .orient("bottom");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .ticks(5)
        .orient("left");

    vis.svg.append("g")
        .attr("class", "x-axis xsaxis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis xsaxis");

    //draw the area chart
    vis.area = d3.svg.area()
        .interpolate("cardinal")
        .y0(vis.height);

    //default selection
    vis.selectValue = "total_fatalities";

    vis.data.forEach(function (d) {
        d.key = yearFormatter.parse(d.key.toString())
    })

    //Initialize brush component
    vis.brush = d3.svg.brush()
        .x(vis.x)
        .on("brush", brushed);

    // Append brush component
    vis.svg.append("g")
        .attr("class", "x brush")
        .call(vis.brush)
        .selectAll("rect")
        .attr("y", -6)
        .attr("height", vis.height + 7);

    vis.path = vis.svg.append("path")
        .datum(vis.data)
        .attr("class", "fill");

    //console.log(vis.data);
    // (Filter, aggregate, modify data)
    vis.wrangleData();
}


/*
 * Data wrangling
 */

AreaChart.prototype.wrangleData = function(){
    var vis = this;
    // Update the visualization
    vis.updateVis();
}


/*
 * The drawing function
 */

AreaChart.prototype.updateVis = function(){
    var vis = this;


    //update and show axis
    vis.x
        .domain([vis.data[0].key,vis.data[vis.data.length - 1].key]);

    vis.y
        .domain([0,d3.max(vis.data,function (d) {return d.values[vis.selectValue];})]);

    vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);

    //update chart area
    vis.area
        .x(function(d) { return vis.x(d.key); })
        .y1(function(d) { return vis.y(d.values[vis.selectValue]); });


    vis.path
        .transition()
        .attr("d", vis.area);

    // vis.path = vis.svg.selectAll(".area")
    //     .datum(vis.data)
    //     .enter();
    //
    // vis.path.append("path")
    //     .attr("class","area");
    //
    //
    // vis.path
    //     .attr("class", "fill")
    //     .attr("d", vis.area);
    //
    // vis.path.exit().remove();

    vis.brush.x(vis.x)


}

AreaChart.prototype.typeChange = function (value) {
    var vis = this;
    vis.selectValue = value;
    console.log(vis.selectValue);
    vis.updateVis();
}


