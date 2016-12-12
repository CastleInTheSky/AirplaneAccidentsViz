/**
 * Created by sophiasi on 11/26/16.
 */
Linechart = function(_parentElement, _month, _data){
    this.parentElement = _parentElement;
    this.month = _month;
    this.data = _data;
    this.displayData = _data;
    this.initVis();
}
Linechart.prototype.initVis = function(){
    var vis = this;
    //margin properties
    vis.margin = { top: 20, right: 0, bottom: 20, left: 40 };
    vis.width = 180 - vis.margin.left - vis.margin.right
    vis.height = 143 - vis.margin.top - vis.margin.bottom

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.svg.append("g")
        .append("text")
        .text(vis.month)
        .attr("x",vis.width/2 - 10)
        .attr("y",-5)
        .attr("fill","rgba(217, 27, 40, 0.75)");

    //set the x-axis and y-axis
    vis.x = d3.time.scale()
        .range([0,vis.width]);

    vis.x
        .domain([yearFormatter.parse("1910"),yearFormatter.parse("2010")]);

    vis.y = d3.scale.linear()
        .range([vis.height, 0]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .tickFormat(d3.time.format('%Y'))
        .ticks(d3.time.year,20 )
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
    //selection
    vis.selectValue = "total_fatalities";
    //line chart
    vis.line = d3.svg.line()
    //.curve(d3.curveBasis)
        .interpolate("linear")
        .x(function(d) { return vis.x(d.key); })
        .y(function(d) {return vis.y(d.values[vis.selectValue]); });


    //default selection
    vis.selectValue = "total_fatalities";
    vis.filterData = vis.data;
    // (Filter, aggregate, modify data)
    vis.wrangleData();
}


/*
 * Data wrangling
 */

Linechart.prototype.wrangleData = function(){
    var vis = this;

    vis.displayData = d3.nest()
        .key(function(d) { return d.month; })
        .sortKeys(function (a,b) {return month(monthNameFormat.parse(a)) -
            month(monthNameFormat.parse(b));
        })
        .key(function (d) {
            return d.decade
        })
        .sortKeys(d3.ascending)
        .rollup(function(leaves) { return {"total_accidents": leaves.length,
            "total_fatalities": d3.sum(leaves, function(d) {return d["total_fatalities"]})
        } })
        .entries(vis.filterData);

    vis.displayData.forEach(function (d) {
        d.values.forEach(function (d) {
            d.key = yearFormatter.parse(d.key.toString())
        })

    })


    // Update the visualization
    vis.updateVis();
}


/*
 * The drawing function
 */

Linechart.prototype.updateVis = function(){
    var vis = this;


    //update and show axis


    vis.y
        .domain([0,d3.max(vis.displayData, function (d) {
            return d3.max(d.values,function (child) {
                return child.values[vis.selectValue];
            })
        })]);



    //console.log(vis.x(yearFormattter.parse("2009")));
    //console.log(vis.x.range());
    vis.months = vis.svg.selectAll(".line")
        .data(vis.displayData);

    vis.months
        .enter()
        .append("path")
        .attr("class", "line")

    vis.months
        .transition()
        .attr("d", function(d) {
            //console.log(d.values);
            return vis.line(d.values); })
        .style("stroke", function(d) {
            if (d.key == vis.month) {return "rgba(217, 27, 40, 0.75)";}
            else {return "rgba(184, 187, 193, 0.37)"}});

    vis.months.exit().remove();

    vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);


}
Linechart.prototype.selectionChanged = function(brushRegion){
    var vis = this;


    // Filter data accordingly without changing the original data

    var min = brushRegion[0] > brushRegion[1] ? brushRegion[1] : brushRegion[0];
    var max = brushRegion[0] > brushRegion[1] ? brushRegion[0] : brushRegion[1];
    //filter initial form data!
    vis.filterData = vis.data.filter(function (d) {
        return yearFormatter.parse((d.decade + 10).toString()) >= min && yearFormatter.parse((d.decade - 10).toString()) <= max;
    });
    vis.x.domain([yearFormatter.parse(vis.filterData[0].decade.toString()),yearFormatter.parse(vis.filterData[vis.filterData.length - 1].decade.toString())]);

    //console.log(yearFormattter.parse(vis.filterData[0].decade.toString()),yearFormattter.parse(vis.filterData[vis.filterData.length - 1].decade.toString()));
    //console.log(vis.filterData);
    // Update the visualization
    vis.wrangleData();

}
Linechart.prototype.selectionMonth1 = function (month) {
    var vis = this;

    vis.months
        .style("stroke", function(d) {
            if (d.key == month) {return "#42DCA3";}
            else if (d.key == vis.month){
                return "rgba(217, 27, 40, 0.75)";
            }
            else {return "rgba(184, 187, 193, 0.37)"}
        });
}
Linechart.prototype.selectionMonth0 = function (month) {
    var vis = this;

    vis.months
        .style("stroke", function(d) {
            if (d.key == vis.month) {return "rgba(217, 27, 40, 0.75)";}
            else {return "rgba(184, 187, 193, 0.37)"}});

}

Linechart.prototype.typeChange = function (value) {
    var vis = this;
    vis.selectValue = value;

    vis.wrangleData();
}


