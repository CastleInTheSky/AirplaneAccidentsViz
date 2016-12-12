/**
 * Created by sophiasi on 12/5/16.
 */
/**
 * Created by sophiasi on 12/4/16.
 */
Airlines = function(_parentElement_ratings, _parentElement_descrip, _data, _event0,_event1){
    this.parentElement_ratings = _parentElement_ratings;
    this.parentElement_descrip = _parentElement_descrip;
    this.data = _data;
    this.rankings = _data;
    this.event0 = _event0;
    this.event1 = _event1;
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
    vis.list_sorted = vis.data.filter(function (d) {
        var flag = 0
        vis.list.forEach(function (yes) {

            if (yes == d.Airline){
                flag = 1
            }
        })
        if (flag == 1) {
            return d
        }

    })
    vis.list_sorted = vis.list_sorted.sort(function (a,b) {
        return b.Rating - a.Rating
    })


    vis.list_sorted = vis.list_sorted.map(function (d) {
        return d.Airline;
    })



    vis.num = vis.list.length;
    vis.height_each = 500 / vis.num;

    //update rankings
    vis.ratings = new Ratings(vis.parentElement_descrip,vis.rankings,vis.list_sorted,600);


    cmp_num = 0;
    vis.list.forEach(function (d,i) {
        vis.airlines[i] = new Airline(vis.parentElement_ratings, vis.data, vis.list_sorted[i], vis.height_each,vis.event0,vis.event1);
    })


}
Airlines.prototype.hoverPlane0 = function (plane) {
    var vis = this;
    vis.ratings.update0(plane);
}
Airlines.prototype.hoverPlane1 = function (plane) {
    var vis = this;
    vis.ratings.update1(plane);
}