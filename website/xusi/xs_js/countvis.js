
/*
 * CountVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

CountVis = function(_parentElement, _data, myEventHandler){
	this.parentElement = _parentElement;
	this.data = _data;
	this.event = myEventHandler;

	this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

CountVis.prototype.initVis = function(){
	var vis = this;

	vis.margin = { top: 40, right: 0, bottom: 60, left: 60 };

	vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
	vis.height = 300 - vis.margin.top - vis.margin.bottom;


	// SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
		.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

	// Define the clipping region
	vis.svg.append("defs").append("clipPath")
		.attr("id", "clip")
		.append("rect")
		.attr("width", vis.width)
		.attr("height", vis.height);

	// Scales and axes
	vis.x = d3.time.scale()
		.range([0, vis.width])
		.domain(d3.extent(vis.data, function(d) { return d.Year; }));

	vis.y = d3.scale.linear()
		.range([vis.height, 0]);

	vis.xAxis = d3.svg.axis()
			.scale(vis.x)
			.orient("bottom");

	vis.yAxis = d3.svg.axis()
			.scale(vis.y)
			.ticks(6)
			.orient("left");


	// Set domains
	var minMaxY= [0, d3.max(vis.data.map(function(d){ return d.count; }))];
	vis.y.domain(minMaxY);

	var minMaxX = d3.extent(vis.data.map(function(d){ return d.time; }));
	vis.x.domain(minMaxX);


	vis.svg.append("g")
			.attr("class", "x-axis axis")
			.attr("transform", "translate(0," + vis.height + ")");

	vis.svg.append("g")
			.attr("class", "y-axis axis");

	// Axis title
	vis.svg.append("text")
			.attr("x", -50)
			.attr("y", -8)
			.text("Votes");


	// Append a path for the area function, so that it is later behind the brush overlay
	vis.timePath = vis.svg.append("path")
			.attr("class", "area area-time");

	// Define the D3 path generator
	vis.area = d3.svg.area()
		.x(function(d) { return vis.x(d.time); })
		.y0(vis.height)
		.y1(function(d) { return vis.y(d.count); });
	 
	vis.area.interpolate("step");


	// Initialize brushing component

	vis.brush = d3.svg.brush()
		.x(vis.x)
		.on("brush", function(){
			if(vis.brush.empty()) {
				// No region selected (brush inactive)
				$(vis.event).trigger("selectionChanged", vis.x.domain());
			} else {
				// User selected specific region
				$(vis.event).trigger("selectionChanged", vis.brush.extent());
				vis.currentBrushRegion = vis.brush.extent();
			}
		});


	// Append brush component here
	vis.svg.append("g")
		.attr("class", "brush")
		.attr("clip-path", "url(#clip)");

	//Initializing zoom component
	vis.zoom = d3.behavior.zoom()
		.on("zoom", function(){
			if (vis.currentBrushRegion){
				vis.brush.extent(vis.currentBrushRegion);
			}
			vis.updateVis();
		})
		.scaleExtent([1,20])

	//Append x scale to zoom component
	vis.zoom.x(vis.x);

	//Activate zoom component
	vis.svg.select(".brush")
		.call(vis.zoom)
		.on("mousedown.zoom", null)
		.on("touchstart.zoom", null);


	// (Filter, aggregate, modify data)
	vis.wrangleData();
}



/*
 * Data wrangling
 */

CountVis.prototype.wrangleData = function(){
	var vis = this;

	this.displayData = this.data;
	// Update the visualization
	vis.updateVis();
}



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

CountVis.prototype.updateVis = function(){
	var vis = this;


	// Call brush component here
	vis.svg.select(".brush").call(vis.brush)
		.selectAll('rect')
		.attr("height", vis.height);


	// Call the area function and update the path
	// D3 uses each data point and passes it to the area function.
	// The area function translates the data into positions on the path in the SVG.
	vis.timePath
			.datum(vis.displayData)
			.attr("d", vis.area)
			.attr("clip-path", "url(#clip)");


	// Call axis functions with the new domain 
	vis.svg.select(".x-axis").call(vis.xAxis);
	vis.svg.select(".y-axis").call(vis.yAxis);

	//data range
	if(vis.brush.empty()){
		$("#date_start").text(dateFormatter(vis.x.domain()[0]));
		$("#date_end").text(dateFormatter(vis.x.domain()[1]));
	}

}