var causeHierarchy;
var causeExplain;
var phases;
var status;
var sunburst_chart, sunburst_show, plane_status, phase_chart;

queue()
    .defer(d3.csv,"Xinyuan/data/causes.csv")
    .defer(d3.csv,"Xinyuan/data/cause_explanations.csv")
    .defer(d3.csv,"Xinyuan/data/phase_summary.csv")
    .defer(d3.csv,"Xinyuan/data/phase_percent_summary.csv")
    .defer(d3.csv,"Xinyuan/data/plane_status.csv")
    .await(wrangleData);

function wrangleData(error, causeData, causeExplainData, phaseData, phasePercentData, statusData){
    causeHierarchy = {
        key: "Plane Crash Causes",
        values: d3.nest()
            .key(function(d) { return d.category; })
            .key(function(d) { return d.cause; })
            .rollup(function(leaves) {
                return leaves.length;
            })
            .entries(causeData)
    };


    phases = phasePercentData;
    status = statusData;
    causeExplain = {};
    causeExplainData.forEach(function(d){
        causeExplain[d.cause] = d.explanation;
    });




    var SunburstEventHandler = {};
    var PhaseEventHandler = {};

    $(SunburstEventHandler).bind("selectionChanged", function(event, key){
        sunburst_show.onSelectionChange(key);
    });

    $(PhaseEventHandler).bind("mouseMoved", function(event, focus){
        plane_status.onMouseMove(focus);
    });



    // TO-DO: INSTANTIATE VISUALIZATION
    sunburst_chart = new sunburstChart("sunburst_chart", causeHierarchy, SunburstEventHandler);
    sunburst_show = new sunburstShow("sunburst_show", causeHierarchy, causeExplain);

    plane_status = new planeStatus("plane_status", statusData);
    phase_chart = new phaseChart("phase_chart", phases, phaseData, PhaseEventHandler);


    //createVis();
}

function wrap(text, width, vis) {

    console.log(d3.select(this).text());
    var temp = 0;
    console.log(text);
    var words = text.text().split(/\s+/).reverse();
    console.log("here");
     var word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", 0 + "em");
    while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++ lineNumber * lineHeight + "em").text(word);
            vis.lines = lineNumber + 1;
            temp = 1
        }

    }
    if (temp == 0) {
        vis.lines = 1;
    }


    console.log(vis.lines);
}

// function wrap(text, width) {
//     var text = d3.select(this);
//     console.log(text.text());
//     // text.each(function() {
//     //     var text = d3.select(this),
//     //         words = text.text().split(/\s+/).reverse(),
//     //         word,
//     //         line = [],
//     //         lineNumber = 0,
//     //         lineHeight = 1.1, // ems
//     //         y = text.attr("y"),
//     //         //dy = parseFloat(text.attr("dy")),
//     //         tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", 1.3 + "em");
//     //     while (word = words.pop()) {
//     //         line.push(word);
//     //         tspan.text(line.join(" "));
//     //         if (tspan.node().getComputedTextLength() > width) {
//     //             line.pop();
//     //             tspan.text(line.join(" "));
//     //             line = [word];
//     //             tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + 1.3 + "em").text(word);
//     //         }
//     //     }
//     // });
//
// }

function updatePhaseChart(){
    phase_chart.wrangleData();
}
// function createVis() {
//
//     // // Create event handler
//     // var SunburstEventHandler = {};
//     //
//     //
//     // $(SunburstEventHandler).bind("selectionChanged", function(event, key){
//     //     sunburst_show.onSelectionChange(key);
//     // });
//     //
//     //
//     //
//     // // TO-DO: INSTANTIATE VISUALIZATION
//     // var sunburst_chart = new sunburstChart("sunburst_chart", causeHierarchy,SunburstEventHandler);
//     // var sunburst_show = new sunburstShow("sunburst_show", causeHierarchy);
//     // console.log(status);
//     // var plane_status = new planeStatus("plane_status", status);
//     // var phase_chart = new phaseChart("phase_chart", phases);
// }