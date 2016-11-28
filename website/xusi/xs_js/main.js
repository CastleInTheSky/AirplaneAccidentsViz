

// Function to convert date objects to strings or reverse
var dateFormatter = d3.time.format("%m/%d/%y");
var yearFormattter = d3.time.format("%Y");
var monthNameFormat = d3.time.format("%b");
var month = d3.time.format("%m");
var months = ["Jan", "Feb", "Mar", "Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var clean_data, clean_data_year;
var barchart_month, areachart;
var linechart = [];
// (1) Load data asynchronously
queue()
	.defer(d3.csv,"xusi/xs_data/data.csv")
	.await(createVisSixu);


function createVisSixu(error, data){
	if(error) { console.log(error); }

	data.forEach(function (d) {
		d.date = dateFormatter.parse(d.date)
	})

	clean_data = data.map(function (d) {
		return {
			//"date" : dateFormatter(d.date),
			"decade": +d.decade,
			"year": +d.year,
		 	"month": monthNameFormat(d.date),
			"total_fatalities": +d.total_fatalities,
			"total_occupants": +d.total_occupants,
			"make": d.make,
			"operator": d.operator,
			"narrative": d.narrative
		}

	})

	clean_data_year = d3.nest()
		.key(function(d) { return d.year; })
		.sortKeys(d3.ascending)
		.rollup(function(leaves) { return {"total_accidents": leaves.length,
			"total_fatalities": d3.sum(leaves, function(d) {return d["total_fatalities"];})} })
		.entries(clean_data);



	barchart_month = new Barchart_month("barchart_month", clean_data)
	areachart = new AreaChart("areachart",clean_data_year.slice(0, -3));

	for (i =0; i<=11; i++) {
		linechart[i] = new Linechart("linechart", months[i], clean_data);
	}
}

function brushed() {


	// Update focus chart (detailed information)
	//console.log(areachart.brush.extent())
	if (areachart.brush.empty()) {
		barchart_month.selectionChanged(areachart.x.domain());
		for (i =0; i<=11; i++) {
			linechart[i].selectionChanged(areachart.x.domain());
		}
	}
	else {
		barchart_month.selectionChanged(areachart.brush.extent());
		for (i =0; i<=11; i++) {
			linechart[i].selectionChanged(areachart.brush.extent());
		}
	}

}