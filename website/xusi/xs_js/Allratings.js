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

    vis.margin = {top: 30, right: 0, bottom: 20, left: 50};
    vis.width = $("#"+vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = vis.height - vis.margin.top - vis.margin.bottom;
    vis.ratingbar = {height: 10, width: 20};

    vis.desc = ["IOSA Certification1","IOSA Certification2","EU Blacklist","Fatality","FAA endorsement","ICAO safety1","ICAO safety2"];

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .attr("class","sideranking")
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    //define tooltip
    vis.tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset(function () {
            return [-10,0];
        });

    vis.svg.call(vis.tip);

    //title
    vis.svg.append("text")
        .text("All Rankings")
        .attr("x",0)
        .attr("y",0)
        .attr("class","rankings-title");

    //detail info

    vis.ranks = vis.svg.append("g")
        .attr("transform", "translate(0,-20)");

    // vis.ranks.selectAll(".ratings")
    //     .data(vis.desc)
    //     .enter()
    //     .append("rect")
    //     .attr("class","ratings")
    //     .attr("width", vis.ratingbar.width)
    //     .attr("height", vis.ratingbar.height)
    //     .attr("y", 30)
    //     .attr("x", function (d,i) {return i * vis.ratingbar.width})
    //     .attr("fill","rgba(217, 27, 40, 0.75)")
    //     .style("stroke","black")
    //     .style("stroke-width",0.5)
    //     .on("mouseover",function (d) {
    //         vis.tip.html(d).show();
    //     })
    //     .on("mouseout",function (d) {
    //         vis.tip.hide();
    //     })
    //     .style("cursor", "pointer");


    vis.rankingnum = [7,6,5,4,3,2,1,0];
    vis.space = [0,80,120,180,220,250,280,310]


    vis.groups = vis.svg
        .append("g")
        .attr("transform", "translate(0,30)")
        .selectAll(".ranking")
        .data(vis.data)
        .enter()
        .append("g")
        .attr("class","ranking")
        .attr("transform", function (d,i) {

            return "translate(" + 0 + "," + vis.space[i] + ")"
        });

    vis.planes = vis.groups.selectAll(".plane")
        .data(function (d) { return d.values})
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
        // .on("mouseover",function (d) {
        //     console.log(d.Airline);
        //     var flag = 0
        //     vis.allairlines.forEach(function (yes) {
        //
        //         if (yes == d.Airline){
        //             flag = 1
        //             console.log("yes");
        //         }
        //     })
        //     if (flag == 1) {
        //         // vis.tip.html( function () {
        //         //     return "Date:"
        //         // }).show();
        //     }
        //
        //     //vis.tip.html("yes").show();
        // })
        // .on("mouseout", function() {
        //     //vis.tip.hide()
        //      })
        .append("xhtml:span")
        .attr("class", "fa fa-plane plane");

    vis.planes
        .style("color",function (d) {
            var flag = 0
            vis.allairlines.forEach(function (yes) {

                if (yes == d.Airline){
                    flag = 1
                }
            })
            if (flag == 1) {
                return "rgba(255, 255, 0, 0.73)"
            }
            else{
                return "rgba(128, 128, 128, 0.51)";
            }
        })
        .style("cursor", "pointer");

    // vis.groups.append("text")
    //     .text(function (d,i) {
    //         return vis.rankingnum[i]
    //     })
    //     .attr("x",-20)
    //     .attr("y",15)
    //     .attr("class","rankingnum");

}

Ratings.prototype.update1 = function (plane) {
    var vis= this;
    console.log(plane);
    vis.planes
        .style("color",function (d) {
            var flag = 0
            vis.allairlines.forEach(function (yes) {

                if (yes == d.Airline){
                    flag = 1
                }
            })


            if (flag == 1) {
                if (d.Airline == plane) {
                    return "rgba(217, 27, 40, 0.75)"
                }
                else {
                    return "rgba(255, 255, 0, 0.73)"
                }

            }
            else{
                return "rgba(128, 128, 128, 0.51)";
            }


        })


}

Ratings.prototype.update0 = function (plane) {
    var vis= this;
    console.log("out");
    vis.planes
        .style("color",function (d) {
            var flag = 0
            vis.allairlines.forEach(function (yes) {

                if (yes == d.Airline){
                    flag = 1
                }
            })
            if (flag == 1) {
                return "rgba(255, 255, 0, 0.73)"
            }
            else{
                return "rgba(128, 128, 128, 0.51)";
            }
        })

}