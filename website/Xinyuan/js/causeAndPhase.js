var causeHierarchy;
var phases;

queue()
    .defer(d3.csv,"Xinyuan/data/causes.csv")
    .defer(d3.csv,"Xinyuan/data/phase_percent_summary.csv")
    .await(wrangleData);

function wrangleData(error, causeData, phaseData){
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
    console.log(phaseData);

    phases = phaseData;
    createVisXinyuan();
}



function createVisXinyuan() {

    // Create event handler
    var SunburstEventHandler = {};


    $(SunburstEventHandler).bind("selectionChanged", function(event, key){
        sunburst_show.onSelectionChange(key);
    });



    // TO-DO: INSTANTIATE VISUALIZATION
    var sunburst_chart = new sunburstChart("sunburst_chart", causeHierarchy,SunburstEventHandler);
    var sunburst_show = new sunburstShow("sunburst_show", causeHierarchy);

    var phase_chart = new phaseChart("phase_chart", phases);
}