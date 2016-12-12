/**
 * Created by sophiasi on 12/4/16.
 */
Airline = function(_parentElement, _data, _airline, _height,_event0,_event1){
    this.parentElement = _parentElement;
    this.data = _data;
    this.height = _height;
    this.event0 = _event0;
    this.event1 = _event1;
    this.airline = _airline;
    this.displayData = _data;
    this.initVis();
}

Airline.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 10, right: 20, bottom: 20, left: 0};
    vis.ratingbar = {height: 10, width: 20}
    vis.timepoint = {height: 30, width: 2}
    vis.button = {height: 20, width: 40}
    vis.width = 850 - vis.margin.left - vis.margin.right;
    vis.height = vis.height - vis.margin.top - vis.margin.bottom;

    vis.desc = ["IOSA Certification1","IOSA Certification2","EU Blacklist","Fatality","FAA endorsement","ICAO safety1","ICAO safety2"];

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .attr("class","eachplane")
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


    vis.svg.append("g")
        .attr("transform", "translate(200," + 0 + ")")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", vis.width - 200)
        .attr("height", 100);


    vis.x = d3.time.scale()
        .range([0,vis.width - 200])
        .domain([yearFormatter.parse("1919"),yearFormatter.parse("2016")]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom")
        // .tickFormat(d3.time.format('%Y'))
        // .ticks(d3.time.year, 10)
        .outerTickSize(0);

    vis.zoom = d3.behavior.zoom()
        .scaleExtent([1, 20])
        //.translateExtent([[-100, -100], [vis.width + 90, vis.height + 100]])
        .on("zoom", function () {
            vis.updateVis();
        });

    vis.zoom.x(vis.x);

    vis.svg.append("g")
        .attr("class", "timeline_x-axis xsaxis")
        .attr("transform", "translate(200," + 50 + ")")
        .call(vis.zoom);

    vis.svg.select(".timeline_x-axis")
        .append("rect")
        .attr("width", vis.width - 200)
        .attr("height", 100)
        .attr("y", -50)
        .style("opacity", "0");

    vis.svg.append("g")
        .attr("class", "timeline_accidents")
        .attr("transform", "translate(200," + 35 + ")")
        .call(vis.zoom);


    //vis.airline = "Yangon Airways";
    vis.criet = ["ICAO_1","ICAO_2","EU","FAA","Fatality","IOSA_1","IOSA_2"];

    //add Button

     vis.button = vis.svg.append("g")
         .attr("transform", "translate(800," + 10 + ")");

    vis.button
        .append("text")
        .text("Reset")
        .style("font-size","14px")
        .attr("y",10)
        .attr("fill","rgba(246, 249, 255, 0.55)")
        .on("click", function() { vis.reset()})
        .on("mouseout", function () {
            d3.select(this).attr("fill","rgba(246, 249, 255, 0.55)")
        })
        .on("mouseover", function () {
            d3.select(this).attr("fill","rgba(217, 27, 40, 0.75)")
        })
        .style("cursor", "pointer");

    //rating number
    vis.rating = vis.svg.append("text");
    vis.name = vis.svg.append("text");

    //tooltip

    vis.tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset(function () {
            return [-10,0];
        });


    vis.svg.call(vis.tip);


    vis.descrip = vis.svg.append("g")
        .attr("transform", "translate(250," + 0 + ")");

    vis.descrip
        .append("text")
        .attr("y",15)
        .attr("fill", "rgba(217, 27, 40, 0.75)")
        .attr("class","descrip");

    vis.descrip
        .append("rect")
        .attr("class","des_back")
        .attr("width",610)
        .attr("fill","rgba(246, 249, 255, 0.55)")
        .style("opacity", 0.25)
        .attr("visibility", "hidden");

    //close
    vis.descrip
        .append("text")
        .text("Close")
        .attr("class","close")
        .attr("fill","rgba(255, 243, 0, 1)")
        .attr("x", 560)
        .attr("visibility", "hidden")
        .style("cursor", "pointer")
        .on("click",function () {
            vis.svg.select(".des_back")
                .attr("visibility", "hidden");

            vis.svg.select(".descrip")
                .attr("visibility", "hidden");
            d3.select(this).attr("visibility", "hidden");
        });

    vis.wrangleData();


}

Airline.prototype.wrangleData = function(){
    var vis = this;
    vis.data.forEach(function (d) {
        if (d.Airline == vis.airline){
            vis.displayData = d
            cmp_num += 1;
            //console.log(cmp_num);
            //console.log(vis.displayData.Accidents == undefined);

        }
    })
    if (vis.displayData.Accidents == undefined){
        vis.displayData.Accidents = [];
    }

    //console.log(vis.displayData);

    vis.updateVis();

    //console.log(nested_data);
}

