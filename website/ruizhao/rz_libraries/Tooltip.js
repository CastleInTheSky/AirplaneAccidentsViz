/**
 * Create, style, position Tooltips
 * @author Brett Johnson
 */

//-- export for RequireJS if present
//if(typeof define === 'function' && define.amd) {  
//  define(['$'], function($){return periscopic.ui.Tooltip;})
//}

/**
* Currently dependent on JQuery.
**/


/**
* @example: 
* 
* var Tooltip = periscopic.ui.Tooltip;
* 
* // Override defaults if needed
* Tooltip.DEFAULT_STROKE_THICKNESS = 2;
* Tooltip.DEFAULT_STROKE_COLOR = '#AAA';
* Tooltip.DEFAULT_RADIUS = 2;
* Tooltip.DEFAULT_BACKGROUND_COLOR = '#FFF';
* Tooltip.DEFAULT_TIP_WIDTH = 8;
* Tooltip.DEFAULT_COPY_CLASS = 'myTooltipCopy';
*
* // Create an instance
* var ttip = new periscopic.ui.Tooltip()
*
* .copy( '<h1>some html</h1') //set the HTML

* .horizontal(false) //tip of arrow is now up or down, instead of left or right (if mirrored)
* .mirror(true) //tip of arrow is now down, instead of up (default)
*
*   .x(50) //position of tip of tooltip relative to offset parent, otherwise at <0, 0>
* .y(50) 
*
* // OPTIONAL
* .shrinkWidth(maxTextWidth, minTextWidth) //shrink to size of text, must be done after 
*                      //copy & any custom copyClass set
*
* // OPTIONAL
* .setTipPositionByBounds(minX, maxX) //position tip along edge based on bounds in which 
*                   //you want container to be placed
*
* // OR hard code 
* .setTipPosition(1) //tip is on far right of container, not center (0.5) as was default
*
* .render()  //update to dom
* .position() //update position
*
* .el() //access the jqueryized version of the dom container
*   .appendTo($('#foo')) // do any jquery magic you want, such as placing
*              // in a different dom container
*
**/




var periscopic = periscopic || {};

periscopic.ui = periscopic.ui || {};

