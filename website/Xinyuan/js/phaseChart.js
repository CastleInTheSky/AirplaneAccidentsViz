phaseChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.phases = _data;
    //this.fisheyeFunc = _fisheyeFunc;

    this.initVis();
}

phaseChart.prototype.initVis = function(){
    var vis = this;
    vis.margin = { top: 100, right: 50, bottom: 100, left: 50 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = 600 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.x = d3.scale.ordinal().rangePoints([0, vis.width], 1);
    vis.y = {};

    vis.line = d3.svg.line();
    vis.axis = d3.svg.axis().orient("left");
    vis.fisheye = d3.fisheye.scale(d3.scale.identity).domain([0,vis.width]).focus(vis.width/2).distortion(3);






    // Extract the list of dimensions and create a scale for each.
    /*
    vis.x.domain(vis.dimensions = d3.keys(vis.phases[0]).filter(function(d) {
        return d != "Year " && d != "Total " && (vis.y[d] = d3.scale.linear()
                .domain(d3.extent(vis.phases, function(p) { return +p[d]; }))
                .range([vis.height, 0]));
    }));
    */
    //revised
    vis.x.domain(vis.dimensions = d3.keys(vis.phases[0]).filter(function(d) {
        return d != "Year " && d != "Total " && (vis.y[d] = d3.scale.linear()
                .domain([0,1])
                .range([vis.height, 0]));
    }));


    // Add grey background lines for context.
    vis.background = vis.svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(vis.phases)
        .enter().append("path")
        .attr("d", path);

    // Add blue foreground lines for focus.
    vis.foreground = vis.svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(vis.phases)
        .enter().append("path")
        .attr("d", path);

    // Add a group element for each dimension.
    vis.g = vis.svg.selectAll(".dimension")
        .data(vis.dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + vis.fisheye(vis.x(d)) + ")"; });

    // Add an axis and title.
    vis.g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(vis.axis.scale(vis.y[d])); })
        .append("text")
        .attr("text-anchor", "middle")
        .attr("y", -9)
        .text(String);

    // Add and store a brush for each axis.
    vis.g.append("g")
        .attr("class", "brush")
        .each(function(d) { d3.select(this).call(vis.y[d].brush = d3.svg.brush().y(vis.y[d]).on("brush", brush)); })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);

    // Update fisheye effect with mouse move.
    vis.svg.on("mousemove", function() {
        vis.fisheye.focus(d3.mouse(this)[0]);

        vis.foreground.attr("d", path);
        vis.background.attr("d", path);
        vis.g.attr("transform", function(d) { return "translate(" + vis.fisheye(vis.x(d)) + ")"; });
    });




    // Returns the path for a given data point.
    function path(d) {
        return vis.line(vis.dimensions.map(function(p) { return [vis.fisheye(vis.x(p)), vis.y[p](d[p])]; }));
    }

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        var actives = vis.dimensions.filter(function(p) { return !vis.y[p].brush.empty(); }),
            extents = actives.map(function(p) { return vis.y[p].brush.extent(); });
        vis.foreground.style("display", function(d) {
            return actives.every(function(p, i) {
                return extents[i][0] <= d[p] && d[p] <= extents[i][1];
            }) ? null : "none";
        });
    }



}

