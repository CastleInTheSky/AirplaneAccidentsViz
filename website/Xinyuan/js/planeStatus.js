planeStatus = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.status = _data;
    //this.fisheyeFunc = _fisheyeFunc;

    this.initVis();
}

planeStatus.prototype.initVis = function(){
    var vis = this;
    vis.margin = { top: 100, right: 50, bottom: 20, left: 50 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = 400 - vis.margin.top - vis.margin.bottom;

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

    vis.tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([0, 0])
        .html(function(d) {
            console.log(d);
            return "<strong>Frequency:</strong> <span style='color:red'>" + "Good" + "</span>";
        });




    // Extract the list of dimensions and create a scale for each.
    /*
     vis.x.domain(vis.dimensions = d3.keys(vis.status[0]).filter(function(d) {
     return d != "Year " && d != "Total " && (vis.y[d] = d3.scale.linear()
     .domain(d3.extent(vis.status, function(p) { return +p[d]; }))
     .range([vis.height, 0]));
     }));
     */
    //revised
    vis.x.domain(vis.dimensions = d3.keys(vis.status[0]).filter(function(d) {
        return d != "Status " && (vis.y[d] = d3.scale.linear()
                .domain([0,1])
                .range([vis.height, 0]));
    }));
    //console.log(vis.status);

    // Add grey background lines for context.
    vis.background = vis.svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(vis.status)
        .enter().append("path")
        .attr("d", path)
        .on("mouseover", function (d) {
            d3.select(this).style("stroke-width", 5);
            d3.select(this).style("stroke-opacity", 1);
            d3.select(this).style("stroke", "red");
            console.log("d");
            console.log(d);
            vis.tip.show(d);
        })
        .on("mouseout", function (d) {
            d3.select(this).style("stroke-width", 1);
            d3.select(this).style("stroke-opacity", 0.5);
            d3.select(this).style("stroke", "grey");
            vis.tip.hide(d);
        });



    // Add blue foreground lines for focus.
    vis.foreground = vis.svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(vis.status)
        .enter().append("path")
        .attr("d", path)
        .on("mouseover", function (d) {
            d3.select(this).style("stroke-width", 5);
            d3.select(this).style("stroke-opacity", 1);
            d3.select(this).style("stroke", "red");
            console.log("select tip");
            console.log("hellohello");
            console.log(d);
            vis.tip.show(d);

        })
        .on("mouseout", function (d) {
            d3.select(this).style("stroke-width", 1);
            d3.select(this).style("stroke-opacity", 0.5);
            d3.select(this).style("stroke", "grey");
            vis.tip.hide(d);


        });

    vis.svg.call(vis.tip);
   // vis.foreground.call(vis.tip);

    // Add a group element for each dimension.
    vis.g = vis.svg.selectAll(".dimension")
        .data(vis.dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + vis.fisheye(vis.x(d)) + ")"; });

    var height = [300,250,200,100,100,150,200,250,300];
    var count=-1;
    // Add an axis and title.
    vis.g.append("g")
        .attr("class", "phaseChart_axis")
        .each(function(d) { d3.select(this).call(vis.axis.scale(vis.y[d]).ticks(0)); })
        .append("text")
        .attr("y", function (d) {
            //console.log(height);
            count=count+1;
            return height[count];

        })
        .attr('font-family', 'FontAwesome')
        .attr('font-size', function(d) { return '3em';} )
        .style("fill", "white")
        .text(function(d) { return '\uf072' });



    // Add and store a brush for each axis.
    vis.g.append("g")
        .attr("class", "brush")
        .each(function(d) {
            d3.select(this).call(vis.y[d].brush = d3.svg.brush().y(vis.y[d]).on("brush", brush));
        })
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
       // return vis.line(vis.dimensions.map(function(p) { return [vis.fisheye(vis.x(p)), vis.y[p](d[p])]; }));
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


planeStatus.prototype.onMouseMove=function(focus){
    var vis = this;
    vis.fisheye.focus(focus);
    vis.g.attr("transform", function(d) { return "translate(" + vis.fisheye(vis.x(d)) + ")"; });
}