periscopic.ui.Tooltip = periscopic.ui.Tooltip || (function(){

var DIN = Math.sqrt(2);
//real undefined
var UNDEFINED = {}.u;

function Tooltip(){
  
 

 
  var
    html = "",
    horiz = true,
    mirror = false,
    copyClass = Tooltip.DEFAULT_COPY_CLASS,
    x = 0,
    y = 0,
    ox = 0,
    oy = 0,
    tx = 0,
    ty = 0,
  bgColor = Tooltip.DEFAULT_BACKGROUND_COLOR,
  bgImage = Tooltip.DEFAULT_BACKGROUND_IMAGE,
  strokeColor = Tooltip.DEFAULT_STROKE_COLOR,
  strokeWidth = Tooltip.DEFAULT_STROKE_THICKNESS,
    tipOnly = Tooltip.DEFAULT_TIP_ONLY,
    tipWd = Tooltip.DEFAULT_TIP_WIDTH,
    tipPos = 0.5,
    rad = Tooltip.DEFAULT_RADIUS,
    padT = 0,
    padR = 0,
    padB = 0,
    padL = 0,
    tip,
    bg,
  bgArrow,
  bgArrowStroke,
    copy;
    
  tip = $('<div></div>')
        .addClass('tooltip')
        .appendTo('body')
        .css({position:'absolute', overflow:'hidden'});
  
  bg = $('<div></div>')
    .css('position','absolute')
    .appendTo(tip);
    
   copy = $('<div></div>')
        .addClass(copyClass)
        .css({position:'absolute', top:'0px', left:'0px'})
        .appendTo(tip);
    
  bgArrowStroke = $('<div></div>')
    .css('position','absolute')
    .appendTo(tip);
    bgArrow = $('<div></div>')
    .css('position','absolute')
    .appendTo(tip);    
      


  var self = {
    
    radius : function( val ) {
    rad = val;
    return self;
    },
    
    x : function( xVal ) {
    x = xVal;
    return self;
    },
    
    y : function( yVal ) {
    y = yVal;
    return self;
    },
    
    
    horizontal : function( hz ) {
    horiz = hz;
    return self;
    },
    
    mirror: function( mr ) {
    mirror = mr;
    return self;
    },
    
    copy : function( html ) {
    copy.html(html);
    return self;
    },
    
    copyClass : function( cl ) {
      copy
        .removeClass(copyClass)
        .addClass(cl);
      copyClass = cl;        
      return self;
    },
  
  strokeColor : function(col) {
    strokeColor = col;
    return self;
  },

  strokeWidth : function(num) {
    strokeWidth = num;
    return self;
  },

  bgColor : function(bg) {
    bgColor = bg;
    return self;
  },
  
  bgImage : function(bg) {
    bgImage = bg;
    return self;
  },

  render : function() { 
    var props, disp;

    disp = tip.css('display');
    tip.show();
      
    var tipLen = tipWd; //not quite correct
    var sDin = Math.round(strokeWidth*DIN);
          
    var wd = copy.outerWidth(),
    ht = copy.outerHeight(),
    fWd = wd + (horiz ? tipLen + sDin: strokeWidth ) + strokeWidth, //full height and width including tip
    fHt = ht + (horiz ? strokeWidth : tipLen + sDin) + strokeWidth;
        
        //--Make sure copy doesn't expand after border is added
        copy.width(copy.width());


    //update coordinates of tip relative to top-left of div
    tx = padL + (horiz ? (mirror ? fWd : 0) : tipPos * (wd-2*(rad+tipWd))+rad+tipWd+strokeWidth);
    ty = padT + (!horiz ? (mirror ? fHt : 0) : tipPos * (ht-2*(rad+tipWd))+rad+tipWd+strokeWidth);
    //coordinates of textbox
    var ox = horiz && !mirror ? tipLen + sDin-strokeWidth : 0,
    oy = !horiz && !mirror ? tipLen + sDin-strokeWidth: 0;

    props = { left: ox+'px', top: oy+'px', width: wd, height: ht, borderRadius: rad+'px' };
    
    if(!tipOnly) {
      props.backgroundColor = bgColor;
      props.border = strokeWidth+'px solid '+strokeColor;

      if(bgImage ) {
        props.backgroundImage = 'url('+bgImage+')';
      }
    }


    bg.css(props);
       
   
    //-- Style the arrow
        var tx2 = tx + (horiz ? (mirror ? -(tipWd+sDin) : sDin - tipWd) : -tipWd);
        var ty2 = ty + (horiz ? -tipWd: (mirror ? -(tipWd+sDin) : sDin - tipWd));
        
    var borderProp = 'border'+(horiz ? ( mirror ? 'Left' : 'Right') : ( mirror ? 'Top' : 'Bottom'));
    props = { border: tipWd+'px solid transparent', left: tx2+'px', top: ty2+'px' };
    props[borderProp] = tipWd+'px solid '+bgColor;

    bgArrow.css(props);   

        var strokeWidthArrow = Math.round(strokeWidth*DIN);
        
        tx2 = tx2 + (horiz ? (mirror ? 0 : - 2*strokeWidthArrow) :  -strokeWidthArrow);
        ty2 = ty2 + (horiz ? -strokeWidthArrow : (mirror ? 0 : - 2*strokeWidthArrow));

    props = { border: (tipWd+strokeWidthArrow)+'px solid transparent', left: tx2+'px', top: ty2+'px' };
    props[borderProp] = (tipWd+strokeWidthArrow)+'px solid '+strokeColor;

    bgArrowStroke
      .css(props);  
      
       //-- Position copy
       copy.css({left:(ox+padL+strokeWidth)+'px', top:(oy+padT+strokeWidth)+'px'});
       
       //size & revert display
       tip.css({
         width: (fWd+padL+padR)+'px',
         height: (fHt+padT+padB)+'px',
         display: disp
         });
      
      return self;
    },
    
    /**
     * Adjust padding in pixels around contents
     **/
    padding : function(top, right, bottom, left) {
      if(right===UNDEFINED){
       right = bottom = left = top;
      }
      padT = top;
      padR = right;
      padB = bottom;
      padL = left;
      
      return self;
    },
    
    /**
     * Update the position
     **/
    position : function( snap ) {
     tip.css({
        left: ( snap ? Math.round(x-tx) : x-tx)+'px',
        top: ( snap ? Math.round(y-ty) : y-ty)+'px'
     });
     return self;
    },
    
    /**
     * Set tip position [0-1] along edge
     **/
    setTipPosition : function(pos) {
      tipPos = pos;
      return self;
    },
    
    /**
     * Set tip position by forcing body of tip
     * within bounds, or centering if not impeded on
     * by bounds.
     **/
    setTipPositionByBounds : function(min, max, defaultPosition, defaultPixels) {
      var disp = tip.css('display');
      if(disp === 'none'){
        tip.css('display', 'block');
      }
    var dim = horiz ? copy.outerHeight() : copy.outerWidth();
    if(defaultPixels && defaultPosition!==UNDEFINED){
    defaultPosition/=dim;
    }
    
      tipPos = getTipPositionByBounds(dim, tipWd, horiz ? y : x, min, max, defaultPosition);
      if(disp === 'none'){
        tip.css('display', disp);
      }
      return self;
    },

    /**
     * Get tip position [0-1] along edge
     **/
    getTipPosition : function() {
      return tipPos;
    },
    
    /**
     * Set tip width, default 6
     **/
    setTipWidth : function(width) {
      tipWd = width;
      return self;
    },
    
    /**
     * Get tip width
     **/
    getTipWidth : function() {
      return tipWd;
    },

    /**
     * Get the relative position of the tip to the div.
     **/
    tipOffset : function() {
      return { x:tx, y:ty };
    },
    
    
    /**
     * Get the JQueryized version of the container element
     **/
    el : function(){
      return tip;
    },
    
    shrinkWidth : function(maxWidth, minWidth, granularity, $el){
     var disp;
     $el = $el || copy;

     disp = tip.css('display');
      if(disp === 'none'){
        tip.css('display', 'block');
      }
      
      shrinkWidth($el, maxWidth, minWidth, granularity);

      if(disp === 'none'){
        tip.css('display', disp);
      }
      
      return self;
    }
  };
  
  return self;
};


var TT = Tooltip;
TT.DEFAULT_STROKE_THICKNESS = 0;//1;
TT.DEFAULT_STROKE_COLOR = '#CCC';
TT.DEFAULT_RADIUS = 0;
TT.DEFAULT_BACKGROUND_COLOR = UNDEFINED;//'#FFF';
TT.DEFAULT_BACKGROUND_IMAGE = UNDEFINED;
TT.DEFAULT_TIP_WIDTH = 6;
TT.DEFAULT_COPY_CLASS = 'tooltipCopy';
TT.DEFAULT_TIP_ONLY = false;


 function shrinkWidth(el, maxWidth, minWidth, granularity){
  
  granularity = granularity || 8;
    //test if we should use a max-width
    
  
  el.css({width:'', 'white-space':'nowrap'});
  
  var naturalWidth = el.width();
  
  if(naturalWidth<=maxWidth){
    return;
  }
  
  
  el.css({width:maxWidth, 'white-space':'normal'});
    el.width(maxWidth);
  
    var wd = maxWidth,    
    ht = el.height();
  
    do{     
     wd-=granularity;
     el.css('width',wd);
    }while(wd>minWidth && el.height()<=ht);
    //now back off
    wd+=granularity;
  
    el.css('width',wd); 
 }

 function getTipPositionByBounds(dimension, tipWd,  target, min, max, defaultPos){
  defaultPos = defaultPos == UNDEFINED ? 0.5 : defaultPos;
  
    var lwDim = dimension*defaultPos,
  upDim = dimension - lwDim,
    slackDim = dimension - tipWd*2;
    
    if(target-lwDim >= min){
      //inside lower bound      
      if(target+upDim <= max){
        //normal
        return defaultPos;    
      }else{
        //close to upper bound
        return (slackDim-(max-target)+tipWd)/slackDim;
      }
    }else{
      //close to lower bound
      return (target-min-tipWd)/slackDim;
    }
  }


return Tooltip;
}());
