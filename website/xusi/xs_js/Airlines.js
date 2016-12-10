/**
 * Created by sophiasi on 12/5/16.
 */
/**
 * Created by sophiasi on 12/4/16.
 */
Airlines = function(_parentElement_ratings, _parentElement_descrip, _data, _event){
    this.parentElement_ratings = _parentElement_ratings;
    this.parentElement_descrip = _parentElement_descrip;
    this.data = _data;
    this.rankings = _data;
    this.event = _event;
    this.initVis();
}


Airlines.prototype.initVis = function() {
    var vis = this;
    vis.airlines = [];

    //console.log(vis.height_each);
    vis.rankings = d3.nest()
        .key(function (d) {return d.Rating})
        .sortKeys(d3.descending)
        .entries(vis.data);

    //vis.ratings = new Ratings(vis.parentElement_descrip,vis.rankings,vis.list,600);
}

Airlines.prototype.updateVis = function() {
    var vis = this;
    vis.num = vis.list.length;
    vis.height_each = 500 / vis.num;


    vis.list.forEach(function (d,i) {
        vis.airlines[i] = new Airline(vis.parentElement_ratings, vis.data, vis.list[i], vis.height_each);
    })
}