Airline.prototype.updateVis = function() {
    var vis = this;
    //console.log(vis.displayData.Rating);
    //rating


    vis.name
        .text(" " + " " + vis.displayData.Airline)
        .attr("x", 45)
        .attr("y", 30)
        .attr("class","rankingnum")
        .attr("fill","rgba(255, 255, 0, 0.73)")
        .on("mouseover",function () {
            d3.select(this).attr("fill","rgba(217, 27, 40, 0.75)");
            $(vis.event1).trigger("hoverplane1",vis.displayData.Airline)
        })
        .on("mouseout",function () {
            d3.select(this).attr("fill","rgba(255, 255, 0, 0.73)");
            $(vis.event0).trigger("hoverplane0",vis.displayData.Airline)
        })
        .style("cursor", "pointer");


    vis.rating
        .text(vis.displayData.Rating)
        .attr("x", 20)
        .attr("y", 30)
        .attr("fill", "rgba(255, 255, 0, 0.87)")
        .style("font-size", 40);

    vis.svg.selectAll(".ratings")
        .data(vis.criet)
        .enter()
        .append("rect")
        .attr("class","ratings")
        .attr("width", vis.ratingbar.width)
        .attr("height", vis.ratingbar.height)
        .attr("y", 50)
        .attr("x", function (d,i) {return i * vis.ratingbar.width + 20})
        .attr("fill",function (d) {
            //console.log(d);
                if (vis.displayData[d] == 1) {
                    return "rgba(217, 27, 40, 0.75)"
                }
                else {
                    return "rgba(246, 249, 255, 0.55)"
                }
        })
        .style("stroke","black")
        .style("stroke-width",0.5)
        .on("mouseover",function (d,i) {
            vis.tip.html(vis.desc[i]+ "<br />"
            + "<span style='color:yellow'>" + "Click to see more</span>").show();
        })
        .on("mouseout",function (d) {
            vis.tip.hide();
        })
        .style("cursor", "pointer")
        .on("click",function () {
            $('#myModal2').modal('show');
        });

    //timeline


    vis.svg.select(".timeline_x-axis")
        .call(vis.xAxis);

    vis.gX = vis.svg.select(".timeline_accidents")
        .selectAll(".accidents")
        .data(vis.displayData.Accidents);

    vis.gX
        .enter()
        .append("rect")
        .attr("class", "accidents");

    vis.flag_1 = 0;
    vis.gX
        .attr("clip-path", "url(#clip)")
        .attr("height",vis.timepoint.height)
        .attr("width",vis.timepoint.width)
        .attr("x",function(d) {return vis.x(d.date)})
        .attr("fill", "rgba(217, 27, 40, 0.75)")
        .style("cursor", "pointer")
        .on("click",function (d) {


            $("#modal-body").empty();

            var para = document.createElement("p");
            para.setAttribute("class","narra");
            var node = document.createTextNode(d.narrative);
            para.appendChild(node);

            var element = document.getElementById("modal-body");
            element.appendChild(para);

            $('#myModal').modal('show');
            // vis.svg.select(".descrip")
            //     .text(d.narrative)
            //     .attr("visibility", "show")
            //     .call(wrap, 550, vis);
            //
            // vis.svg.select(".des_back")
            //     .attr("height", vis.lines * 20 )
            //     .attr("visibility", "show");
            //
            // vis.svg.select(".close")
            //     .attr("y", 15 )
            //     .attr("visibility", "show");


        })
        .on("mouseover",function (d) {
            //vis.tip.html(d.narrative).show();
            vis.tip.html( function () {
                return "Date: <span style='color:rgba(217, 27, 40, 0.75)'>" + dateFormatter(d.date) + "</span>"+ "<br />" +
                    "Fatalities/Total: <span style='color:rgba(217, 27, 40, 0.75)'> " + d.total_fatalities + "/" + d.total_occupants+ "</span>" + "<br />"
                    + "<span style='color:yellow'>" + "Click to see more</span>"
            }).show();

            // //show accident description
            // d3.select(".info")
            //     .append("text")
            //     .text("Click to see more")
            //     .attr("x",0)
            //     .attr("y",15)
            //     .attr("fill","white");
                // .style("cursor", "pointer")
                // .on("mouseover",function () {
                //     d3.select(this).attr("fill","yellow");
                // })
                // .on("mouseout",function () {
                //     d3.select(this).attr("fill","white");
                // })
                // .on("click",function () {
                //
                //     vis.tip.hide();
                //     console.log(d.narrative)
                //
                //
                //     //vis.tip.html(d.narrative).show();
                //
                //     // d3.select(".d3-tip")
                //     //     .style("top", "200px")
                //     //     .style("left", "90px");
                // });
        })
        .on("mouseout",function () {
            vis.tip.hide()
        });

    vis.gX.exit().remove();

}

Airline.prototype.reset = function () {
    var vis = this;


    d3.transition().duration(800).tween("zoom", function() {
        console.log(vis.x.domain());
        var ix = d3.interpolate(vis.x.domain(),[yearFormatter.parse("1919"),yearFormatter.parse("2016")]);

        return function(t) {
            vis.zoom.x(vis.x.domain(ix(t)));
            vis.updateVis();

        };
    });


}