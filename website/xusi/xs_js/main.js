//**************Define Variables *****************//
var dateFormatter = d3.time.format("%m/%d/%y");
var yearFormatter = d3.time.format("%Y");
var monthNameFormat = d3.time.format("%b");
var month = d3.time.format("%m");
var months = ["Jan", "Feb", "Mar", "Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var clean_data, clean_data_year,clean_data_2;
var barchart_month, areachart;
var search; //a list of values for the search box
var airlines,all_airlines;
var ratings;
var temp;
var linechart = [];
var selected_airlines = [];
var side;

//****************Search Box Init******************************//
var dataList = document.getElementById('json-datalist');
var input = document.getElementById('ajax');
//$(".scroll").hide();
//button onclick


//*****************Load data and create vis***********************//
queue()
	.defer(d3.csv,"xusi/xs_data/data.csv")
	.defer(d3.csv,"xusi/xs_data/ratings_7.csv")
	.await(createVis);


function createVis(error, data, _ratings){
	if(error) { console.log(error); }

	//clean data
	//accidents by month
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
	clean_data_2 = data.map(function (d) {
		return {
			"date" : d.date,
			"decade": +d.decade,
			"year": yearFormatter.parse(d.year),
			"month": monthNameFormat(d.date),
			"total_fatalities": +d.total_fatalities,
			"total_occupants": +d.total_occupants,
			"make": d.make,
			"operator": d.operator,
			"narrative": d.narrative
		}
	});

	clean_data_year = d3.nest()
		.key(function(d) { return d.year; })
		.sortKeys(d3.ascending)
		.rollup(function(leaves) { return {"total_accidents": leaves.length,
			"total_fatalities": d3.sum(leaves, function(d) {return d["total_fatalities"];})} })
		.entries(clean_data);

	//rating data
	all_airlines = d3.nest()
		.key(function (d) {return d.operator})
		.sortValues(function (a,b) {return a.year - b.year})
		.entries(clean_data_2);

	airlines = all_airlines.filter(function (airline) {
		var f = 0;
		_ratings.forEach(function (d) {
			if (airline.key == d.Airline ) {
				f = 1;
			}
		})

		 if (f == 1) {
		 	return airline;
		 }
	});
	//console.log(airlines);

	// ratings = _ratings.filter(function (d) {
	// 	var f = 0;
	// 	airlines.forEach(function (a) {
	// 		if (a.key == d.Airline) {
	// 			temp = a.values;
	// 			f = 1;
	// 			//console.log(d.Airline);
	// 		}
	// 	})
	// 	if (f == 1) {
	// 		return {
	// 			"Accidents": temp,
	// 			"Airline": d.Airline,
	// 			"ICAO_1": +d.ICAO_1,
	// 			"ICAO_2": +d.ICAO_2,
	// 			"EU": +d.EU,
	// 			"FAA": +d.FAA,
	// 			"Fatality": +d.Fatality,
	// 			"IOSA_1": +d.IOSA_1,
	// 			"IOSA_2": +d.IOSA_2,
	// 			"Rating": +d.Rating
	// 		}
	// 	}
	// })


	ratings = _ratings.map(function (d) {
		airlines.forEach(function (a) {
			if (a.key == d.Airline) {
				temp = a.values;
				//console.log(a.values);
			}
		})
		return {
			"Accidents": temp,
			"Airline": d.Airline,
			"ICAO_1": +d.ICAO_1,
			"ICAO_2": +d.ICAO_2,
			"EU": +d.EU,
			"FAA": +d.FAA,
			"Fatality": +d.Fatality,
			"IOSA_1": +d.IOSA_1,
			"IOSA_2": +d.IOSA_2,
			"Rating": +d.Rating
		}
	})

	//console.log(ratings);


	//search box

	search = ratings.map(function (d) {return d.Airline});

	//console.log(search);
    //
	// // setup autocomplete function pulling from currencies[] array
	// $('#autocomplete').autocomplete({
	// 	lookup: search,
	// 	onSelect: function (suggestion) {
	// 		var thehtml = '<strong>Currency Name:</strong> ' + suggestion.value + ' <br> <strong>Symbol:</strong> ' + suggestion.data;
	// 		$('#outputcontent').html(thehtml);
	// 	}
	// });
	searchBox();



	//draw vis
	barchart_month = new Barchart_month("barchart_month", clean_data)
	areachart = new AreaChart("areachart",clean_data_year.slice(0, -3));

	for (i =0; i<=11; i++) {
		linechart[i] = new Linechart("linechart", months[i], clean_data);
	}


	var descrip_event = {};
	airlines_cmp = new Airlines("airline-cmp","ranking", ratings, descrip_event);



	$( "#add-airline" ).click(function() {


		//test

		var value = $('#ajax').val();
		selected_airlines.push(value);
		input.placeholder = "Type in airlines"; //need to be updated

		// var ul = document.getElementById("air-list");
		// var li = document.createElement("li");
		// li.appendChild(document.createTextNode(value));
		// li.style.height = "35px";
		// li.setAttribute("class", "list-group-item"); // added line
		// ul.appendChild(li);
		var myButton = document.createElement("input");
		myButton.type = "button";
		myButton.value = value;
		myButton.setAttribute("class", "btn btn-secondary selected-plane-list");
		myButton.setAttribute("id", "btn" + value);
		var placeHolder = document.getElementById("selected-plane-list");
		placeHolder.appendChild(myButton);

		//remove previous
		d3.selectAll(".eachplane").remove();
		//draw new
		airlines_cmp.list = selected_airlines;
		airlines_cmp.updateVis();

		myButton.onclick=function() {
			console.log(this.id);
			var airline = this.value;
			//console.log(airline);
			var index = selected_airlines.indexOf(airline);
			selected_airlines.splice(index, 1);
			//console.log(selected_airlines);

			$(this).remove();

			d3.selectAll(".eachplane").remove();
			//draw new
			airlines_cmp.list = selected_airlines;
			airlines_cmp.updateVis();
		};

	});






	// $( "#cmp-airline" ).click(function() {
	// 	compAirlines();
	// });


}

function compAirlines() {


	$(descrip_event).bind("descrip_update", function(event,rangeStart, rangeEnd){

	});


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




function wrap(text, width, vis) {

		console.log(text.text());
		var temp = 0;
		var words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.1, // ems
			y = text.attr("y"),
			tspan = text.text(null).append("tspan").attr("x", 10).attr("y", y).attr("dy", 0 + "em");
		while (word = words.pop()) {
			line.push(word);
			tspan.text(line.join(" "));
			if (tspan.node().getComputedTextLength() > width) {
				line.pop();
				tspan.text(line.join(" "));
				line = [word];
				tspan = text.append("tspan").attr("x", 10).attr("y", y).attr("dy", ++ lineNumber * lineHeight + "em").text(word);
				vis.lines = lineNumber + 1;
				temp = 1
			}

		}
		if (temp == 0) {
			vis.lines = 1;
		}


		console.log(vis.lines);
}

function searchBox() {

	search.forEach(function(item) {
		// Create a new <option> element.
		var option = document.createElement('option');
		// Set the value using the item in the JSON array.
		option.value = item;
		// Add the <option> element to the <datalist>.
		dataList.appendChild(option);
	});
}