sunburstShow = function(_parentElement, _data, _explainData){
    this.parentElement = _parentElement;
    this.hierarchy = _data;
    this.explanation = _explainData;
    this.key = "Plane Crash Causes";
    this.initVis();
}

sunburstShow.prototype.initVis = function() {
    var vis = this;

    var vis = this;
    vis.margin = { top: 50, right: 50, bottom: 0, left: 100 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = 500 - vis.margin.top - vis.margin.bottom;


    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.updateVis();

}


sunburstShow.prototype.updateVis = function(){
    var vis = this;
    vis.text = vis.svg.selectAll(".explain")
        .data(vis.key, function(d){
            return vis.key;
        });

    vis.text.enter()
        .append("text")
        .attr("class","explain")
        .attr("font-size", 30)
        .style("fill", "red")
        .style("opacity", 0.7);
    //.attr("text-anchor", "middle");

    vis.text.text(vis.key);

    vis.text.exit().remove();


   var string = vis.explanation[vis.key];
    //wrap(vis.string, 30);

    vis.p = vis.svg.selectAll("text.explanation")
        .data(vis.key, function(d){
            return vis.key;
        });


    vis.p.enter()
        .append("text");
       vis.p.text(string)
        .call(wrap,vis.width,vis)
        .attr("class","explanation")
        .attr("x", 0)
        .attr("y", 50);


        // text(function(d){
        //     console.log(string);
        //     return string;
        // });


    vis.p.style("fill", "grey")
        .style("opacity", 1);
     //   .attr("class","explanation")
     //    .attr("font-size", 20)
     //    .style("color", "white")
     //    .style("opacity", 1);
    //.attr("text-anchor", "middle");


    vis.p.exit().remove();


    vis.img = vis.svg.selectAll(".img")
        .data(vis.key, function(d){
            return vis.key;
        });

    vis.img.enter()
        .append("svg:image")
        .attr("class","img")
        .attr("width", 450)
        .attr("height", 250)
        .attr("x", 0)
        .attr("y", 150);

    vis.img.attr("xlink:href", function(d){
        // console.log("here");
        return  "Xinyuan/img/causes/"+ vis.key+ ".jpg";
        //return  "Xinyuan/img/causes/"+ "Default"+ ".jpg";

    });

    vis.img.exit().remove();

    /* vis.img = vis.svg.append("svg:image")
     .attr("xlink:href", function(d){
     // console.log("here");
     return  "img/causes/Pilot Error.jpg";
     }).attr("width", 400)
     .attr("height", 400)
     .attr("x", 0)
     .attr("y", 0);*/

    //vis.attr('xlink:href',function(d){



}


sunburstShow.prototype.onSelectionChange = function(key){
    var vis = this;
    vis.key = key;
    console.log(vis.key);

    vis.updateVis();
}
