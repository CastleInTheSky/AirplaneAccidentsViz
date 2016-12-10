/**
 * Created by sophiasi on 12/9/16.
 */
Ratings = function(_parentElement, _data, _allairlines, _height){
    this.parentElement = _parentElement;
    this.data = _data;
    this.height = _height;
    this.allairlines = _allairlines;
    this.displayData = _data;
    this.initVis();
}

Ratings.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 10, right: 20, bottom: 20, left: 30};
    vis.width = $("#"+vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = vis.height - vis.margin.top - vis.margin.bottom;


    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");



    vis.groups = vis.svg.selectAll(".ranking")
        .data(vis.data)
        .enter()
        .append("g")
        .attr("class","ranking")
        .attr("transform", function (d,i) {

            return "translate(" + vis.margin.left + "," + i * 80 + ")"
        });

    vis.groups.selectAll(".plane")
        .data(function (d) {console.log(d); return d.values})
        .enter()
        .append("svg:foreignObject")
        .attr("width", 10)
        .attr("height", 10)
        .attr("y", function (d,i) {
            return 10 * Math.floor(i / 30)
        })
        .attr("x", function (d,i) {
            return (i % 30) * 10
        })
        .append("xhtml:span")
        .attr("class", "fa fa-plane plane");


}