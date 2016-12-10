var gunviz = (function() {

var stage, overstage, distStage;
var	canvas = document.getElementById("stage");
var overlay = document.getElementById("overstage");
var distributionCanvas = document.getElementById("distributionView");
var life_strokeStyle = 1;
//var life_strokeColor = ["rgba(164,94,20,0.15)","rgba(149,74,1,0.15)","rgba(255,103,2,0.15)","rgba(255,215,0,0.15)","rgba(244,205,59,0.15)","rgba(241,125,1,0.15)","rgba(186,66,1,0.15)","rgba(224,69,0,0.15)","rgba(253,167,31,0.15)","rgba(237,132,0,0.15)]"];
var life_strokeColor = ["rgba(163,20,20,0.15)","rgba(146,1,3,0.15)","rgba(178,76,86,0.15)","rgba(240,128,128,0.15)","rgba(243,57,97,0.15)","rgba(238,5,1,0.15)","rgba(181,1,28,0.15)","rgba(219,0,43,0.15)","rgba(252,50,27,0.15)","rgba(234,0,105,0.15)]"];
var post_life_strokeStyle = 1;
var post_life_strokeColor = "rgba(62,34,117,1)";
var afterlife_strokeStyle = 1;
var afterlife_strokeColor = ["rgba(200,200,200,0.10)","rgba(150,150,150,0.10)","rgba(100,100,100,0.10)","rgba(170,170,170,0.10)","rgba(120,120,120,0.10)"];
var beziers = [];
var curveDict;
var curves; //loaded data
var bkgnd, backtransform;
var tooltip = new createjs.Container();
var axis = new createjs.Container();
var histograms = new createjs.Container();
var filterTop = new createjs.Container();
var filterBot = new createjs.Container();
var heartbeats = new createjs.Container();
var dotsContainer = new createjs.Container();
var distAxis;
var tweenList = [];
var timeline;
var globalFilter;
var cachedFilters;
var filterValues;
var activecurves = [];
var	padding = 10;
var	h = canvas.getAttribute("height");
var	w = canvas.getAttribute("width");
//vertical space (divide by 2 to get top/bottom margin);
var arcOffsetV = 30;
var arcSpaceHeight = h - arcOffsetV;
//horizontal space (divide by 2 to get left/right margin);
var arcOffsetH = 64;
var arcSpaceWidth = w - arcOffsetH;
var distributionPath;
var peopleCount = 0;
var yearsCount = 0;
var pctTop = 0, pctBot = 0;
//var monthLabel = 0;
var masterFilter = "nofilter";
var inDistView = false;
var distHistGroup;
var distHistColors = {leftTop: "rgba(241,52,82,0.20)", leftBot: "rgba(241,54,80,0.20)", rightTop: "rgba(200,200,200,0.20)", rightBot: "rgba(162,162,162,0.20)"};
//var delayWatcher;
var introTtip = [];
var playingAnimation = true;
var isIntroComplete = false;
var currentGroupNum = null;

//kick off the app
loadData();

function loadData() {
	function onLoaded(data) {
		curves = data;

		initData();

		//when dom ready introduce
		$(introzr);
	}
	$.getJSON('ruizhao/rz_data/data.json', onLoaded);
}

/***********************************
SETUP
***********************************/

//declare CubicBezierUtil so it can be used by makeBezier:
//used for bezier math, picking x-positions and t-values, and matching mouse x,y coordinates with specific beziers.

var CubicBezierUtil = (function CubicBezierUtil() {
    var api;

    //assumes x1<x2<x3<x4
    function tFromVal(x, x1, x2, x3, x4, steps) {
        var tA, valA, tB, valB, it, t, step;

        if(x>x4 || x<x1) {
            return Number.NaN;
        }

        step = 0.5;
        val = Number.POSITIVE_INFINITY;
        t = 0.5;

        for(var i=0; i<steps; ++i) {
            it = 1-t;
            val =  x1*it*it*it + x2*3*it*it*t + x3*3*it*t*t + x4*t*t*t;
            step *= 0.5;
            
            if(val>x) {
                t-= step;
            } else {
                t+= step;
            }
        }

        return t;
    }

    function valueOn(t, x1, x2, x3, x4) {
        var it=1-t;
        return x1*it*it*it + x2*3*it*it*t + x3*3*it*t*t + x4*t*t*t;
    }

    function yFromX(x, p1, p2, p3, p4, steps) {
        var t = tFromVal(x, p1.x, p2.x, p3.x, p4.x, steps);

        if(isNaN(t)) {
            return t;
        }

        return valueOn(t, p1.y, p2.y, p3.y, p4.y);
    }

    api = {
        yFromX : yFromX,
        valueOn : valueOn,
        tFromVal : tFromVal
    };

    return api;
}());


function initData() {

	//sort on death order, first by month, then by order within month
	// curves.sort(function(a, b) {
	// 	return a.incId - b.incId;
	// });

	console.log(curves);

	//initialize current and most recent x and y values on curves, choose colors for each curve
	curves.forEach(function(curve){
			curve.Age = +curve.Age;
			curve.x = arcOffsetH / 2;
			curve.y = (arcSpaceHeight + arcOffsetV) / 2;
			curve.mrx = arcOffsetH / 2;
			curve.mry = (arcSpaceHeight + arcOffsetV) / 2;
			curve.lifecolor = life_strokeColor[Math.floor(Math.random() * (life_strokeColor.length - 1))];
			curve.afterlifecolor = afterlife_strokeColor[Math.floor(Math.random() * (afterlife_strokeColor.length - 1))];
	});

	//create a dictionary of person curve data to search when rendering the mouseover tooltip
	curveDict = [];
	var curvesLength = curves.length;

	for (var counter = 0; counter < curvesLength; counter++) {
		var obj = {};
		var bezier = makeBezier(curves[counter]);
		obj.flipped = false;
		obj.life = bezier[0];
		obj.afterlife = bezier[1];
		obj.curve = curves[counter];
		curveDict.push(obj);
	}

	// ///////////////////////////////////////////////////////////////////////////////////////
	// //create a dictionary of nation
	// nationDict = [];
    //
	// for (var counter = 0; counter < curvesLength; counter++) {
	// 	var objn = {};
	// 	objn.nation = curves[counter].Nation;
	// 	nationDict.push(objn);
	// }
}

/***********************************
INITIALIZE
***********************************/

//init function, called when body loads
//When page loads, set up all the tweens inside a for loop through the data array, with delay incremented
// as a function of the loop that establishes the tweens
//delay constantly increasing, but by decreasingly small amounts
//each curve is driven by two bezier-shape tweens: the first shapes the "life" curve,
// the second shapes the "afterlife" curve

function introzr() {
	//called when the body loads, loads the HTML;
        function headFoot() {
            $(".header").fadeIn(200);
        }

        function axis() {
            $(".axis, .axisLabel").fadeIn(500);
        }

        function ui() {
            $("#peoplebox, #yearsbox, #distSwitch, #menuBox, #blurb").fadeIn(200);
        }

        function canvas() {
            $("#c").fadeIn(200);
        }

        //show all the UI stuff, begin the intro animation.
        setTimeout(headFoot, 500);
        setTimeout(axis, 2000);
        setTimeout(ui, 3500);
        setTimeout(canvas, 1000);
        setTimeout(init, 5100);
}


	function init() {
		//viz element setup, creates stages for each of three canvases
		stage = new createjs.Stage(canvas);
		distStage = new createjs.Stage(distributionCanvas);
		//distStage.onMouseUp = distStageClick;
		overstage = new createjs.Stage(overlay);

		//Ticker class sets tick rate
		//easel tick loop updates canvas 30 times/sec
		createjs.Ticker.useRAF = true;
		createjs.Ticker.setFPS(30);
		//tick function updates the "canvas" canvas
		createjs.Ticker.addListener(tick);
		//these two render the stages to the canvas
		createjs.Ticker.addListener(distStage);
		createjs.Ticker.addListener(overstage);
		//Set stageupdateclear to false so previous frame's lines are not cleared away
		//comment this line out and increase line alpha for lazer fight mode
		stage.autoClear = false;
		//for when calling init() a second time
		stage.clear();
		overstage.enableMouseOver(5);
		overstage.onMouseDown = testMouseDown;
		overstage.onMouseMove = delayMove;

		axis = makeAxis();

		//make first subset
		var subset = getSubset(curves, masterFilter);

		//reset counters
		pctTop = 0; pctBot = 0; peopleCount = 0; yearsCount = 0;

		//populate distributionPath for distView
		distributionPath = makeDist(subset);

		//prepare dots
		dotsContainer.visible = false;
		//renders dots on offscreen canvas object and turns into a bitmap for fast display
		dotsContainer.addChild(new createjs.Bitmap(paintDots(curves)));

		//add all the components of the overlay stage to it
		overstage.addChild(filterTop);
		overstage.addChild(filterBot);
		overstage.addChild(dotsContainer);
		overstage.addChild(axis);
		overstage.addChild(heartbeats);
		overstage.addChild(histograms);
		overstage.addChild(tooltip);

		//in case this is called for the second time...
		filterTop.removeAllChildren();
		filterBot.removeAllChildren();
		$(".tooltip").remove();

		//Tween setup
		TweenMax.killAll();
		function calcDuration(i) {
			//calculate the tween duration based on position inside the for loop
			//duration and inter-tween delay decrease logarithmically
			if (i < 5) {
				return 1600 / (Math.log(i+10)*2);
			} else {
				return 1600 / (Math.log(i+10)*4);
			}
		}
		function calcDelay(i) {
			//calculate the tween delay based on position inside the for loop
			return 8 / (Math.log(i+10)*8);
		}
		var wait = 0;
		var curves_length = curves.length;
		var filter = curveFilter()[masterFilter];
		var bezierCurve;
		//establish all tweens, their durations, and their delays
		for (var i = 0; i < curves_length; i++) {

			bezierCurve = makeBezier(curves[i]);

			//sets up the timing of the intro animation
			if (i == 0) {
				wait += 0;
			} else if (i == 1) {
				wait += calcDuration(0);
			} else if (i < 5) {
				wait += 120;
			} else if (i === 5) {
				wait += calcDuration(4) + 60;
			} else {
				wait += calcDelay(i);
			}

			ratio = bezierCurve[2][0];

			tweenList.push(new TweenMax(
				curves[i],
				ratio * calcDuration(i),
				{
					bezier:{
						type: "cubic",
						values: filter(curves[i]) ? bezierCurve[0] : flipBezier(bezierCurve[0])
					},
					ease: Linear.ease,
					delay: wait,
					onStart: addCurve,
					onStartParams: [i, curves[i]],
					onComplete: death,
					onCompleteParams: [i, curves[i]]
				}
			));
			tweenList.push(new TweenMax(
				curves[i],
				(1 - ratio) * calcDuration(i),
				{
					bezier: {
						type: "cubic",
						values: filter(curves[i]) ? bezierCurve[1] : flipBezier(bezierCurve[1])
					},
					ease: Linear.ease,
					delay: wait + ratio * calcDuration(i),
					onComplete: removeCurve,
					onCompleteParams: [i, curves[i]]
				}
			));
		}
		timeline = new TimelineMax({tweens: tweenList, align: "normal", delay: 0, useFrames: true, autoRemoveChildren: true});


		(function ToggleController() {
			//controller for toggle buttons
			var $swtch, viewingHist;

			function swapFocus() {
				$swtch.toggleClass('focus');
			}

			function onClick() {
				gunviz.testMouseDown('axismimic');
				swapFocus();
			}

			function onOver() {
				gunviz.delayMove('axismimic');
			}

			function onOut() {
				gunviz.delayMove('notaxismimic');
			}

			viewingHist = false;
			$swtch = $('#distSwitch');

			$swtch
				.click(onClick);

			$swtch.mouseover(onOver).mouseout(onOut);
		}());
}

/***********************************
TICK FUNCTION
***********************************/

function tick() {
	var x, y, temp_curve, mrx, mry, age, color, beaty, gotoy, beatcolor, dot;
	//on easel tick update, for each line currently being drawn, move to that line's endpoint (stored in an array previously)
	//and draw a line to the new (x, y) value calculated by TweenMax.
	//for each currently active curve,
	var active_len = activecurves.length;
	for (var i = 0; i < active_len; i++) {
		
		if (!(i in activecurves) || !activecurves[i]) {
			if ("dot" in curves[i]) {
				heartbeats.removeChild(curves[i].dot);
				delete curves[i].dot;
			}
			continue;
		}

		temp_curve = activecurves[i];
		age = activecurves[i].Age;
		if (i >= 5) {
			color = activecurves[i].lifecolor;
		} else {
			color = activecurves[i].lifecolor.slice(0, -4)+"1)";
		}
		if (i >= 5) {
			aftercolor = activecurves[i].afterlifecolor;
		} else {
			aftercolor = activecurves[i].afterlifecolor.slice(0, -4)+"1)";
		}
		x = activecurves[i].x;
		mrx = activecurves[i].mrx;
		mry = activecurves[i].mry;
		y = activecurves[i].y;
		var bezierGuide = makeBezier(activecurves[i]);

		//Depending on the x value, change the color of the line.
		//then move to the endpoint of the curve and draw a line to the new point
		if (mrx < bezierGuide[1][0].x) {
			//life
			var temp_line = new createjs.Shape();
			temp_line.graphics.setStrokeStyle(life_strokeStyle).beginStroke(color)
			.moveTo(mrx, mry)
			.lineTo(x, y);
			stage.addChild(temp_line);
		}	else {
			//afterlife
			var temp_line = new createjs.Shape();
			temp_line.graphics.setStrokeStyle(afterlife_strokeStyle).beginStroke(aftercolor)
			.moveTo(mrx, mry)
			.lineTo(x, y);
			stage.addChild(temp_line);
			//remove heartbeat
			if ("heartbeat" in activecurves[i]) {
				heartbeats.removeChild(activecurves[i].heartbeat);
				delete activecurves[i].heartbeat;
			}
			if ("dot" in curves[i]) {
				dot = curves[i].dot;
				dot.vel = dot.vel || 1;

				dot.y += dot.vel;
				dot.vel += 0.4;
				if (curves[i].dot.y >= h / 2) {
					heartbeats.removeChild(curves[i].dot);
					delete curves[i].dot;
					var temp_dot = new createjs.Shape();
					temp_dot
					.graphics.beginFill(curves[i].lifecolor)
					.drawCircle(xscale(curves[i].Age), h / 2, 2.5);
					stage.addChild(temp_dot);
				}
			}
		}

		temp_curve.mrx = x;
		temp_curve.mry = y;

		//skip the heartbeat

		if (color != undefined && mrx > bezierGuide[1][0].x - 5 && mrx < bezierGuide[1][0].x + 5) {

			if (!("heartbeat" in activecurves[i])) {

				//start the heartbeat as a bezier curve in the shape of the victim's life
				var temp_curve = mry > h / 2 ? flipBezier(bezierGuide[0]) : bezierGuide[0];
				activecurves[i].heartbeat = new createjs.Shape();
				activecurves[i].heartbeat.graphics.setStrokeStyle(1)
				.beginStroke(color)
				.moveTo(temp_curve[0].x, temp_curve[0].y)
				.bezierCurveTo(temp_curve[1].x, temp_curve[1].y, temp_curve[2].x, temp_curve[2].y, temp_curve[3].x, temp_curve[3].y)
				heartbeats.addChild(activecurves[i].heartbeat);

				if (i < 5 && !("dot" in activecurves[i])) {
					activecurves[i].dot = new createjs.Shape();
					activecurves[i].dot.graphics.beginFill(color)
					.drawCircle(0, 0, 2.5);
					activecurves[i].dot.x = temp_curve[3].x;
					activecurves[i].dot.y = temp_curve[3].y;
					heartbeats.addChild(activecurves[i].dot);
				}
			}

			//skip the jagged heartbeat shape
			continue;

			//make the jagged heartbeat shape
			beaty = activecurves[i].beaty||y;
			var beattypes = [0, -2, 2, -1, 1];
			activecurves[i].beatnum = activecurves[i].beatnum+1||0;
			gotoy = y + beattypes[activecurves[i].beatnum % 5] * 10;
			beatcolor = color.slice(0, -4)+"1)";
			activecurves[i].beaty = gotoy;
			activecurves[i].heartbeat.graphics.setStrokeStyle(life_strokeStyle)
			.beginStroke(beatcolor)
			.moveTo(mrx, beaty)
			.lineTo(x, gotoy);
		}
	}

	//update canvas without clearing
	//Easel updates the line but maintains no internal representation of it.
	overstage.update();
	stage.update();

	//remove children so stage doesn't need to render them again on the next tick
	stage.removeAllChildren();
}

/***********************************
HELPER FUNCTIONS
***********************************/

function findT(p1, p2, t) {
	var a = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
	var h = Math.sqrt(Math.pow(p2[1] - p1[1], 2) + Math.pow(p2[0] - p1[0], 2));
	var i = Math.cos(a) * t * h;
	var j = Math.sin(a) * t * h;
	var retX = p1[0] + i;
	var retY = p1[1] + j;

	return [retX, retY];
}

//altage is the age that the person would live to be if not died (by World Health Organization)
function makeBezier(curve) {
	var m1 = [xscale(0), y(0, curve.Age)];
	var m4 = [xscale(curve.Altage), y(0, curve.Age)];
	var m2 = [0.25 * m4[0], y(1.5, curve.Age)];
	var m3 = [0.75 * m4[0], y(1.5, curve.Age)];

	var t = CubicBezierUtil.tFromVal(xscale(curve.Age), m1[0], m2[0], m3[0], m4[0], 20);

	var m5 = findT(m2, m3, t);

	var p1 = m1;
	var p8 = m4;
	var p2 = findT(m1, m2, t);
	var p7 = findT(m3, m4, t);
	var p3 = findT(p2, m5, t);
	var p6 = findT(m5, p7, t);
	var p4 = findT(p3, p6, t);
	var p5 = findT(p3, p6, t);

	return  [[{x: p1[0], y: p1[1]}, {x: p2[0], y: p2[1]}, {x: p3[0], y: p3[1]}, {x: p4[0], y: p4[1]}],
					[{x: p5[0], y: p5[1]}, {x: p6[0], y: p6[1]}, {x: p7[0], y: p7[1]}, {x: p8[0], y: p8[1]}],
					[t]];
	
	function y(value, age) {
		//based on age of death, calculate a max arc height value
		var arcHeight = (age+5) / 110;
		return ((1 - value) * (arcHeight * (arcSpaceHeight / 2))) + ((1 - arcHeight) * (arcSpaceHeight / 2)) + arcOffsetV / 2;
	}
}

function xscale(age) {
	//scale for converting ages to x values
	return arcOffsetH / 2 + (age / 100) * arcSpaceWidth;
}

//When the beziers are flipped, the y values go from being y down from the top to being y up from the bottom.
function flipY(y) {
	return h - y;
}

function flipBezier(bezier) {

	for (var i = 0; i < bezier.length; i++) {
		bezier[i].y = flipY(bezier[i].y);
	}

	return bezier;
}

function flipBeziers(beziers) {
	for (var i=0, l=beziers.length; i<l; ++i) {		
			flipBezier(beziers[i].b1);
			flipBezier(beziers[i].b2);
	}
}

function syncFlipped(curveDict, filter) {
	var item;

	for(var i=0, l=curveDict.length; i<l; ++i) {
		item = curveDict[i];

		if (filter(item.curve) === item.flipped) {
			flipBezier(item.life);
			flipBezier(item.afterlife);
			item.flipped = !item.flipped;
		}
	}
}

function stopAnimation() {	
	if (isIntroComplete) {
		return false;
	}
	stage.autoClear = true;	
	playingAnimation = false;
	isIntroComplete = true;
	createjs.Ticker.removeListener(tick);
	TweenMax.killAll();
	stage.removeAllChildren();
	stage.clear();
	heartbeats.removeAllChildren();
	//document.getElementById("monthLabel").innerHTML = "";
	$('#container').removeClass('introzr');
	$('#blurb').removeClass('introzr');
	$("#findings").fadeIn(1500);
	$("#questionMark").fadeIn(1500);
	return true;
}

function formatComma(num) {
	if (parseInt(num) >= 1000) {
		return num.toString().slice(0, -3)+","+num.toString().substr(-3);
	} else {
		return num.toString();
	}
}

/***********************************
TRIGGERED FUNCTIONS
***********************************/

var eHandler = {};

(function(h) {

	var events = {};
	var listenId = -1;

	h.sub = function(e, func) {
		if (!events[e]) {
			events[e] = [];
		}

		var id = (listenId++).toString();
		events[e].push({
			id: id,
			response: func
		});

		return id;
	};

	h.unsub = function(id) {
		for (var e in events) {
			if (events[e]) {
				for (var i = 0, l = events[e].length; i < l; i++) {
					if (events[e][i].id === id) {
						events[e].splice(i, 1);
						return id;
					}
				}
			}
		}
		return this;
	};

	h.pub = function(e, args) {
		if (!events[e]) {
			return false;
		}

		var listeners = events[e],
				len = listeners ? listeners.length : 0;

		while (len--) {
			listeners[len].response(e, args);
		}
		return this;
	};

}(eHandler));

var stageFader = (function() {

	var counter = 0;

	function fadeStage() {
		var stages = 45;
		if (counter <= (1/3)*stages) {
			window.setTimeout(fadeStage, 1500/stages);
			counter++;
			return;
		}
		var temp_clear = new createjs.Shape();
		//temp_clear.graphics.beginFill("rgba(20,20,20,"+(1 - Math.pow(1 - 0.7 , 1/((2/3)*stages)))+")").drawRect(0,0,w,h);
		stage.addChild(temp_clear);
		counter++;
		if (counter >= stages) {
			return;
		} else {
			window.setTimeout(fadeStage, 1500/stages);
		}
	}

	return {
		fadeStage: fadeStage
	}

}());

$(".viewSetter").click($(this), setView);	

function setView(el) {
	var viewType = $(this).attr("data");
	sortArrays(viewType, $("#"+viewType+"Button"));
	if (!inDistView) {
		gunviz.testMouseDown('axismimic');
	} else {
		gunviz.distView(true);
	}
}

function addCurve(i, curve) {
	activecurves[i] = curve;

	if (i === 0) {
		var temp_cover = new createjs.Shape();
		//temp_cover.graphics.beginFill("rgba(20,20,20,1)").drawRect(0,0,w,h);
		stage.addChild(temp_cover);
	}
}

function death(i, curve) {
	peopleCount++;
	
	filter = curveFilter()[masterFilter];
	if (filter(curve)) {
		pctTop++;
	} else {
		pctBot++;
	}

	updateLabels();

	if (i >= 5) {
		var temp_dot = new createjs.Shape();
		temp_dot
		.graphics.beginFill(curve.lifecolor)
		.drawCircle(xscale(curve.Age), h / 2, 2.5);
		stage.addChild(temp_dot);
	}

	var b = makeBezier(curve);

	if (i < 5) {
		if (typeof introTtip[0] === "undefined") {
			introTtip[0] = [];
		}

		introTtip[0][i] = new periscopic.ui.Tooltip();
		introTtip[0][i]
		.strokeWidth(0)
		.bgColor("rgba(0,0,0,0)")
		.horizontal(false)
		.mirror(true)
		.copy("killed at "+ Math.floor(curve.Age))
		.copyClass("bigTooltip")
		.setTipPosition(0)
		.shrinkWidth(300)
		.x(b[0][3].x)
		.y(CubicBezierUtil.yFromX(b[0][3].x, b[0][0], b[0][1], b[0][2], b[0][3], 20) + 10);

		introTtip[0][i].el().appendTo("#c").hide().fadeIn(200);

		introTtip[0][i].el().delay(1500).fadeOut(200, null, function(){$(this).remove();});

		introTtip[0][i].render().position();
	}
}

function removeCurve(i, curve) {
	activecurves[i] = null;

	yearsCount += Math.floor(curve.Altage) - Math.floor(curve.Age)>0 ? Math.floor(curve.Altage) - Math.floor(curve.Age): 0;

	updateLabels();

	var dotColor = i > 5 ? curve.afterlifecolor : curve.afterlifecolor.slice(0, -4)+"1)";

	var temp_dot = new createjs.Shape();

	temp_dot
	.graphics.beginFill(dotColor)
	.drawCircle(xscale(curve.Altage), h / 2, 2.5);
	stage.addChild(temp_dot);

	if (i < 5) {
		if (typeof introTtip[1] === "undefined") {
			introTtip[1] = [];
		}

		introTtip[1][i] = new periscopic.ui.Tooltip();
		introTtip[1][i]
		.strokeWidth(0)
		.bgColor("rgba(0,0,0,0)")
		.horizontal(false)
		.mirror(false)
		.copy("<span class='tIt'>could have lived to be "+Math.floor(curve.Altage)+"</span>")
		.copyClass("bigTooltip")
		.setTipPosition(xscale(curve.Altage) > arcOffsetH / 2 + 0.75 * arcSpaceWidth ? 1 : 0)
		.shrinkWidth(300)
		.x(xscale(curve.Altage))
		.y(h / 2 - 15);
	
		introTtip[1][i].el().appendTo("#c").hide().fadeIn(200);

		introTtip[1][i].el().delay(1500).fadeOut(200, null, function(){$(this).remove();});

		introTtip[1][i].render().position();
	}

	if (i === 4) {
		if (typeof introTtip[0] != "undefined") {
		}
		if (typeof introTtip[1] != "undefined") {
		}
	}

	if (i === 4) {
		stageFader.fadeStage();
	}

	if (i === curves.length - 1) {
		playingAnimation = false;
		$("#findings").fadeIn(1500);
		$("#questionMark").fadeIn(1500);
		$('#container').removeClass('introzr');
		$('#blurb').removeClass('introzr');
	}
}

function updateLabels() {
	document.getElementById("peoplecount").innerHTML = formatComma(peopleCount);

	document.getElementById("yearscount").innerHTML = formatComma(yearsCount);

	document.getElementById("pctTop").innerHTML = formatComma(Math.round(pctTop))+" | "+Math.round(pctTop / peopleCount * 100).toString()+"%";

	document.getElementById("pctBot").innerHTML = formatComma(Math.round(pctBot))+" | "+Math.round(pctBot / peopleCount * 100).toString()+"%";
}

var labelController = (function() {

	var topLeftContent = "";
	var botLeftContent = "";
	var topRightContent = "";

	function showTopLeft(show) {
		var display = show ? "block" : "none";
		$("#topFilter").css("display", display);
		$("#pctTop").css("display", display);
		return this;
	}

	function showBotLeft(show) {
		var display = show ? "block" : "none";
		$("#botFilter").css("display", display);
		$("#pctBot").css("display", display);
		return this;
	}

	function showTopRight(show) {
		var display = show ? "block" : "none";
		$("#topHistLabel").css("display", display);
		return this;
	}

	function pushContent() {
		$("#topFilter").html(topLeftContent);
		$("#botFilter").html(botLeftContent);
		$("#topHistLabel").html(topRightContent);
		return this;
	}

	function setContent(side, vert, newContent) {
		right = side === "right" ? true : false;
		bot = vert === "bot" ? true : false;

		if (!right && !bot) {

			var text = newContent || filterDisplayNamesDict[distributionPath[0][1][0].data.filter];

			console.log(distributionPath);
			console.log(text);

			if (text.substr(-8) == "killings") {
				text = text.slice(3, -9).replace("-", " ");
			}
			if (text.substr(0, 8) == "multiple") {
				text = text+"s";
			}
			if (text == "people") {
				text = "age of victims";
			}

			topLeftContent = text;
			return this;
		
		} else if (!right && bot) {

			var text = newContent || altFilterDict[distributionPath[0][1][0].data.filter];

			if (text.substr(-8) == "killings") {
				text = text.slice(3, -9).replace("-", " ");
			}
			if (text.substr(0, 8) == "multiple") {
				text = text+"s";
			}
			if (text.substr(0, 4) == "with") {
				text = "all"+text.slice(4);
			}

			botLeftContent = text;
			return this;

		} if (right && !bot) {

			var text = newContent || "potential lifespan";

			topRightContent = text;
			return this;

		} else if (right && bot) {
			return this;
		}
	}

	var api = {
		showTopLeft: showTopLeft,
		showBotLeft: showBotLeft,
		showTopRight: showTopRight,
		pushContent: pushContent,
		setContent: setContent,
	};
	return api;
}());

function testMouseDown(movement) {
	//axis area handler
	if (checkInAxis(movement)) {
		//fade overstage into background, enter distribution view
		if (inDistView) {
			distView();
			overstage.alpha = 1;
			if (movement != "axismimic") {
				axis.alpha = 1;
				$("#distSwitch").toggleClass("focus");
			}
			drawDist(false);
		} else {
			if (movement != "axismimic") {
				$("#distSwitch").toggleClass("focus");
			}
			var test = stopAnimation();
			histograms.removeAllChildren();
			overstage.alpha = 0.15;
			axis.alpha = 0;
			if (test) {sortArrays(masterFilter);}
			distView(false, movement);
		}
	//other area handler
	} else {
	}
}

function delayMove(movement) {
	if (playingAnimation) {
		return;
	}

	clearTimeout(delayWatcher);
	if (movement == 'axismimic') {
		testMouseMove(movement);
	} else {
		delayWatcher = setTimeout(testMouseMove, 250, movement);
	}

	tooltip.removeAllChildren();
	removeActivePerson();

	//distribution view handler
	if (inDistView) {
		//add visible rectangle
		for (var prop in distHistGroup) {
			if (distHistGroup.hasOwnProperty(prop)) {

				var min = h / 2, max = h / 2, yVal;
				for (var i = 0; i < 2; i++) {
					for (var j = 0; j < 2; j++) {
						for (var k = 0; k < distributionPath[i][j].length; k++) {
							yVal = j == 1 ? flipY(distributionPath[i][j][k].y) : distributionPath[i][j][k].y;
							if (yVal < min) {
								min = yVal;
							}
							if (yVal > max) {
								max = yVal;
							}
						}
					}
				}

				if (movement.rawX > arcOffsetH / 2 && movement.rawX < arcOffsetH / 2 + arcSpaceWidth && movement.rawY >= min && movement.rawY <= max) {
					distHistGroup[prop].moveRect(movement);
				} else {
					var falseMovement = {
						rawX: -20
					};
					distHistGroup[prop].moveRect(falseMovement);
				}
				distHistGroup[prop].tooltip.hide();
			}
		}
		//show axis on mouseover
		if (checkInAxis(movement) && movement != "axismimic") {
			distAxis.alpha = 1;
		} else {
			distAxis.alpha = 0;
		}
	//axis area handler
	} else if (checkInAxis(movement)) {
	//other instance handler
	} else {
		if (histograms.getNumChildren() > 0) {
		}
		histograms.removeAllChildren();
		axis.alpha = 0;
		dotsContainer.visible = true;
	}
}

function testMouseMove(movement) {
	//distribution view handler
	if (inDistView) {
		if (movement != 'axismimic' && movement !== 'notaxismimic') {
			
			var min = h / 2, max = h / 2, yVal;
			for (var i = 0; i < 2; i++) {
				for (var j = 0; j < 2; j++) {
					for (var k = 0; k < distributionPath[i][j].length; k++) {
						yVal = j == 1 ? flipY(distributionPath[i][j][k].y) : distributionPath[i][j][k].y;
						if (yVal < min) {
							min = yVal;
						}
						if (yVal > max) {
							max = yVal;
						}
					}
				}
			}

			if (movement.rawX > arcOffsetH / 2 && movement.rawX < arcOffsetH / 2 + arcSpaceWidth && movement.rawY >= min && movement.rawY <= max) {
				
				moveDistTooltip(movement);
			
			} else {
				for (var prop in distHistGroup) {
					if (distHistGroup.hasOwnProperty(prop)) {
						distHistGroup[prop].tooltip.hide();
					}
				}
			}
		}
	} else if (checkInAxis(movement)) {

		if (movement != "axismimic") {axis.alpha = 1;}
		tooltip.removeAllChildren();

		if (histograms.getNumChildren() === 0) {
			drawDist(false);
			dotsContainer.visible = false;
		}
		return;
	} else {
		if (movement != 'axismimic' && movement != 'notaxismimic') {
			activePersonTooltip = makeTooltip(movement);
		}
	}
}

function checkInAxis(movement) {
	if (movement === 'axismimic') {
		return true;
	}	else if (movement === 'notaxismimic') {
		return false;
	} else if (movement.rawY > (h / 2) - 5 && movement.rawY < (h / 2) + 5 && movement.rawX > arcOffsetH / 2 && movement.rawX < w - arcOffsetH / 2) {
		return true;
	} else {
		return false;
	}
}

function removeActivePerson() {
	if (activePersonTooltip) {
		activePersonTooltip[0].el().fadeOut(200, null, function(){$(this).remove();});
		activePersonTooltip[1].el().fadeOut(200, null, function(){$(this).remove();});
	}
}

function makeAxis() {
	var axis = new createjs.Container();
	//Make axis
	axis.x = arcOffsetH / 2;
	axis.y = h / 2;
	var axisLine = new createjs.Shape();
	axisLine.graphics.setStrokeStyle(2).beginStroke("rgba(220, 220, 220, 1)")
	.moveTo(0, 0)
	.lineTo(arcSpaceWidth, 0);

	for (var i = 1; i <= 9; i++) {
		var axisX = (arcSpaceWidth / 10)*i;
		axisLine.graphics
		.moveTo(axisX, -4)
		.lineTo(axisX, 4);
		var axisText = new createjs.Text(""+i * 10+"", "8px Lato", "rgba(220,220,220,1)");
		axisText.x = axisX - 5;
		axisText.y = 6;
		axis.addChild(axisText);
	}

	axis.addChild(axisLine);

	axis.alpha = 0;

	return axis;
}

/***********************************
CURVE TOOLTIP
***********************************/

function makeTooltip(movement) {
	tooltip.removeAllChildren();
	
	removeActivePerson();

	var info = getInfo(movement.rawX, movement.rawY);
	if (info == null) {
		return;
	}

	var ttip = [];
	ttip[0] = new periscopic.ui.Tooltip();
	ttip[0]
	.horizontal(false)
	.mirror(movement.rawY < 125 ? false : (movement.rawY > h / 2 ? (movement.rawY > h - 125 ? true : false) : true))
	.copy(info.words[0])
	.copyClass("bigTooltip")
	.setTipPosition(movement.rawX / w)
	.shrinkWidth(300)
	.x(movement.rawX)
	.y(movement.rawY < 125 ? movement.rawY + 15 : (movement.rawY > h / 2 ? (movement.rawY > h - 125 ? movement.rawY : movement.rawY + 15) : movement.rawY));

	ttip[0].el().appendTo("#c").hide().fadeIn(200);

	ttip[0].render().position();

	ttip[1] = new periscopic.ui.Tooltip();
	ttip[1].horizontal(false)
	.mirror(movement.rawY > h / 2 ? true : false)
	.copy(info.words[1])
	.copyClass("bigTooltip")
	.setTipPosition(xscale(info.curve.Altage) / w)
	.shrinkWidth(300)
	.x(xscale(info.curve.Altage))
	.y(h / 2);

	ttip[1].el().appendTo("#c").hide().delay(400).fadeIn(200);

	ttip[1].render().position();

	var filter = curveFilter()[masterFilter];
	var lifeBezier = info.bezier.b1;
	var alifeBezier = info.bezier.b2;

	var lifeCurve = new createjs.Shape();
	lifeCurve.graphics
		.setStrokeStyle(life_strokeStyle)
		.beginStroke("rgba(255, 255, 110, .5)")
		.moveTo(lifeBezier[0].x, lifeBezier[0].y)
		.bezierCurveTo(lifeBezier[1].x, lifeBezier[1].y, lifeBezier[2].x, lifeBezier[2].y, lifeBezier[3].x, lifeBezier[3].y);
	tooltip.addChild(lifeCurve);
	var afterlifeCurve = new createjs.Shape();
	afterlifeCurve.graphics
		.setStrokeStyle(afterlife_strokeStyle)
		.beginStroke("rgba(220, 220, 220, .8)")
		.moveTo(alifeBezier[0].x, alifeBezier[0].y)
		.bezierCurveTo(alifeBezier[1].x, alifeBezier[1].y, alifeBezier[2].x, alifeBezier[2].y, alifeBezier[3].x, alifeBezier[3].y);
	tooltip.addChild(afterlifeCurve);

	for (var i = 0; i < info.others.length; i++) {
		if (i % 2 == 0) {
			lifeCurve.graphics.moveTo(info.others[i][0].x, info.others[i][0].y)
			.bezierCurveTo(info.others[i][1].x, info.others[i][1].y, info.others[i][2].x, info.others[i][2].y, info.others[i][3].x, info.others[i][3].y);
		} else {
			afterlifeCurve.graphics.moveTo(info.others[i][0].x, info.others[i][0].y)
			.bezierCurveTo(info.others[i][1].x, info.others[i][1].y, info.others[i][2].x, info.others[i][2].y, info.others[i][3].x, info.others[i][3].y);
		}
	}

	return ttip;
}

function getInfo(x, y) {
	var person = findPerson(x, y);
	if (person === null) {
		return null;
	}

	var incId = person.curve.incId;
	var others = [];
	for (var i = 0; i < curveDict.length; i++) {
		if (curveDict[i].curve.incId === incId) {
			others.push(curveDict[i].life);
			others.push(curveDict[i].afterlife);
		}
	}

	var bEm = "<span class='tEm'>";
	var eEm = "</span>";
	var bIt = "<span class='tIt'>";
	var eIt = "</span>";
	var data = person.curve;

	if (data.Age > 18) {
		var sex = sexDict[data.Sex[0]];
	} else if (data.Age > 1) {
		switch (data.Sex) {
			case "Male":
				var sex = "boy";
				break;
			case "Female":
				var sex = "girl";
				break;
			default:
				var sex = "child";
				break;
		}
	} else if (data.Age <= 1) {
		var sex = "baby";
	}

	// var numOthers = others.length / 2 - 1;
	// if (numOthers <= 0) {
	// 	var othersListing = "";
	// } else if (numOthers == 1) {
	// 	var othersListing = "<hr class='hoverRule'>"+bEm+"1"+eEm+" other person was killed in this incident.";
	// } else {
	// 	var othersListing = "<hr class='hoverRule'>"+bEm+numOthers.toString()+eEm+" other people were killed in this incident.";
	// }

	var nation = bEm + [data.Nation] + eEm;

	var age = Math.floor(data.Age);
	var posPronoun = posPronounDict[data.Sex[0]];
	var pronoun = pronounDict[data.Sex[0]];

	// var circ = circDispDict[data.circ];
	// var circNum, circumstances;
	// for (var i = 0; i < circDict.length; i++) {
	// 	if (circDict[i].indexOf(circ) > -1) {
	// 		circNum = i;
	// 		break;
	// 	}
	// }

	// if (circNum == 0) {
	// 	var circumstances = " during a "+bEm+circ+eEm;
	// } else if (circNum == 1) {
	// 	var circumstances = " during an "+bEm+circ+eEm;
	// } else if (circNum == 2) {
	// 	var circumstances = " while "+bEm+circ+eEm;
	// } else if (circNum == 3) {
	// 	var circumstances = "";
	// }

	// var altCause = data.altcause.replace(/_/g,' ');
	// if (altCause.search(/tumor/) >= 0) {
	// 	altCause = "a "+bEm+altCause+eEm;
	// } else {
	// 	altCause = bEm+altCause+eEm;
	// }
	// var groupNum;

	// for (var i = 0; i < relationDict.length; i++) {
	// 	if (relationDict[i].indexOf(data.offrel) > -1) {
	// 		groupNum = i;
	// 		break;
	// 	}
	// }

	// if (groupNum <= 0) {
	// 	var pronounPhrase = posPronoun;
	// } else if (groupNum == 1) {
	// 	var pronounPhrase = "a "+relationship;
	// } else if (groupNum >= 2) {
	// 	var pronounPhrase = "an "+relationship+" person";
	// } else if (typeof groupNum == "undefined") {
	// 	var pronounPhrase = "an unknown person";
	// }

	var altage = Math.floor(data.Altage);

	var tiptext1 = ["This ",bEm,sex,eEm," from ", nation, " died at the age of ",bEm,age,eEm, "."];
	var tiptext2 = [bIt,"Had ",pronoun," not been killed in this accident, ", pronoun, " might have lived to be ", bEm,altage,eEm,".", eIt];
	var words = [tiptext1.join(""), tiptext2.join("")];

	var obj = {bezier: {b1: person.life, b2: person.afterlife}, words: words, curve: person.curve, others: others};

	return obj;
}

function findPerson(x, y) {
	var result = null, len = curveDict.length;
	var filter = curveFilter()[masterFilter];
	var offset = Math.floor(Math.random() * len);
	for (var index = 0, i; index < len; index++) {
		i = (index+offset) % len;
		var lifeY = CubicBezierUtil.yFromX(x, curveDict[i].life[0], curveDict[i].life[1], curveDict[i].life[2], curveDict[i].life[3], 10);
		
		if (!isNaN(lifeY)) {
			if (Math.abs(lifeY - y) <= 3) {
				result = curveDict[i];
				break;
			}
		} 

		var afterlifeY = CubicBezierUtil.yFromX(x, curveDict[i].afterlife[0], curveDict[i].afterlife[1], curveDict[i].afterlife[2], curveDict[i].afterlife[3], 10);

		if (!isNaN(afterlifeY)) {
			if (Math.abs(afterlifeY - y) <= 3) {
				result = curveDict[i];
				break;
			}
		} 
	}
	return result;
}

/***********************************
FILTERING
***********************************/

function curveFilter() {
	this.nofilter = function(item) {return true;};
	this.child = function(item) {if (Math.floor(item.Age) <= 18) {return true;} else {return false;}};
	this.adult = function(item) {if (Math.floor(item.Age) > 18) {return true;} else {return false;}};
	this.yadult = function(item) {if (Math.floor(item.Age) <= 30) {return true;} else {return false;}};
	this.oadult = function(item) {if (Math.floor(item.Age) > 30) {return true;} else {return false;}};
	this.male = function(item) {if (item.Sex == "Male") {return true;} else {return false;}};
	this.female = function(item) {if (item.Sex == "Female") {return true;} else {return false;}};
	this.China = function(item) {if (item.Nation == "China") {return true;} else {return false;}};
	this.Malaysia = function(item) {if (item.Nation == "Malaysia") {return true;} else {return false;}};
	this.France = function(item) {if (item.Nation == "France") {return true;} else {return false;}};
	this.Russia = function(item) {if (item.Nation == "Russia") {return true;} else {return false;}};
	this.Australia = function(item) {if (item.Nation == "Australia") {return true;} else {return false;}};
	this.Ukraine = function(item) {if (item.Nation == "Ukraine") {return true;} else {return false;}};
	this.Canada = function(item) {if (item.Nation == "Canada") {return true;} else {return false;}};
	this.Indonesia = function(item) {if (item.Nation == "Indonesia") {return true;} else {return false;}};
	this.Italy = function(item) {if (item.Nation == "Italy") {return true;} else {return false;}};
	this.USA = function(item) {if (item.Nation == "USA") {return true;} else {return false;}};
	this.Austria = function(item) {if (item.Nation == "Austria") {return true;} else {return false;}};
	this.Netherlands = function(item) {if (item.Nation == "Netherlands") {return true;} else {return false;}};
	this.New_Zealand = function(item) {if (item.Nation == "New Zealand") {return true;} else {return false;}};

	if (this instanceof curveFilter) {
		return this;
	} else {
		return new curveFilter();
	}
}

function sortArrays(criterion, caller) {
	//stop animation and start over
	stopAnimation();

	//set the masterFilter, get a subset according to that 
	if (criterion === masterFilter || criterion === '') {
		criterion = "nofilter";
	}

	if (caller) {
		var groupNum = 1;
		for (var i = 0; i < filterNamesDict.length; i++) {
			if (filterNamesDict[i].indexOf(criterion) > -1) {
				groupNum = i;
				break;
			}
		}

		if (currentGroupNum !== groupNum) {
			if (currentGroupNum !== null) {
				var $pastGroupEl = $("#"+filterTypesDict[currentGroupNum]);
				$pastGroupEl.html($pastGroupEl.attr("data")).removeClass("currentGroup");
			}
			currentGroupNum = groupNum;
		}

		var contentNew = caller.html().toUpperCase();

		if (criterion != "nofilter") {
			$("#"+filterTypesDict[groupNum]).html(contentNew).addClass("currentGroup");
		}
	}

	masterFilter = criterion;

	var subset = getSubset(curves, criterion);

	updateLabels();

	distributionPath = makeDist(subset);

	labelController.setContent("left", "top").setContent("left", "bot").setContent("right", "top").pushContent().showTopLeft(true).showBotLeft(true).showTopRight(true);
	if (masterFilter == "nofilter") {
		labelController.showTopLeft(false).showBotLeft(false);
	}

	//sync the curves used of mouse interaction
	syncFlipped(curveDict, curveFilter()[masterFilter]);

	var readyCurves = convertCurves(subset);
	flipBeziers(readyCurves[1]);

	var topBMP = new createjs.Bitmap(paintNewCanvas(readyCurves[0]));
	var botBMP = new createjs.Bitmap(paintNewCanvas(readyCurves[1]));

	if (filterTop.getNumChildren() == 0 || filterBot.getNumChildren() == 0) {
		if (inDistView) {
			filterTop.addChild(topBMP);
			filterBot.addChild(botBMP);
			dotsContainer.visible = true;
			return;
		} else {
			filterTop.y = filterBot.y = h / 2;
			filterTop.scaleY = filterBot.scaleY = 0;
			changeChildren(topBMP, botBMP);
			return;	
		}
	}

	if (inDistView) {
		distView(true);
	}

	//prevent any existing transitions from continuing
	TweenMax.killTweensOf(filterTop);
	TweenMax.killTweensOf(filterBot);

	TweenMax.to(
		filterTop, 
		10, 
		{
			y: h / 2,
			scaleY: 0, 
			ease: Quad.easeIn,
			useFrames: true, 
			onComplete: changeChildren,
			onCompleteParams: [topBMP, botBMP]
		});

	TweenMax.to(
		filterBot, 
		10, 
		{
			y: h / 2, 
			scaleY: 0, 
			ease: Quad.easeIn,
			//ease: Linear.ease, 
			useFrames: true
		});

	function changeChildren(topChild, bottomChild) {
		filterTop.removeAllChildren();
		filterTop.addChild(topChild);
		filterBot.removeAllChildren();
		filterBot.addChild(bottomChild);
		dotsContainer.visible = true;

		TweenMax.to(filterTop, 30, {delay:1, y: 0, scaleY: 1, ease: Quint.easeOut, useFrames: true});
		TweenMax.to(filterBot, 30, {delay:1, y: 0, scaleY: 1, ease: Quint.easeOut, useFrames: true});
	}

}

//returns [[matches filter], [does not match filter]]
function getSubset(passCurves, filterCriterion) {
	var filterFunction = curveFilter()[filterCriterion];
	var set = [[], [], {filter: filterCriterion}];

	pctTop = 0; pctBot = 0; yearsCount = 0; peopleCount = 0;
	for (var i = 0, clen = passCurves.length; i < clen; i++) {
		if (filterFunction(passCurves[i])) {
			set[0].push(passCurves[i]);
			pctTop++;
		} else {
			set[1].push(passCurves[i]);
			pctBot++;
		}
			peopleCount++;
			yearsCount += Math.floor(passCurves[i].Altage) - Math.floor(passCurves[i].Age)>0 ? Math.floor(passCurves[i].Altage) - Math.floor(passCurves[i].Age) : 0;
	}

	return set;
}

/***********************************
PRERENDER ON OFFSCREEN CANVAS
***********************************/

//converts an array of filtered data into bezier curves
function convertCurves(passCurves) {
	var returnSet = [[], []];

	for (var j = 0; j < 2; j++) {
		var numCurves = passCurves[j].length;
		for (var i = 0; i < numCurves; i++) {
			var getBeziers = makeBezier(passCurves[j][i]);
			var temp_curve = {};
			temp_curve.b1 = getBeziers[0];
			temp_curve.b2 = getBeziers[1];
			returnSet[j][i] = temp_curve;
		}
	}
	return returnSet;
}

function paintNewCanvas(passBeziers) {
	var canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	var context = canvas.getContext("2d");

	var passBeziersLength = passBeziers.length;
	for (var i = 0; i < passBeziersLength; i++) {
		var bezier = [passBeziers[i].b1, passBeziers[i].b2];	
		context.lineWidth = life_strokeStyle;
		context.strokeStyle = life_strokeColor[Math.floor(Math.random()*(life_strokeColor.length-1))];
		context.beginPath();
		context.moveTo(bezier[0][0].x, bezier[0][0].y)
		context.bezierCurveTo(bezier[0][1].x, bezier[0][1].y, bezier[0][2].x, bezier[0][2].y, bezier[0][3].x, bezier[0][3].y);
		context.stroke();

		context.lineWidth = afterlife_strokeStyle;
		context.strokeStyle = afterlife_strokeColor[Math.floor(Math.random()*(afterlife_strokeColor.length-1))];
		context.beginPath();
		context.moveTo(bezier[1][0].x, bezier[1][0].y)
		context.bezierCurveTo(bezier[1][1].x, bezier[1][1].y, bezier[1][2].x, bezier[1][2].y, bezier[1][3].x, bezier[1][3].y);
		context.stroke();
	}

	return canvas;
}

function paintDots(curves) {
	var canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	var context = canvas.getContext("2d");
	
	var clen = curves.length;
	for (var i = 0; i < clen; i++) {
		context.fillStyle = curves[i].lifecolor;
		context.beginPath();
		context.arc(xscale(curves[i].Age), h / 2, 2.5, 0, 2 * Math.PI);
		context.fill();

		context.fillStyle = curves[i].afterlifecolor;
		context.beginPath();
		context.arc(xscale(curves[i].Altage), h / 2, 2.5, 0, 2 * Math.PI);
		context.fill();
	}
	return canvas;
}

/***********************************
DISTRIBUTION HISTOGRAM
***********************************/
function makeDist(subset) {
	//histValues[0] is the age histogram, histValues[1] is the altage histogram
	//within a histogram, [0] is the matches-filter histogram, and [1] is the does-not-match-filter histogram
	var histValues = [[[], []], [[], []]];
	for (var a = 0; a < 2; a++) {
		for (var b = 0; b < 2; b++) {
			for (var c = 0; c <= 103; c++) {
				histValues[a][b][c] = {
					filter: subset[2].filter,
					total: 0,
					value: 0};
			}
		}
	}

	for (var i = 0; i < 2; i++) {
		var dlen = subset[i].length;
		for (var j = 0; j < dlen; j++) {
			histValues[0][i][Math.floor(subset[i][j].Age)].total = dlen;
			console.log(histValues[0][i][Math.floor(subset[i][j].Age)].total);

			histValues[0][i][Math.floor(subset[i][j].Age)].value += 1;
			histValues[1][i][Math.floor(subset[i][j].Altage)].total = dlen;
			histValues[1][i][Math.floor(subset[i][j].Altage)].value += 1;
		}
	}

	var makePathwInfo = [[[], []], [[], []]];
	var histVal, prevHistVal, point, pathArray, histArray, clampPt;

	//for each histogram
	for (var i = 0; i < 2; i++) {
		//for each match / not-match
		for (var j = 0; j < 2; j++) {
			prevHistVal = -1;
			pathArray = makePathwInfo[i][j];
			histArray = histValues[i][j];

			//for each age
			for (var k = 0; k <= 100; k++) {
				histVal = histArray[k].value || 0;

				//set to zero if undefined
				pathArray.push({
					x: x(k),
					y: y(histVal),
					data: histArray[k]
				});
			}
		}
	}

	return makePathwInfo;

	function x(value) {
		return (value / 100) * arcSpaceWidth;
	}

	function y(value) {
		return (1 - (value / 100)) * (h / 2);
	}
}


function drawDist(clear) {
	if (clear) {
		histograms.removeAllChildren();
		return;
	}

	var left_top = new createjs.Shape();
	makeHist(left_top, distHistColors["leftTop"].slice(0, -5)+"0.20)", distributionPath[0][0], false);
	histograms.addChild(left_top);

	var left_bottom = new createjs.Shape();
	makeHist(left_bottom, distHistColors["leftBot"].slice(0, -5)+"0.20)", distributionPath[0][1], true);
	histograms.addChild(left_bottom);

	var right_top = new createjs.Shape();
	makeHist(right_top, distHistColors["rightTop"].slice(0, -5)+"0.20)", distributionPath[1][0], false);
	histograms.addChild(right_top);

	var right_bottom = new createjs.Shape();
	makeHist(right_bottom, distHistColors["rightBot"].slice(0, -5)+"0.20)", distributionPath[1][1], true);
	histograms.addChild(right_bottom);
}

function makeHist(shape, color, data, flip) {
	var i, l;
	shape.x = arcOffsetH / 2;
	var increment = arcSpaceWidth / 100;
	shape.graphics.beginStroke(color.slice(0, -5)+"0.8)").beginFill(color).moveTo(0, h / 2);

	//patch for messy rendering method causing visual overlap of data
	var origData = data;
	data = [];
	var threshold = h/2;
	var prevValY = -1;
	var prevValX = 0;
	var valY, valX, pt, clampPt;

	for(i=0, l=origData.length; i<l; ++i) {
		pt = origData[i];
		valY = pt.y || threshold;
		valX = pt.x;

		if((valY<threshold && prevValY===threshold) || (valY===threshold && prevValY<threshold)) {
			clampPt = {
				x: (prevValX + valX) * 0.5,
				y: threshold,
				data: pt.data
			}
			data.push(clampPt);

			//quick patch for messy way of rendering shapes
			data.push(clampPt);
			data.push(clampPt);		
		}

		data.push(pt);

		prevValY = valY;
		prevValX = valX;
	}
	// end patch

	for (i = 0, l=data.length; i < l; i++) {

		var y = data[i].y;
		try {
			var next_y = data[i+1].y;
		} catch (e) {
			var next_y = h / 2;
		}
		var anchor_2y = y + 0.5 * (next_y - y);
		var adjY = flip ? flipY(y) : y;
		var adjAnchorY = flip ? flipY(anchor_2y) : anchor_2y;

		var x = data[i].x;
		try {
			var next_x = data[i+1].x;
		} catch (e) {
			var next_x = arcSpaceWidth;
		}
		var x = x + 0.5 * (next_x - x);
		
		shape.graphics.quadraticCurveTo(x, adjY, next_x, adjAnchorY);

	}

	shape.graphics.closePath();
}

/***********************************
DISTRIBUTION VIEW
***********************************/

function distView(rerender, movement) {
	if (rerender) {
		for (var prop in distHistGroup) {
			if (distHistGroup.hasOwnProperty(prop)) {
				distHistGroup[prop].render();
			}
		}
		if (masterFilter == "nofilter") {
			labelController.showTopLeft(true).showBotLeft(false);
		}
	} else if (!inDistView) {
		inDistView = true;
		stopAnimation();

		//render distribution view
		distHistGroup = {
			leftTop: new DistHist(distHistColors["leftTop"], false, false),
			leftBot: new DistHist(distHistColors["leftBot"], true, false),
			rightTop: new DistHist(distHistColors["rightTop"], false, true),
			rightBot: new DistHist(distHistColors["rightBot"], true, true)
		};

		distStage.addChild(distHistGroup.leftTop.display);
		distStage.addChild(distHistGroup.leftBot.display);
		distStage.addChild(distHistGroup.rightTop.display);
		distStage.addChild(distHistGroup.rightBot.display);

		distAxis = makeAxis();
		distStage.addChild(distAxis);
		if (movement != "axismimic") {
			distAxis.alpha = 1;
		}

		labelController.setContent("left", "top", "test content").showTopLeft(true);
		console.log("left should be set");
		labelController.showTopLeft(true).showBotLeft(true).showTopRight(true);
		if (masterFilter == "nofilter") {
			labelController.showBotLeft(false);
		}
	}	else if (inDistView) {
		inDistView = false;
		//remove distribution view
		distStage.removeAllChildren();
		$(".tooltip").remove();
		labelController.showTopRight(false);
		if (masterFilter == "nofilter") {
			labelController.showTopLeft(false);
		}
	} 
}

function DistHist(color, bottom, right) {
	var api, mask, bg, highlight, container, tooltip,
	highlightColor = color.slice(0,-5)+"1)", 
	increment = arcSpaceWidth / 100;

	container = new createjs.Container();
	bg = new createjs.Shape();
	highlight = new createjs.Shape();
	mask = new createjs.Shape();
	//bg.graphics.beginFill(color).drawRect(0, bottom ? h / 2 : 0, w, h / 2)
	highlight.graphics
	.beginFill(highlightColor)
	.drawRect(0, bottom ? h / 2 - 10: 0, increment, h / 2 + 10);

	highlight.x = -100;

	container.addChild(bg, highlight);

	if (!bottom && !right) {
		//top tooltip
		tooltip = new DistTooltip(false, true, true, "bigTooltip");
	}	else if (bottom && !right && distributionPath[0][1][0].data.filter == "nofilter") {
		//bottom tooltip
		tooltip = new DistTooltip(false, false, false, "bigTooltip");
	} else if (bottom && !right) {
		//hide bottom tooltip
		tooltip = new DistTooltip(false, false, true, "bigTooltip");
	} else if (!bottom && right) {
		//middle tooltip
		tooltip = new DistTooltip(true, true, true, "smallTooltip");
	} else if (bottom && right) {
		tooltip = new DistTooltip(true, false, false, "hiddenTooltip");
	}

	renderMask();
	highlight.mask = mask;


	function renderMask() {
		mask.graphics.clear();
		bg.graphics.clear();
		var hor = right ? 1 : 0;
		var vert = bottom ? 1 : 0;
		var flip = bottom ? true : false;
		makeHist(bg, color, distributionPath[hor][vert], flip);
		makeHist(mask, "rgba(255,255,255,0)", distributionPath[hor][vert], flip);

		if (bottom && !right) {
			if (distributionPath[0][1][0].data.filter != "nofilter") {
				tooltip.visible = true;
				tooltip.show();
			} else {
				tooltip.visible = false;
				tooltip.hide();
			}
		} else if (bottom && right) {
			tooltip.hide();
		}
	}

	function moveRect(movement) {
		highlight.x = movement.rawX - increment / 2;
	}

	api = {
		display: container,
		render: renderMask,
		moveRect: moveRect,
		tooltip: tooltip,
		bottom: bottom,
		right: right
	};

	return api;
}

function DistTooltip(horizontal, mirror, isVisible, tooltipClass) {
	var api, itself, horizontal, mirror, copy, x, y;

	itself = new periscopic.ui.Tooltip()
	.horizontal(horizontal)
	.mirror(mirror)
	.copyClass(tooltipClass);
	if (!horizontal) {
		itself.setTipPosition(0);
	}
	itself.el().appendTo("#c");

	this.visible = isVisible;

	function updateCopy(copy) {
		itself.copy(copy);
		return api;
	}

	function updatePosition(x, y) {
		itself.x(x).y(y);
		if (!horizontal) {
			if (y < 100) {
				itself.mirror(!mirror);
			} else if (y > 100 && y < h - 100) {
				itself.mirror(mirror);
			} else if (y > h - 100) {
				itself.mirror(!mirror);
			}
		}
		itself.render()
		.position();
		return api;
	}

	function shrinkWidth(max, min) {
		itself.shrinkWidth(max, min);
		return api;
	}

	function show() {
		itself.el().fadeIn(200);//.show();
	}

	function hide() {
		itself.el().fadeOut(200);//.hide();
	}

	api = {
		itself: itself,
		updateCopy: updateCopy,
		updatePosition: updatePosition,
		shrinkWidth: shrinkWidth,
		show: show,
		hide: hide
	};

	return api;
}

function moveDistTooltip(movement) {
	var x, y1, y2, y3;

	x = Math.floor((movement.rawX - arcOffsetH / 2) / arcSpaceWidth * 100);
	x = x > 100 ? 100 : x;
	x = x < 0 ? 0 : x;

	x1 = movement.rawX < arcOffsetH / 2 ? arcOffsetH / 2 : movement.rawX > arcOffsetH / 2 + arcSpaceWidth ? arcOffsetH / 2 + arcSpaceWidth : movement.rawX;

	y1 = typeof distributionPath[0][0][x] != "undefined" ? Math.min(distributionPath[0][0][x].y, distributionPath[1][0][x].y) : h / 2;
	y2 = h / 2;
	y3 = typeof distributionPath[0][1][x] != "undefined" ? Math.max(flipY(distributionPath[0][1][x].y), flipY(distributionPath[1][1][x].y)) : h / 2;

	var text = getDistTipText(x);
	var rightOffset = x1 > arcOffsetH / 2 + arcSpaceWidth / 2 ? -10 : +10;
	var indexX = {leftTop: 0, leftBot: 0, rightTop: rightOffset, rightBot: 0};
	var indexY = {leftTop: y1, leftBot: y3, rightTop: y2, rightBot: 0};

	for (var prop in distHistGroup) {
		if (distHistGroup.hasOwnProperty(prop)) {

			if (distHistGroup[prop].bottom && !distHistGroup[prop].right) {
				if (distributionPath[0][1][0].data.filter != "nofilter") {
					distHistGroup[prop].tooltip.visible = true;
					distHistGroup[prop].tooltip.show();
				} else {
					distHistGroup[prop].tooltip.visible = false;
					distHistGroup[prop].tooltip.hide();
				}
			} else if (distHistGroup[prop].bottom && distHistGroup[prop].right) {
				distHistGroup[prop].tooltip.hide();
			} else {
				distHistGroup[prop].tooltip.show();
			}

			distHistGroup[prop].tooltip
			.updateCopy(text[prop])
			.shrinkWidth(250, 150);

			if (x1 > arcOffsetH / 2 + arcSpaceWidth / 2) {
				distHistGroup[prop].tooltip.itself.setTipPosition(1);
				if (distHistGroup[prop].right) {
					distHistGroup[prop].tooltip.itself.mirror(true);
				}
			} else {
				distHistGroup[prop].tooltip.itself.setTipPosition(0);
				if (distHistGroup[prop].right) {
					distHistGroup[prop].tooltip.itself.mirror(false);
				}
			}
			distHistGroup[prop].tooltip.updatePosition(x1 + indexX[prop], indexY[prop]);
		}
	}
}

function getDistTipText(x) {
	var bEm = "<span class='tEm'>";
	var eEm = "</span>";
	var bIt = "<span class='tIt'>";
	var eIt = "</span>";
	var groupNum;

	var numTop = formatComma(distributionPath[0][0][x].data.value);
	var altNumTop = formatComma(distributionPath[1][0][x].data.value);
	var numBot = formatComma(distributionPath[0][1][x].data.value);
	var altNumBot = formatComma(distributionPath[1][1][x].data.value);

	var filterType = distributionPath[0][0][x].data.filter;
	//create an array of groups of filter names
	for (var i = 0; i < filterNamesDict.length; i++) {
		if (filterNamesDict[i].indexOf(filterType) > -1) {
			groupNum = i;
			break;
		}
	}

	var demonym = x > 18 ? "people" : x > 1 ? "children" : "babies";

	if (groupNum == 0) {
		insert1 = filterDisplayNamesDict[filterType];
		insert2 = ".";
		insert3 = altFilterDict[filterType];
		insert4 = ".";
	} else if (groupNum == 1) {
		insert1 = demonym;
		insert2 = ".";
		insert3 = altFilterDict[filterType];
		insert4 = ".";
	} else if (groupNum == 2) {
		var ageNum = x > 18 ? 2 : x > 1 ? 1 : 0;
		insert1 = sexDemonymDict[filterType][ageNum];
		insert2 = ".";
		insert3 = altSexDemonymDict[filterType][ageNum];
		insert4 = ".";
	} else if (groupNum == 3) {
		insert1 = filterDisplayNamesDict[filterType];
		insert2 = ".";
		insert3 = altFilterDict[filterType];
		insert4 = ".";
	};
	// } else if (groupNum == 3) {
	// 	insert1 = filterDisplayNamesDict[filterType]+" "+demonym;
	// 	insert2 = ".";
	// 	insert3 = demonym+" of "+altFilterDict[filterType];
	// 	insert4 = ".";
	// } else if (groupNum >= 4) {
	// 	insert1 = "people";
	// 	insert2 = " "+filterDisplayNamesDict[filterType]+".";
	// 	insert3 = "people";
	// 	insert4 = " "+altFilterDict[filterType]+".";
	// }

	var onlyTop = distributionPath[1][0][x].data.value < distributionPath[0][0][x].data.value ? "Only " : "";
	var onlyBot = distributionPath[1][1][x].data.value < distributionPath[0][1][x].data.value ? "Only " : "";

	var topBoilerplate = [bEm,numTop," ",insert1,eEm," died",insert2,"<hr class='hoverRule'>",bIt,onlyTop,bEm,altNumTop,eEm," of ",formatComma(pctTop)," ",insert1," have the life expectancy of age ",x,".",eIt];
	var midBoilerplate = ["age ",x];
	var botBoilerplate = [bEm,numBot," ",insert3,eEm," died",insert4,"<hr class='hoverRule'>",bIt,onlyBot,bEm,altNumBot,eEm," of ",formatComma(pctBot)," ",insert3," have the life expectancy of age ",x,".",eIt];

	//a bunch of variables, each of which is determined by an if tree ()
	return {leftTop: topBoilerplate.join(""), leftBot: botBoilerplate.join(""), rightTop: midBoilerplate.join(""), rightBot: ""};
}

/***********************************
EXPOSE METHODS
***********************************/

var api = {
	init: init,
	sortArrays: sortArrays,
	drawDist: drawDist,
	distributionPath: distributionPath,
	overstage: overlay,
	curveDict: curveDict,
	stop: stopAnimation,
	testMouseDown: testMouseDown,
	testMouseMove: testMouseMove,
	delayMove: delayMove,
	histograms: histograms,
	bezierUtil: CubicBezierUtil,
	distView: distView
};

return api;
}());
