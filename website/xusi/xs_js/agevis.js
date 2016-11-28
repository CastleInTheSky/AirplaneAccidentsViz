
/*
 * AgeVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

AgeVis = function(_parentElement, _data){
	this.parentElement = _parentElement;
	this.data = _data;
	this.displayData = _data;
	this.initVis();
}


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

AgeVis.prototype.initVis = function(){
	var vis = this;

	vis.margin = { top: 20, right: 20, bottom: 200, left: 60 };

	vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
	vis.height = 500 - vis.margin.top - vis.margin.bottom;

	// SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
		.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


	// Scales and axes
	vis.x = d3.scale.linear()
			.range([0, vis.width])
			.domain([0,99]);

	vis.y = d3.scale.linear()
			.range([vis.height, 0]);

	vis.xAxis = d3.svg.axis()
			.scale(vis.x)
			.orient("bottom");

	vis.yAxis = d3.svg.axis()
			.scale(vis.y)
			.orient("left");


	// Append a path for the area function, so that it is later behind the brush overlay
	vis.agePath = vis.svg.append("path")
			.attr("class", "area area-age");

	// Define the D3 path generator
	vis.area = d3.svg.area()
		.x(function(d,index) { return vis.x(index); })
		.y0(vis.height)
		.y1(function(d) { return vis.y(d); });

	vis.area.interpolate("cardinal");


	// Append axes
	vis.svg.append("g")
			.attr("class", "x-axis axis")
			.attr("transform", "translate(0," + vis.height + ")");

	vis.svg.append("g")
			.attr("class", "y-axis axis");

	// Axis titles
	vis.svg.append("text")
			.attr("x", -50)
			.attr("y", -8)
			.text("Votes");
	vis.svg.append("text")
			.attr("x", vis.width - 5)
			.attr("y", vis.height + 25)
			.text("Age");
 

	// (Filter, aggregate, modify data)
	//vis.data.forEach()
	vis.wrangleData();
}



/*
 * Data wrangling
 */

AgeVis.prototype.wrangleData = function(){
	var vis = this;

	// Create a sequence of values from 0 - 98 (age: 1-99; array length: 99)
	var votesPerAge = d3.range(0,99).map(function () {
		return 0;
	})
	//console.log(vis.displayData);
	// Iterate over each day
	vis.displayData.forEach(function (day) {

		day.ages.forEach(function (d,i) {
			if (i>=1 && i<=99)
			votesPerAge[i-1] += d;
		})
	});

	//console.log(votesPerAge);
	vis.displayData = votesPerAge;

	// Update the visualization
	vis.updateVis();
}



/*
 * The drawing function
 */

AgeVis.prototype.updateVis = function(){
	var vis = this;

	// Update domains
	vis.y.domain(d3.extent(vis.displayData));


	// Call the area function and update the path
	// D3 uses each data point and passes it to the area function.
	// The area function translates the data into positions on the path in the SVG.
	vis.agePath
			.datum(vis.displayData)
			.transition()
			.attr("d", vis.area);


	// Call axis function with the new domain 
	vis.svg.select(".x-axis").call(vis.xAxis);
	vis.svg.select(".y-axis").call(vis.yAxis);
}


AgeVis.prototype.onSelectionChange = function(selectionStart, selectionEnd){
	var vis = this;

	//console.log(selectionStart, selectionEnd);
	// Filter data depending on selected time period (brush)
	vis.displayData = vis.data.filter(function (d) {
		if (d.time >= selectionStart && d.time <= selectionEnd) {
			return d;
		}
	});


	//data range
	$("#date_start").text(dateFormatter(selectionStart));
	$("#date_end").text(dateFormatter(selectionEnd));

	vis.wrangleData();
}
