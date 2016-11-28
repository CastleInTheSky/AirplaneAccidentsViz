sunburstChart = function(_parentElement, _data, _myEventHandler){
    this.parentElement = _parentElement;
    this.hierarchy = _data;
   // this.displayData =this.data;
    this.sunburstEventHandler = _myEventHandler;
    //console.log(_data);
    this.initVis();
}

sunburstChart.prototype.initVis = function(){
    var vis = this;
    vis.margin = { top: 60, right: 100, bottom: 60, left: 100 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = 500 - vis.margin.top - vis.margin.bottom;
    vis.radius = Math.min(vis.width, vis.height) / 2;

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" +
            (vis.margin.left + vis.width  / 2) + "," +
            (vis.margin.top  + vis.height / 2) + ")");

    vis.x = d3.scale.linear()
        .range([0, 2 * Math.PI]);
    vis.y = d3.scale.sqrt()
        .range([0, vis.radius]);


    vis.partition = d3.layout.partition()
        .children(function(d) {
            return Array.isArray(d.values) ?
                d.values : null;
        })
        .value(function(d) {
            return d.values;
        });


    // Define a function that returns the color
    // for a data point. The input parameter
    // should be a data point as defined/created
    // by the partition layout.
    var color = function(d) {
        var colors;
        if (!d.parent) {

            colors = d3.scale.category10()
                .domain(d3.range(0,10));
            // White for the root node
            // itself.
            d.color = "#fff";
        } else if (d.children) {

            var startColor = d3.hcl(d.color)
                    .darker(),
                endColor   = d3.hcl(d.color)
                    .brighter();
            // Create the scale
            colors = d3.scale.linear()
                .interpolate(d3.interpolateHcl)
                .range([
                    startColor.toString(),
                    endColor.toString()
                ])
                .domain([0,d.children.length+1]);
        }
        if (d.children) {
            d.children.map(function(child, i) {
                return {value: child.value, idx: i};
            }).sort(function(a,b) {
                return b.value - a.value
            }).forEach(function(child, i) {
                d.children[child.idx].color = colors(i);
            });
        }
        return d.color;
    };
    // Define the function that constructs the
    // path for an arc corresponding to a data
    // value.
    vis.arc = d3.svg.arc()
        .startAngle(function(d) {
            return Math.max(0,
                Math.min(2 * Math.PI, vis.x(d.x)));
        })
        .endAngle(function(d) {
            return Math.max(0,
                Math.min(2 * Math.PI, vis.x(d.x + d.dx)));
        })
        .innerRadius(function(d) {
            return Math.max(0, vis.y(d.y));
        })
        .outerRadius(function(d) {
            return Math.max(0, vis.y(d.y + d.dy));
        });

        // Construct the visualization.
        vis.path = vis.svg.selectAll("path")
            .data(vis.partition.nodes(vis.hierarchy))
            .enter().append("path")
            .attr("d", vis.arc)
            .attr("stroke", "#fff")
            .attr("fill-rule", "evenodd")
            .attr("fill", color)
            .on("click", click)
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);
        // Add a container for the tooltip.
        vis.tooltip = vis.svg.append("text")
            .attr("font-size", 12)
            .attr("fill", "#000")
            .attr("fill-opacity", 0)
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + 0 + "," + (12 + vis.height/2)  +")")
            .style("pointer-events", "none");

        //add label
       /* vis.label = vis.svg.append("text")
        .attr("transform", function(d) { return "rotate(" + computeLabelRotation(d) + ")"; })
        .attr("x", function(d) { return vis.y(d.y); })
        .attr("dx", "6") // margin
        .attr("dy", ".35em") // vertical-align
        .text(function(d) { return d.name; });*/

        // Add the title.
      /*  vis.svg.append("text")
            .attr("font-size", 16)
            .attr("fill", "#000")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + 0 + "," + (-10 -vis.height/2)  +")")
            .text("Plane Crash Causes"); */
        // Handle clicks on data points. All
        // we need to do is start the transition
        // that updates the paths of the arcs.
        function click(d) {
            vis.path.transition()
                .duration(750)
                .attrTween("d", arcTween(d));
            // Hide the tooltip since the
            // path "underneath" the cursor
            // will likely have changed.
            mouseout();
        }
        // Handle mouse moving over a data point
        // by enabling the tooltip.
        function mouseover(d) {
            //console.log(d.key);
           /* vis.tooltip.text(d.key + ": " +
                d.value + " sighting" +
                (d.value > 1 ? "s" : ""))
                .transition()
                .attr("fill-opacity", 1);*/

            $(vis.sunburstEventHandler).trigger("selectionChanged", d.key);

        }
        // Handle mouse leaving a data point
        // by disabling the tooltip.
        function mouseout() {
            vis.tooltip.transition()
                .attr("fill-opacity", 0);
        }

    // Function to interpolate values for
    // the visualization elements during
    // a transition.
    function arcTween(d) {
        var xd = d3.interpolate(vis.x.domain(),
            [d.x, d.x + d.dx]),
            yd = d3.interpolate(vis.y.domain(),
                [d.y, 1]),
            yr = d3.interpolate(vis.y.range(),
                [d.y ? 20 : 0, vis.radius]);
        return function(d, i) {
            return i ?
                function(t) {
                    return vis.arc(d);
                } :
                function(t) {
                    vis.x.domain(xd(t));
                    vis.y.domain(yd(t)).range(yr(t));
                    return vis.arc(d);
                };
        };
    }



}
