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
var cmp_num = 0;


//****************Search Box Init******************************//
var dataList = document.getElementById('json-datalist');
var input = document.getElementById('ajax');
$("#total_fatalities").css("background-color","rgba(217, 27, 40, 0.75)");
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

	var event_select_month1 = {};
	var event_select_month0 = {};




	//draw vis
	barchart_month = new Barchart_month("barchart_month", clean_data,event_select_month1,event_select_month0)
	areachart = new AreaChart("areachart",clean_data_year.slice(0, -3));

	for (i =0; i<=11; i++) {
		linechart[i] = new Linechart("linechart", months[i], clean_data);
	}
	//bing event

	$(event_select_month1).bind("selectMonth1", function(event,month){

		for (i =0; i<=11; i++) {
			linechart[i].selectionMonth1(month);
		}
	});

	$(event_select_month0).bind("selectMonth0", function(event,month){

		for (i =0; i<=11; i++) {
			linechart[i].selectionMonth0(month);
		}
	});



	var event_hover0 = {};
	var event_hover1 = {};

	airlines_cmp = new Airlines("airline-cmp","ranking", ratings, event_hover0,event_hover1);

	$(event_hover0).bind("hoverplane0", function(event,plane){
		airlines_cmp.hoverPlane0(plane);
	});
	$(event_hover1).bind("hoverplane1", function(event,plane){
		airlines_cmp.hoverPlane1(plane);
	});







	$(".typebtn").click(function () {

		var selectvalue = $(this).attr("id")
		console.log(selectvalue);
		areachart.typeChange(selectvalue);

		for (i =0; i<=11; i++) {
			linechart[i].typeChange(selectvalue);
		}
		barchart_month.typeChange(selectvalue);

	})

	$( "#add-airline" ).click(function() {




		// var inp = document.getElementById("ajax");
		// inp.placeholder = "Type in airlines to compare...";

		var value = $('#ajax').val();
		var flag = 0;
		selected_airlines.forEach(function (d,i) {
			if (value == d) {
				flag = 1

			}
		})
		if (flag == 0 && cmp_num<=5) {
			selected_airlines.push(value);
			var myButton = document.createElement("input");
			myButton.type = "button";
			myButton.value = value;
			myButton.onmouseover = function () {

				myButton.style.color = "red";
				myButton.value = "Delete"
			}
			myButton.onmouseout = function () {

				myButton.style.color = "white";
				myButton.value = value;
			}
			myButton.setAttribute("class", "xsbtn btn-secondary selected-plane-list");
			myButton.setAttribute("id", value);
			myButton.style.borderRadius = 8;
			var placeHolder = document.getElementById("selected-plane-list");
			placeHolder.appendChild(myButton);

			//remove previous
			d3.selectAll(".eachplane").remove();
			d3.selectAll(".sideranking").remove();
			//draw new
			airlines_cmp.list = selected_airlines;
			airlines_cmp.updateVis();

			myButton.onclick=function() {
				cmp_num -= 1
				console.log(this.id);
				var airline = this.id;
				//console.log(airline);
				var index = selected_airlines.indexOf(airline);
				selected_airlines.splice(index, 1);
				//console.log(selected_airlines);

				$(this).remove();

				d3.selectAll(".eachplane").remove();
				d3.selectAll(".sideranking").remove();
				//draw new
				airlines_cmp.list = selected_airlines;
				airlines_cmp.updateVis();


			};
		}

		// $("#ajax")[0].reset();

		// var ul = document.getElementById("air-list");
		// var li = document.createElement("li");
		// li.appendChild(document.createTextNode(value));
		// li.style.height = "35px";
		// li.setAttribute("class", "list-group-item"); // added line
		// ul.appendChild(li);






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




// function wrap(text, width, vis) {
//
// 		console.log(text.text());
// 		var temp = 0;
// 		var words = text.text().split(/\s+/).reverse(),
// 			word,
// 			line = [],
// 			lineNumber = 0,
// 			lineHeight = 1.1, // ems
// 			y = text.attr("y"),
// 			tspan = text.text(null).append("tspan").attr("x", 10).attr("y", y).attr("dy", 0 + "em");
// 		while (word = words.pop()) {
// 			line.push(word);
// 			tspan.text(line.join(" "));
// 			if (tspan.node().getComputedTextLength() > width) {
// 				line.pop();
// 				tspan.text(line.join(" "));
// 				line = [word];
// 				tspan = text.append("tspan").attr("x", 10).attr("y", y).attr("dy", ++ lineNumber * lineHeight + "em").text(word);
// 				vis.lines = lineNumber + 1;
// 				temp = 1
// 			}
//
// 		}
// 		if (temp == 0) {
// 			vis.lines = 1;
// 		}
//
//
// 		console.log(vis.lines);
// }

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