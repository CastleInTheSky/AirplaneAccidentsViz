var causeHierarchy;
var phases;
var status;

queue()
    .defer(d3.csv,"Xinyuan/data/causes.csv")
    .defer(d3.csv,"Xinyuan/data/phase_summary.csv")
    .defer(d3.csv,"Xinyuan/data/phase_percent_summary.csv")
    .defer(d3.csv,"Xinyuan/data/plane_status.csv")
    .await(wrangleData);

function wrangleData(error, causeData, phaseData, phasePercentData, statusData){
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



    var SunburstEventHandler = {};
    var PhaseEventHandler = {};

    $(SunburstEventHandler).bind("selectionChanged", function(event, key){
        sunburst_show.onSelectionChange(key);
    });

    $(PhaseEventHandler).bind("mouseMoved", function(event, focus){
        plane_status.onMouseMove(focus);
    });



    // TO-DO: INSTANTIATE VISUALIZATION
    var sunburst_chart = new sunburstChart("sunburst_chart", causeHierarchy,SunburstEventHandler);
    var sunburst_show = new sunburstShow("sunburst_show", causeHierarchy);

    var plane_status = new planeStatus("plane_status", statusData);
    var phase_chart = new phaseChart("phase_chart", phases, phaseData, PhaseEventHandler);


    //createVis();
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