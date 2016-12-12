var width = Math.max(1024, window.innerWidth),
    height = Math.max(500, window.innerHeight) - 40;

var POPULATION_MODE = 1;
var valueMode = 0;

var ORIGIN_MODE = 0;
var DESTIN_MODE = 1;
var typeMode = ORIGIN_MODE;

var playing = false;
var playTimer;

var stories, worldStories;
var storyTimer;
var storyCount;
var storyButtonSize = 15;


var topCountryCount = 3;

var nodes, links, stories;
var countryCodes, codeCountries;
var countryCentroids;
var originNodes, asylumNodes;
var originLinks, asylumLinks;
var originStories, asylumStories;

var countryNodes, countryLinks, worldNodes;
var filteredCountryNodes, filteredCountryLinks;

var pyear, year, yearDomain, yearRange;

var deadNumMax, deadNumMaxNum;

var nodeSizeScale;
var nodeSizeMax = 75;

var numberFormat = d3.format('0,000');

var selected = false;
var highlighted = false;

//var svg, projection, path, zoom;

var mapLayers, waterLayer, landLayer, nodesLayer, linksLayer;
var uiLayers, timelineLayer, brushLayer;

var frameYOffset, frameHeaderH, frameW, frameH;


var explored = false;

function load(error, mapData, countryCodeData, peopleNumData, populationData, storiesData) {
    projection = d3.geo.mercator()
        .scale(height / 4)
        .translate([width / 2, height / 1.6]);

    path = d3.geo.path()
        .projection(projection);

    zoom = d3.behavior.zoom()
        .translate([0, 0])
        .scale(1)
        .scaleExtent([1, 100])
        .on('zoom', function() {
            mapZoomed();
        });

    d3.select('#map')
        .attr('width', width)
        .attr('height', height);


    svg = d3.select('#map svg')
        .call(zoom);

    mapLayers = svg.append('g').attr('id', 'mapLayers');

    waterLayer = mapLayers.append('rect')
        .attr('id', 'water')
        .attr('width', width)
        .attr('height', height);

    mapcountries = topojson
        .feature(mapData, mapData.objects.countries);

    landLayer = mapLayers.append('g').attr('id', 'landLayer');


    landLayer.selectAll('.land')
        .data(mapcountries.features)
        .enter()
        .append('path')
        .attr('id', function(d) {
            return d.id;
        })
        .attr('class', 'land')
        .attr('d', path)
        .on('mouseover', mapMousedOver)
        .on('mouseout', mapMousedOut)
        .on('click', mapClicked)
        .on('touchstart', function() {
            mapClicked();
            d3.event.preventDefault();
        });

    updateCountryCentroids();

    countryCodes = d3.nest()
        .key(function(d) {
            return d.name;
        })
        .rollup(function(leaves) {
            return leaves[0].name;
        })
        .map(countryCodeData, d3.map);

    codeCountries = d3.nest()
        .key(function(d) {
            return d.code;
        })
        .rollup(function(leaves) {
            return leaves[0].name;
        })
        .map(countryCodeData, d3.map);

    originStories = d3.nest()
        .key(function(d) {
            return d.year;
        })
        .key(function(d) {
            return d.code;
        })
        .map(storiesData, d3.map);


    asylumStories = d3.map();

    stories = originStories;

    originLinks = d3.nest()
        .key(function(d) {
            return d.year;
        })
        .key(function(d) {
            return d.origin;
        })
        .key(function(d) {
            return d.destination;
        })
        .map(peopleNumData, d3.map);

    asylumLinks = d3.nest()
        .key(function(d) {
            return d.year;
        })
        .key(function(d) {
            return d.destination;
        })
        .key(function(d) {
            return d.origin;
        })
        .map(peopleNumData, d3.map);

    links = originLinks;

    originNodes = d3.nest()
        .key(function(d) {
            return d.year;
        })
        .key(function(d) {
            return d.origin;
        })
        .rollup(function(leaves) {
            var year = leaves[0].year;
            var code = leaves[0].origin;

            var peopleNumInAP = d3.sum(leaves, function(leaf) {
                return leaf.peopleNumInAP;
            });

            if (peopleNumInAP == 0)
                peopleNumInAP = null;


            var story = (stories.has(year) && stories.get(year).has(code)) ? stories.get(year).get(code)[0] : null;

            return {
                'year': year,
                'code': code,
                'peopleNumInAP': peopleNumInAP,
                'story': story
            };
        })
        .map(peopleNumData, d3.map);

    asylumNodes = d3.nest()
        .key(function(d) {
            return d.year;
        })
        .key(function(d) {
            return d.destination;
        })
        .rollup(function(leaves) {
            var year = leaves[0].year;
            var code = leaves[0].destination;

            var peopleNumInAP = d3.sum(leaves, function(leaf) {
                return leaf.peopleNumInAP;
            });

            if (peopleNumInAP == 0)
                peopleNumInAP = null;


            var story = (stories.has(year) && stories.get(year).has(code)) ? stories.get(year).get(code)[0] : null;

            return {
                'year': year,
                'code': code,
                'peopleNumInAP': peopleNumInAP,
                'story': null
            };
        })
        .map(peopleNumData, d3.map);

    nodes = originNodes

    asylumLinks.forEach(function(year, links) {
        links.forEach(function(code, link) {
            if (!nodes.get(year).has(code)) {
                var story = (stories.has(year) && stories.get(year).has(code)) ? stories.get(year).get(code)[0] : null;

                nodes.get(year).set(code, {
                    'year': year,
                    'code': code,
                    'peopleNumInAP': null,
                    'story': story
                });
            }
        });
    });

    stories.forEach(function(year, stories) {
        stories.forEach(function(code, story) {
            if (!nodes.get(year).has(code)) {

                nodes.get(year).set(code, {
                    'year': year,
                    'code': code,
                    'peopleNumInAP': null,
                    'story': story
                });
            }
        });
    });

    allNodes = [];

    nodes.values().forEach(function(yearNodes) {
        yearNodes.values().forEach(function(node) {
            allNodes.push(node);
        });
    });

    allNodeCodes = d3.nest()
        .key(function(d) {
            return d.code;
        })
        .map(allNodes, d3.map).keys();

    allLinks = peopleNumData;

    allStories = [];

    stories.values().forEach(function(storyNodes) {
        storyNodes.values().forEach(function(story) {
            allStories.push(story);
        });
    });

    deadNumMax = d3.max(allNodes, function(d) {
        return parseFloat(d.peopleNumInAP);
    });

    deadNumMaxNum = d3.max(allNodes, function(d) {
        if (parseFloat(d.peopleNumInAP) / parseFloat(d.population) == Infinity)
            return false;

        return parseFloat(d.peopleNumInAP) / parseFloat(d.population);
    });

    nodeSizeScale = d3.scale.sqrt()
        .domain([0, deadNumMax])
        .range([1, nodeSizeMax]);

    yearDomain = d3.extent(allNodes, function(d) {
        return d.year;
    });
    yearRange = d3.range(yearDomain[0], yearDomain[1] + 1);

    nodesLayer = mapLayers.append('g').attr('id', 'nodesLayers');
    linksLayer = mapLayers.append('g').attr('id', 'linksLayer');

    uiLayers = svg.append('g').attr('id', 'uiLayers');

    updateMapNavSize();
    setupTimeline();

    gotoYear(1968);
    showMap(1000);


    d3.select('#world-zoom-button')
        .on('click', function(d) {
            unselectMap();
            zoomToWorld();
        });


     d3.select('#play-button')
     .on('click', function() {
         togglePlay();

         ga('send', 'event', 'button', 'click', 'play button');
     });

     //updateToggleButtons()

}

function updateCountryCentroids() {
    countryCentroids = d3.map();

    landLayer.selectAll('path').each(function(d) {
        if (d.id === 'ZAF') {
            countryCentroids.set(d.id, path.centroid(d));
        } else {
            if (d.geometry == undefined) {
                // console.log(d);
            } else
                countryCentroids.set(d.id, path.centroid(getMaxFeature(d)));
        }
    });
}

function mapMousedOver(d) {
    highlightMap(d);
}

function mapMousedOut(d) {
    unhighlightMap(d);
}

function mapClicked(d) {
    if (selected === d) {
        unselectMap();
        zoomToWorld();
    } else {
        selectMap(d);
    }
}

function mapZoomed() {


    mapLayers.attr('transform',
        'translate(' + d3.event.translate + ')' + ' scale(' + d3.event.scale + ')');

    updateStrokeWeights();
    updateStoryButtonScale();
}

function zoomToCountry(country, duration) {
    if (!duration)
        duration = 750;

    var countryBBox = d3.select("#" + country.id + ".land").node().getBBox();
    var countryBounds = (country.id === 'RUS' || country.id === 'USA') ?
        path.bounds(getMaxFeature(country)) :
        countryBounds = path.bounds(country);


    var countryH = countryBBox.height; //countryBounds[1][1] - countryBounds[0][1];

    var b = countryBounds;

    if (filteredCountryNodes.has(country.id)) {
        var e = nodesLayer.select('#' + country.id);

        // var nodeValue = e.data()[0].peopleNumInAP
        var nodeValueMax = d3.max(allNodes.filter(function(d) {
            return d.code == country.id;
        }).map(function(d) {
            return (valueMode) ? d.refugeesPopulation : d.peopleNumInAP;
        }));

        var nodeR = nodeSizeScale(nodeValueMax) * 2;

        var nodeCX = e.attr('cx');
        var nodeCY = e.attr('cy');

        var nodeBBox = {
            'x': nodeCX - nodeR / 2,
            'y': nodeCY - nodeR / 2,
            'width': nodeR,
            'height': nodeR
        };
        var nodeBounds = [
            [nodeBBox.x, nodeBBox.y],
            [nodeBBox.x + nodeR, nodeBBox.y + nodeR]
        ];

        if (countryH < nodeR)
            b = nodeBounds;
    }


    var navbarH = 60;
    var zoomSize = (height - navbarH) * .75 - navbarH;
    var zoomX = hasStory(country.id, year) ? width * .75 : width * .5;
    var zoomY = (height + navbarH) * .5;

    var w = b[1][0] - b[0][0];
    var h = b[1][1] - b[0][1];
    var s = (w > h) ? zoomSize / w : zoomSize / h;
    var x = -(b[1][0] + b[0][0]) * .5 * s + zoomX;
    var y = -(b[1][1] + b[0][1]) * .5 * s + zoomY;

    mapLayers
        .transition()
        .duration(duration)
        .attr('transform', 'translate(' + x + ',' + y + ')scale(' + s + ')');

    zoom.scale(s);
    zoom.translate([x, y]);

    updateStrokeWeights();
    updateStoryButtonScale();

    hideMapTooltips();

}

function zoomToWorld(duration) {
    if (!duration)
        duration = 750;

    mapLayers
        .transition()
        .duration(duration)
        .attr('transform', '');

    zoom.scale(1);
    zoom.translate([0, 0]);

    updateStrokeWeights();
    updateStoryButtonScale();

    hideMapTooltips();

}

function updateStrokeWeights() {
    var s = zoom.scale();

    landLayer
        .selectAll('.land')
        .style('stroke-width', 1.5 / s + 'px');
    nodesLayer
        .selectAll('.node')
        .style('stroke-width', 1.5 / s + 'px');
    linksLayer
        .selectAll('line.link')
        .style('stroke-width', 1.5 / s + 'px');
    linksLayer
        .selectAll('line.link-hitarea')
        .style('stroke-width', 9 / s + 'px');
}

function setupPlay() {
    playSize = frameW * 3;

    d3.select('#play-button')
        .style('width', Math.round(frameW * 3) + 'px')
        .on('mouseover', function(d) {
            d3.select('#play-button a').style('background-position', '0px -' + Math.round(playSize) + 'px');
        })
        .on('mouseout', function(d) {
            d3.select('#play-button a').style('background-position', '0px 0px');
        });

    d3.select('#play-button a')
        .style('top', frameH / 2 - playSize / 2 + 'px')
        .style('left', frameW * 3 / 2 - playSize / 2 + 'px')
        .style('width', playSize + 'px')
        .style('height', playSize + 'px')
        .style('background-size', playSize + 'px');
}

function setupTimeline() {
    frameHeaderH = 10;
    frameW = width / (yearRange.length + 20.6);
    frameH = 30 + frameHeaderH;
    // frameYOffset = ($.browser.mozilla) ? 50 : 0
    frameYOffset = 0;

    setupPlay();

    timelineLayer =
        d3.select('#map-timeline svg');

    var frame = timelineLayer.selectAll('g.frame')
        .data(yearRange)
        .enter()
        .append('g')
        .attr('id', function(d) {
            return 'frame-' + d;
        })
        .attr('class', 'frame')
        .on('click', function(d) {
            gotoAndStop(d);
        });

    frame
        .append('rect')
        .attr('id', function(d) {
            return 'frame-' + d;
        })
        .attr('class', 'frame-background')
        .attr('x', function(d, i) {
            return frameW * (i) + frameW * 3;
        })
        .attr('y', 0)
        .attr('width', frameW)
        .attr('height', frameH);

    frame
        .append('text')
        .attr('id', function(d) {
            return 'frame-' + d;
        })
        .attr('class', 'frame-year')
        .text(function(d) {
            return d;
        })
        .attr('x', function(d, i) {
            return frameW * (i) + frameW * 3 + frameW / 2;
        })
        .attr('y', frameH / 2 + frameHeaderH);

    frame
        .append('rect')
        .attr('id', function(d) {
            return 'frame-' + d;
        })
        .attr('class', 'frame-peopleNumInAP')
        .attr('x', function(d, i) {
            return frameW * (i) + frameW * 3;
        })
        .attr('y', 0)
        .attr('width', frameW)
        .attr('height', frameHeaderH);
}

function updateTimeline() {
    var allNodes = [];

    nodes.values().forEach(function(yearNodes) {
        yearNodes.values().forEach(function(node) {
            allNodes.push(node);
        });
    });

    var nodesData = d3.nest()
        .key(function(d) {
            return d.year;
        })
        .rollup(function(leaves) {
            if (valueMode) {
                var peopleNumInAP = d3.sum(leaves, function(d) {
                    return d.peopleNumInAP;
                });
                var population = d3.sum(leaves, function(d) {
                    return d.population;
                });
                var refugeesPopulation = (peopleNumInAP && population) ? peopleNumInAP / population : 0;

                return {
                    'refugeesPopulation': refugeesPopulation
                };
            } else {
                var peopleNumInAP = d3.sum(leaves, function(d) {
                    return d.peopleNumInAP;
                });

                return {
                    'peopleNumInAP': peopleNumInAP
                };
            }
        })
        .map(allNodes
            .filter(function(d) {
                if (highlighted || selected)
                    return d.code === ((highlighted) ? highlighted : selected).id;
                else
                    return true;
            }), d3.map);

    var domain = (valueMode) ? d3.extent(nodesData.values(), function(d) {
        return d.refugeesPopulation;
    }) : d3.extent(nodesData.values(), function(d) {
        return d.peopleNumInAP;
    });

    var refugeesScale = d3.scale.linear()
        .domain(domain)
        .range((typeMode) ? ['#00363b', '#00d7ed'] : ['#3c0d15', '#f13452']);

    timelineLayer.selectAll('.frame')
        .classed('story', function(d) {
            if (selected || highlighted) {
                var country = (selected) ? selected : highlighted;
                return hasStory(country.id, d);
            } else
                return hasStory('WLD', d);
        })
        .each(function(d) {
            var storyid = (highlighted || selected) ? ((highlighted) ? highlighted : selected).id : 'WLD';
            var title = 'N/A';

            if (nodesData.has(d)) {
                var nodeData = nodesData.get(d);

                var value = (valueMode) ? decimalFormat(nodeData.refugeesPopulation) : numberFormat(nodeData.peopleNumInAP)

                var valueLabel;

                valueLabel = (valueMode) ? (' persons were world peopleNumInAP') : ' total death'

                if (selected) {
                    var name = codeCountries.get(selected.id);

                    if (typeMode)
                        valueLabel = (valueMode) ? (' persons reside in ' + name) : ' peopleNumInAP reside in ' + name;
                    else
                        valueLabel = (valueMode) ? (' persons from ' + name + ' left') : ' death from ' + name;
                }

                title = '<span class="tooltip-value">' + value + '</span>\n' + valueLabel + ' in ' + d;
            }

            var id = '#frame-' + d + '.frame';

            $(id)
                .tooltip('destroy')
                .tooltip({
                    title: title,
                    html: true,
                    placement: 'top',
                    container: 'body',
                    animation: true
                })
                .mouseover(updateMapTooltipColor)
        });

    timelineLayer.selectAll('.frame-peopleNumInAP')
        .transition()
        .duration(500)
        .style('fill', function(d) {
            if (nodesData.has(d)) {
                var value = (valueMode) ? nodesData.get(d).refugeesPopulation : nodesData.get(d).peopleNumInAP;

                if (value > 0)
                    return refugeesScale(value);
                else
                    return '#000000';
            } else
                return '#000000';
        });

    var frame = timelineLayer.selectAll('.frame')
        .data([year], function(d) {
            return d;
        });

    frame.classed('selected', true);

    frame.exit().classed('selected', false);
}

function updateTimelineSizeAndPosition() {
    frameW = width / (yearRange.length + 1);

    setupPlay();

    timelineLayer.selectAll('.frame-background')
        .data(yearRange, function(d) {
            return d;
        })
        .attr('x', function(d, i) {
            return frameW * (i + 1);
        })
        .attr('width', frameW);

    timelineLayer.selectAll('.frame-peopleNumInAP')
        .data(yearRange, function(d) {
            return d;
        })
        .attr('x', function(d, i) {
            return frameW * (i + 1);
        })
        .attr('width', frameW);

    timelineLayer.selectAll('.frame-year')
        .data(yearRange, function(d) {
            return d;
        })
        .text(function(d) {
            return d;
        })
        .attr('x', function(d, i) {
            return frameW * (i + 1) + frameW / 2;
        });
}


function updateMap() {
    landLayer.selectAll('.land:not(#' + ((selected) ? selected : highlighted).id + ')')
        .attr('style', '')
        .classed('visible', function(d) {
            if (typeMode == ORIGIN_MODE)
                return originLinks.get(year).has(d.id) || asylumLinks.get(year).has(d.id) || (stories.has(year) && stories.get(year).has(d.id));
            else
                return asylumLinks.get(year).has(d.id) || originLinks.get(year).has(d.id);
        })
        .classed('enabled', function(d) {
            if (typeMode == ORIGIN_MODE)
                return originLinks.get(year).has(d.id) || (stories.has(year) && stories.get(year).has(d.id));
            else
                return asylumLinks.get(year).has(d.id)
        })
        .classed('story', function(d) {
            if (typeMode == ORIGIN_MODE)
                return (stories.has(year) && stories.get(year).has(d.id));
            else
                return false
        });
}

function updateMapTooltips() {
    filteredCountryNodes.forEach(function(code, nodeData) {
        var name = codeCountries.get(code);
        var title = name;

        if (nodeData.peopleNumInAP > 0) {
            var value = (valueMode) ? decimalFormat(nodeData.refugeesPopulation) : numberFormat(nodeData.peopleNumInAP);

            var valueLabel;

            if (typeMode)
                valueLabel = (valueMode) ? (' persons in ' + name) : 'peopleNumInAP reside in ' + name;
            else
                valueLabel = (valueMode) ? (' persons left ' + name) : 'in airplanes from ' + name;

            var originCount = nodeRankScale.domain().length;
            var worldRank = orderFormat(nodeRankScale((valueMode) ? nodeData.refugeesPopulation : nodeData.peopleNumInAP));


            title = '<span class="tooltip-value">' + value + ' people died' + '</span>\n' + valueLabel + '\n(' + worldRank + ' of ' + originCount + ((typeMode) ? ' asylums)' : ' origins)');
        }

        $('#' + code + '.node')
            .tooltip('destroy')
            .tooltip({
                title: title,
                html: true,
                placement: 'top',
                container: 'body',
                animation: true
            });
    });

    if (highlighted)
        setTimeout(function() {
            $('#' + highlighted.id + '.node').tooltip('show');
            updateMapTooltipColor();
        }, 10);
}

function updateMapTooltipColor() {
    var color = (typeMode) ? '#00d7ed' : '#f13452';

    $('.tooltip-inner').css('background-color', color)
    $('.tooltip.top .tooltip-arrow').css('border-top-color', color);
    $('.tooltip.right .tooltip-arrow').css('border-right-color', color);
    $('.tooltip.left .tooltip-arrow').css('border-left-color', color);
    $('.tooltip.bottom .tooltip-arrow').css('border-bottom-color', color);
}

function hideMapTooltips() {
    d3.selectAll('.node').each(function(d) {
        $('#' + d.code + '.node').tooltip('hide');
    });
}


function updateMapNavSize() {
    var padding = 50;
    var navwidth = width * .3 + padding / 2;
    var col1minwidth = 512 * .6 - padding / 2;
    var col2minwidth = 512 * .5 - padding / 2;
    var col1width = (navwidth * .5 - padding);
    var col2width = (navwidth * .5 - padding);

    var mapNavBody = d3.select('#map-nav-body');
    var storyBody = d3.select('#story-body');

    var scrollBarW = 0; //17

    d3.select('#map-nav-background')
        .style('width', navwidth + 'px')
        .style('height', height - 1025 + 'px');

    d3.select('#map-nav-head').style('width', (navwidth - padding) + 'px');

    d3.select('#map-nav-body')
        .style('width', (storyBody.empty()) ? 'auto' : (navwidth - padding) + 'px')
        .style('height', (height - 1025 - padding) + 'px');

    d3.select('#stats').style('width', Math.max(col1minwidth, col1width) + 'px');

    if (!storyBody.empty()) {
        d3.select('#story-body-border').style('height', (height - 225) + 'px');
        d3.select('#story-body').style('width', Math.max(col2minwidth, col2width) + 'px');
    }
}

function updateData() {
    countryNodes = nodes.get(year);

    filteredCountryNodes = d3.map(countryNodes);

    filteredCountryNodes.forEach(function(key, value) {
        if (!countryCentroids.get(key))
            this.remove(key);
    });

    nodeRankScale = d3.scale.ordinal()
        .domain(filteredCountryNodes.values().map(function(d) {
            return (valueMode) ? d.refugeesPopulation : d.peopleNumInAP;
        })
            .sort(d3.descending))
        .range(d3.range(1, filteredCountryNodes.values().length + 1));

    nodeSizeScale.domain([0, (valueMode) ? deadNumMaxNum : deadNumMax]);

    worldNodes = d3.nest()
        .rollup(function(leaves) {
            var peopleNumInAP = d3.sum(leaves, function(d) {
                return d.peopleNumInAP;
            });
            return {
                'peopleNumInAP': d3.round(peopleNumInAP),
            };
        })
        .map(countryNodes.values());

    countryLinks = links.get(year);

    filteredCountryLinks = d3.map(countryLinks);

    filteredCountryLinks.forEach(function(key, value) {
        if (!countryCentroids.get(key))
            this.remove(key);
    });

    filteredWorldLinks = [];

    filteredCountryLinks.values().forEach(function(linkMap) {
        linkMap.values().forEach(function(link) {
            filteredWorldLinks.push(link[0]);
        });
    });

    linkWorldRankScale = d3.scale.ordinal()
        .domain(filteredWorldLinks.map(function(d) {
            return d.peopleNumInAP;
        })
            .sort(d3.descending))
        .range(d3.range(1, filteredWorldLinks.length + 1));

    //worldStories = stories.get(year).values();
}

function updateNodes() {
    var nodeCircle = nodesLayer.selectAll('.node.visible')
        .data(filteredCountryNodes.values(), function(d, i) {
            return d.code;
        });

    nodeCircle
        .each(function(d) {
            var e = d3.select(this);
            updateNodeSize(e);
        });

    nodeCircle
        .enter()
        .append('circle')
        .call(setupNode)
        .each(function(d) {
            var e = d3.select(this);
            updateNodeSize(e);
        });

    nodeCircle.exit().remove();

    visibleMapData = [];

    landLayer.selectAll('.land.visible:not(.enabled)')
        .each(function(d, i) {
            visibleMapData.push({
                'code': d.id
            });
        });

    nodesLayer.selectAll('.node:not(.visible)').remove();

    for (var i in visibleMapData) {
        nodesLayer
            .append('circle')
            .datum(visibleMapData[i])
            .attr('id', function(d) {
                return d.code;
            })
            .attr('class', 'node invisible')
            .attr('cx', function(d) {
                return countryCentroids.get(d.code)[0];
            })
            .attr('cy', function(d) {
                return countryCentroids.get(d.code)[1];
            })
            .attr('r', 1);
    }

    updateNodeStrokes();

    if (selected)
        zoomToCountry(selected);
}

function updateNodeStrokes() {
    if (highlighted || selected) {
        if (highlighted && selected) {
            nodesLayer.selectAll('.node.visible:not(#' + highlighted.id + '):not(#' + selected.id + ')')
                .classed('enabled', false);

            if (d3.select('#' + highlighted.id).classed('enabled'))
                nodesLayer.select('#' + highlighted.id).classed('enabled', true);
            if (d3.select('#' + selected.id).classed('enabled'))
                nodesLayer.select('#' + selected.id).classed('enabled', true);
        } else if (highlighted) {
            nodesLayer.selectAll('.node.visible:not(#' + highlighted.id + ')')
                .classed('enabled', false);

            if (d3.select('#' + highlighted.id).classed('enabled'))
                nodesLayer.select('#' + highlighted.id).classed('enabled', true);
        } else if (selected) {
            nodesLayer.selectAll('.node.visible:not(#' + selected.id + ')')
                .classed('enabled', false);

            if (d3.select('#' + selected.id).classed('enabled'))
                nodesLayer.select('#' + selected.id).classed('enabled', true);
        }
    } else
        nodesLayer.selectAll('.node.visible').classed('enabled', true);
}

function setupNode(e) {
    e.attr('id', function(d) {
        return d.code;
    })
        .attr('class', 'node visible' + ((typeMode) ? ' asylum' : ''))
        .attr('cx', function(d) {
            return countryCentroids.get(d.code)[0];
        })
        .attr('cy', function(d) {
            return countryCentroids.get(d.code)[1];
        })
        .attr('r', 0);
}

function updateNodeSize(e) {
    var duration = 750;

    var d = e.datum();
    var r = nodeSizeScale((valueMode) ? d.refugeesPopulation : d.peopleNumInAP);

    e
        .classed('invisible', (r == 1))
        .transition()
        .duration(duration)
        .attr('r', r);

    // if (d.code == selected.id || d.code == highlighted.id)
    //     updateNodeLinkSizes(r)
}

function updateNodePositions() {
    nodesLayer.selectAll('.node')
        .attr('cx', function(d) {
            return countryCentroids.get(d.code)[0];
        })
        .attr('cy', function(d) {
            return countryCentroids.get(d.code)[1];
        });
}

function updateNodeLinkSizes(r, duration) {
    if (!duration)
        duration = 750;

    linksLayer.selectAll('.link')
        .filter(function(d) {
            return (d[0].origin == selected.id);
        })
        .each(function(d) {
            var e = d3.select(this).select('line.link');

            if (e.node()) {
                var p1 = countryCentroids.get(d[0].origin);
                var p2 = countryCentroids.get(d[0].destination);

                var a = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);

                var ox = Math.cos(a) * r;
                var oy = Math.sin(a) * r;

                e
                    .transition()
                    .duration(duration)
                    .attr('x1', p1[0] + ox)
                    .attr('y1', p1[1] + oy)
                    .attr('x2', p2[0])
                    .attr('y2', p2[1]);
            }
        });
}

function selectMap(country) {
    if (playing)
        stop();

    if (selected === country)
        return false;

    if (selected) {
        landLayer.select('#' + selected.id)
            .classed('selected', selected = false);
    }

    landLayer.select('#' + country.id)
        .classed('highlighted', highlighted = false)
        .classed('selected', selected = country);

    mapLayers.select('#' + selected.id + '.story-button')
        .transition()
        .duration(750)
        .style('opacity', 1);

    updateNodeStrokes();

    updateLinks();
    updateStats();
    updateStoryHead();
    updateStoryBody();
    updateURL();

    zoomToCountry(country);
    hideMapTooltips();
}

function unselectMap() {
    if (!selected)
        return false;

    landLayer.select('#' + selected.id)
        .classed('selected', selected = false);

    updateNodeStrokes();

    updateLinks();
    updateStats();
    updateStoryHead();
    updateStoryBody();
    updateURL();
}

function highlightMap(country) {
    if (highlighted === country)
        return false;

    landLayer.select('#' + country.id)
        .classed('highlighted', highlighted = country);

    mapLayers.select('#' + country.id + '.story-button')
        .transition()
        .duration(750)
        .style('opacity', 1);

    mapLayers.selectAll('.story-button:not(#' + country.id + '):not(#' + selected.id + ')')
        .transition()
        .duration(750)
        .style('opacity', .25);

    updateNodeStrokes();

    if (!selected) {
        updateLinks();
        updateStats();
        updateStoryHead();
    }

    $('#' + country.id + '.node').tooltip('show');

    updateMapTooltipColor();
}

function unhighlightMap(country) {
    landLayer.select('#' + country.id)
        .classed('highlighted', highlighted = false);

    mapLayers.selectAll('.story-button:not(#' + selected.id + ')')
        .transition()
        .duration(750)
        .style('opacity', 1);

    updateNodeStrokes();

    if (!selected) {
        updateLinks();
        updateStats();
        updateStoryHead();
    }

    $('#' + country.id + '.node').tooltip('hide');
}


function setupLink(d) {
    var e = d3.select(this);

    e
        .attr('id', function(d) {
            if (typeMode)
                return d[0].destination + '-' + d[0].origin;
            else
                return d[0].origin + '-' + d[0].destination;
        })
        .attr('class', 'link')
        .style('pointer-events', function(d) {
            return (selected) ? 'auto' : 'none';
        })
        .on('mouseover', linkMousedOver)
        .on('mouseout', linkMousedOut)
        .call(setupLinkLineAndStroke);
}

function setupLinkLineAndStroke(e) {
    var d = e.datum();

    var p1 = countryCentroids.get(d[0].origin);
    var p2 = countryCentroids.get(d[0].destination);

    if (p1 && p2) {
        var r = nodesLayer.select('#' + ((typeMode) ? d[0].destination : d[0].origin)).attr('r');
        var a = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);

        var ox = Math.cos(a) * r;
        var oy = Math.sin(a) * r;

        var linksData = [];

        if (selected)
            linksData = filteredCountryLinks.get(selected.id).values();
        else if (highlighted)
            linksData = filteredCountryLinks.get(highlighted.id).values();

        var opacity = 1;

        if (linksData.length > 1)
            opacity = linkOpacityScale(d[0].peopleNumInAP);

        e
            .append('line')
            .attr('class', 'link')
            .style('stroke', function(d) {
                var sx = p2[0] - p1[0];

                if (typeMode)
                    return (sx > 0) ? 'url(#asylumLinkStroke1)' : 'url(#asylumLinkStroke2)';
                else
                    return (sx > 0) ? 'url(#originLinkStroke1)' : 'url(#originLinkStroke2)';
            })
            .style('stroke-width', 1.5 / zoom.scale() + 'px')
            .style('stroke-opacity', opacity)
            .call(function(d) {
                if (typeMode)
                    this.attr('x1', p1[0])
                        .attr('y1', p1[1])
                        .attr('x2', p2[0] + ox)
                        .attr('y2', p2[1] + oy);
                else
                    this.attr('x1', p1[0] + ox)
                        .attr('y1', p1[1] + oy)
                        .attr('x2', p2[0])
                        .attr('y2', p2[1]);
            })
        // .attr('x1', p1[0] + ox)
        // .attr('y1', p1[1] + oy)
        // .attr('x2', p2[0])
        // .attr('y2', p2[1]);

        e
            .append('line')
            .attr('class', 'link-hitarea')
            .style('stroke-width', 9 / zoom.scale() + 'px')
            .attr('x1', p1[0] + ox)
            .attr('y1', p1[1] + oy)
            .attr('x2', p2[0])
            .attr('y2', p2[1]);
    }
}

function updateLinks() {
    var linksData = [];

    if (selected && filteredCountryLinks.has(selected.id))
        linksData = filteredCountryLinks.get(selected.id).values();
    else if (highlighted && filteredCountryLinks.has(highlighted.id))
        linksData = filteredCountryLinks.get(highlighted.id).values();

    linkCountryRankScale = d3.scale.ordinal()
        .domain(linksData.map(function(d) {
            return d[0].peopleNumInAP;
        })
            .sort(d3.descending))
        .range(d3.range(1, linksData.length + 1));

    linkOpacityScale = d3.scale.sqrt()
        .domain(d3.extent(linksData, function(d) {
            return d[0].peopleNumInAP;
        }))
        .range([.2, 1]);

    var link = linksLayer.selectAll('g.link')
        .data(linksData, function(d) {
            if (typeMode)
                return d[0].destination + '-' + d[0].origin;
            else
                return d[0].origin + '-' + d[0].destination;
        });

    link
        .style('pointer-events', function(d) {
            return (selected) ? 'auto' : 'none';
        })
        .each(updateLinkPositionAndOpacity);

    link
        .enter()
        .append('g')
        .each(setupLink)
        .each(animateInLink);

    link
        .exit()
        .remove();
}

function updateLinkPositionAndOpacity(e) {
    var duration = 750;

    var e = d3.select(this).select('line.link');
    var d = d3.select(this).datum();

    if (e.node()) {
        var nodeData = nodesLayer.select('#' + ((typeMode) ? d[0].destination : d[0].origin)).datum();
        var linksData = [];

        if (selected)
            linksData = filteredCountryLinks.get(selected.id).values();
        else if (highlighted)
            linksData = filteredCountryLinks.get(highlighted.id).values();

        var opacity = 1;

        if (linksData.length > 1)
            opacity = linkOpacityScale(d[0].peopleNumInAP);

        var p1 = countryCentroids.get(d[0].origin);
        var p2 = countryCentroids.get(d[0].destination);

        var r = nodeSizeScale((valueMode) ? nodeData.refugeesPopulation : nodeData.peopleNumInAP);
        var a = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);

        var ox = Math.cos(a) * r;
        var oy = Math.sin(a) * r;


        if (typeMode)
            e
                .transition()
                .duration(750)
                .attr('x2', p2[0] - ox)
                .attr('y2', p2[1] - oy)
                .style('stroke-opacity', opacity);
        else
            e
                .transition()
                .duration(duration)
                .attr('x1', p1[0] + ox)
                .attr('y1', p1[1] + oy)
                .style('stroke-opacity', opacity);
    }
}

function showLinks() {
    linksLayer.selectAll('.link').style('stroke-opacity', 1);
}

function hideLinks() {
    linksLayer.selectAll('.link').style('stroke-opacity', 0);
}

function animateInLink() {
    var e = d3.select(this).select('line.link');

    if (e.node()) {
        var duration = 750;

        var d = e.datum();

        var nodeData = nodesLayer.select('#' + ((typeMode) ? d[0].destination : d[0].origin)).datum();

        var p1 = countryCentroids.get(d[0].origin);
        var p2 = countryCentroids.get(d[0].destination);

        var r = nodeSizeScale((valueMode) ? nodeData.refugeesPopulation : nodeData.peopleNumInAP);
        var a = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);

        var ox = Math.cos(a) * r;
        var oy = Math.sin(a) * r;

        if (typeMode)
            e
                .attr('x2', p1[0])
                .attr('y2', p1[1])
                .transition()
                .duration(750)
                .attr('x1', p1[0])
                .attr('y1', p1[1])
                .attr('x2', p2[0] - ox)
                .attr('y2', p2[1] - oy);
        else
            e
                .attr('x2', p1[0] + ox)
                .attr('y2', p1[1] + oy)
                .transition()
                .duration(750)
                .attr('x1', p1[0] + ox)
                .attr('y1', p1[1] + oy)
                .attr('x2', p2[0])
                .attr('y2', p2[1]);
    }
}

function linkMousedOver(d) {
    var country = codeCountries.get((typeMode) ? d[0].origin : d[0].destination);
    var oricountry = codeCountries.get(d[0].origin);
    var type = ((typeMode) ? 'origin' : 'asylum');
    var direction = (typeMode) ? 'came from ' : 'went to ';

    var countryCount = linkCountryRankScale.domain().length;

    var countryRank = orderFormat(linkCountryRankScale(d[0].peopleNumInAP));
    var worldRank = linkWorldRankScale(d[0].peopleNumInAP);

    var peopleNumInAP = numberFormat(d[0].peopleNumInAP);

    var title = '<span class="tooltip-value">' + peopleNumInAP + ' people died' + '</span>\n flied from ' + oricountry + ' to ' + country;
    // + '.\n(' + countryRank + ' of ' + countryCount + ' ' + type + 's)'

    //console.log(title);

    d3.select('#map-page')
        .append('div')
        .classed('mouse-tooltip', true)
        .style('left', (d3.event.clientX - 105) + 'px')
        .style('top', (d3.event.clientY - 85) + 'px');

    //console.log(d3.event.clientX);

    //console.log("fdsjkfldjgiodfjgifdjgiofdjgi");

    $('.mouse-tooltip')
        .tooltip('destroy')
        .tooltip({
            title: title,
            html: true,
            template: '<div class="tooltip link-' + type + '"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
            placement: 'top',
            container: 'body',
            animation: true
        })
        .tooltip('show');
    //console.log("hahahahahahahah");


}


function linkMousedOut(d) {
    $('.mouse-tooltip').tooltip('destroy').remove();
}

function updateStats() {
    d3.select('#year').text(year);

    if (selected || highlighted) {
        var type = ((typeMode) ? 'FLY FROM:' : 'ASYLUM');

        var country = (selected) ? selected : highlighted;
        var nodeData = nodes.get(year).get(country.id);

        var peopleNumInAP = (nodeData && nodeData.peopleNumInAP) ? numberFormat(nodeData.peopleNumInAP) : 'N/A';
        var population = (nodeData && nodeData.population) ? numberFormat(nodeData.population) : 'N/A';
        var refugeesPopulation = (nodeData && nodeData.refugeesPopulation) ? decimalFormat(nodeData.refugeesPopulation) : 'N/A';

        var linksData = [];

        if (links.get(year).has(country.id)) {
            linksData = links.get(year).get(country.id).values();
            linksData.map(function(d) {
                d[0].refugeesPopulation = d[0].peopleNumInAP / nodeData.population;
                return d;
            });
        }

        var countries = linksData.length;

        linksData.forEach(function(value, i) {
            if (!countryCentroids.get(value[0].origin) || !countryCentroids.get(value[0].destination))
                linksData.splice(i, 1);
        });

        linksData = linksData
            .sort(function(a, b) {
                if (valueMode) {
                    return b[0].refugeesPopulation - a[0].refugeesPopulation;
                } else
                    return b[0].peopleNumInAP - a[0].peopleNumInAP;
            }).slice(0, topCountryCount);

        d3.select('#peopleNumInAP-mode').html(((typeMode) ? 'RESIDING IN<br/> ' : 'Total Death in airplanes take off from<br/><br/> ') + codeCountries.get(country.id));
        d3.select('#region').text(codeCountries.get(country.id));
        d3.select('#peopleNumInAP').html(peopleNumInAP);

        var topLabel;

        if (countries <= 3)
            topLabel = 'Total ' + countries + ' ' + ((countries == 1) ? 'destination country' : 'destination countries');
        else
            topLabel = 'Top ' + topCountryCount + ' of ' + countries + ' ' + 'destination countries';//type + 's'

        d3.select('#top-label').text(topLabel);

        var topValues = d3.select('#top-values').html(null);

        if (linksData.length > 0) {
            linksData.forEach(function(d) {
                topValues
                    .append('dt')
                    .datum(d)
                    .text(function(d) {
                        return codeCountries.get(((typeMode) ? d[0].origin : d[0].destination));
                    });

                topValues
                    .append('dt')
                    .datum(d)
                    .text(function(d) {
                        return numberFormat(d[0].peopleNumInAP);
                    });
            });
        } else {
            topValues.append('dt').text('N/A');
        }
    } else
        {
        var type = ((typeMode) ? 'ASYLUM' : 'ORIGIN');
        var countries = filteredCountryNodes.keys().length;
        var nodesData = filteredCountryNodes.values()
            .sort(function(a, b) {
                return (valueMode) ? b.refugeesPopulation - a.refugeesPopulation : b.peopleNumInAP - a.peopleNumInAP;
            }).slice(0, topCountryCount);

        d3.select('#peopleNumInAP-mode').text('TOTAL DEATH ALL OVER THE WORLD');
        d3.select('#region').text('World');
        d3.select('#peopleNumInAP').text(numberFormat(worldNodes.peopleNumInAP));
        d3.select('#population').text(numberFormat(worldNodes.population));
        d3.select('#refugeesPopulation').text(decimalFormat(worldNodes.refugeesPopulation));

        var topLabel;

        if (countries <= 3)
            topLabel = countries + ' ' + 'TAKE OFF COUNTRIES';//type + ((countries == 1) ? '' : 's')

        else
            topLabel = 'TOP ' + topCountryCount + ' of ' + countries + ' ' + 'COUNTRIES(TAKE OFF )';//type + 's'

        d3.select('#top-label').text(topLabel);

        var topValues = d3.select('#top-values').html(null);

        nodesData.forEach(function(d) {
            topValues
                .append('dt')
                .datum(d)
                .text(function(d) {
                    return codeCountries.get(d.code);
                });

            topValues
                .append('dd')
                .datum(d)
                .text(function(d) {
                    return (valueMode) ? decimalFormat(d.refugeesPopulation) : numberFormat(d.peopleNumInAP);
                });
        });
    }

    updateTimeline();
}

function hasStory(id, year) {
    if (id === 'WLD')
        return stories.has(year);
    else
        return stories.has(year) && stories.get(year).has(id);
}

function countryStories(id) {
    var countryStories = [];

    stories.forEach(function(key, value) {
        if (key != year)
            value.forEach(function(key, value) {
                if (key == id)
                    countryStories.push(value[0]);
            });
    });

    return countryStories;
}

function updateStoryHead() {
    clearTimeout(storyTimer);

    var duration = 500;

    if (!worldStories) {
        d3.select('#story-head').transition().duration(duration).style('opacity', 0);
        return false;
    }

    if (highlighted || selected || playing) {
        var country = (selected) ? selected : highlighted;

        if (hasStory(country.id, year)) {
            var story = stories.get(year).get(country.id)[0];

            d3.select('#story-head').html(null).append('p').text(story.head);
            d3.select('#story-head').transition().duration(duration).style('opacity', 1);

            $('#story-head p').ellipsis();
        } else
            d3.select('#story-head').transition().duration(duration).style('opacity', 0);

        return false;
    }

    var i = (storyCount % worldStories.length);
    var story = (worldStories.length === 1) ? worldStories[0][0] : worldStories[i][0];

    d3.select('#region').text(story.name);

    d3.select('#story-head').html(null).append('p').append('a')
        .datum(story)
        .html(function(d) {
            return d.head + ((worldStories.length > 1) ? '<span class="badge">' + (i + 1) + ' / ' + worldStories.length + '</span>' : '');
        })
        .on('click', function(d) {
            var country = landLayer.select('#' + d.code).datum();
            selectMap(country);
        });

    d3.select('#story-head').transition().duration(duration).style('opacity', 1);

    $('#story-head p').ellipsis();

    mapLayers.select('#' + story.code + '.story-button')
        .transition()
        .duration(750)
        .style('opacity', 1);

    mapLayers.selectAll('.story-button:not(#' + story.code + ')')
        .transition()
        .duration(750)
        .style('opacity', .25);

    storyTimer = setTimeout(updateStoryHead, 3000);
    storyCount++;
}

function updateStoryBody() {
    var duration = 3000;

    if (!worldStories || !selected || playing) {
        hideStoryBody();
        return false;
    }

    if (hasStory(selected.id, year)) {
        var story = stories.get(year).get(selected.id)[0];
        var relatedStories = countryStories(selected.id);

        if (selected) {
            var navBody = d3.select('#map-nav-body');
            var storyBody = d3.select('#story-body');

            if (storyBody.empty()) {
                navBody.append('div').attr('id', 'story-body-border');
                storyBody = navBody.append('div').attr('id', 'story-body');
            }

            storyBody.html(null).append('p').text(story.body);

            if (relatedStories.length) {
                var relatedStoriesList = storyBody.append('dl');

                relatedStoriesList
                    .append('dt')
                    .text('RELATED STORIES:');

                relatedStories.forEach(function(d) {
                    relatedStoriesList
                        .append('dd')
                        .append('a')
                        .datum(d)
                        .text(d.year + ': ' + d.head)
                        .on('click', function(d) {
                            gotoYear(d.year);
                        });
                });
            }
        }

        showStoryBody();
    } else
        hideStoryBody();
}

function showStoryBody(duration) {
    if (!duration)
        duration = 500;

    if (selected) {
        d3.select('#map-nav-background')
        // .style('display', 'block')
            .style('visibility', 'visible')
            .transition().duration(duration).style('opacity', 1);

        d3.select('#story-body').transition().duration(duration).style('opacity', 1);
    } else {
        hideStoryBody();
    }

    updateMapNavSize();
}

function hideStoryBody(duration) {
    if (!duration)
        duration = 500;

    d3.select('#map-nav-background').transition().duration(duration).style('opacity', 0)
        .each('end', function(d) {
            // d3.select(this).style('display', 'none')
            d3.select(this).style('visibility', 'hidden');
        });

    d3.select('#story-body')
        .transition().duration(duration).style('opacity', 0)
        .each('end', function(d) {
            d3.select(this).remove();
            updateMapNavSize();
        });

    d3.select('#story-body-border')
        .transition().duration(duration).style('opacity', 0)
        .each('end', function(d) {
            d3.select(this).remove();
        });
}

function updateStoryButtons() {
    if (!worldStories) {
        mapLayers.selectAll('.story-button').remove();
        return false;
    }

    var storyButton = mapLayers.selectAll('.story-button')
        .data(worldStories, function(d) {
            return d[0].code;
        });

    storyButton
        .enter()
        .append('svg:image')
        .attr('id', function(d) {
            return d[0].code;
        })
        .attr('class', 'story-button')
        .attr('x', function(d) {
            return -storyButtonSize / 2;
        })
        .attr('y', function(d) {
            return -storyButtonSize / 2;
        })
        .attr('transform', function(d) {
            var p = countryCentroids.get(d[0].code);
            var t = d3.transform();
            t.translate = p;
            t.scale = [1, 1];
            return t.toString();
        })
        .attr('width', storyButtonSize)
        .attr('height', storyButtonSize)
        .attr('href', 'imgs/story-icon.png')
        .on('mouseover', function(d) {
            var country = landLayer.select('#' + d[0].code).datum();
            highlightMap(country);
        })
        .on('mouseout', function(d) {
            var country = landLayer.select('#' + d[0].code).datum();
            unhighlightMap(country);
        })
        .on('click', function(d) {
            var country = landLayer.select('#' + d[0].code).datum();
            selectMap(country);
        });

    storyButton.exit().remove();

    updateStoryButtonScale();
}

function updateStoryButtonScale() {
    var s = zoom.scale();

    mapLayers.selectAll('.story-button')
        .each(function(d) {
            d3.select(this).attr('transform', function(d) {
                var p = countryCentroids.get(d[0].code);
                var t = d3.transform();
                t.translate = p;
                t.scale = [1 / s, 1 / s];
                return t.toString();
            });
        });
}

function gotoYear(y) {
    pyear = year;
    year = y;

    if (selected || highlighted) {
        var country = (selected) ? selected : highlighted;
        if (!nodes.get(year).has(country.id))
            year = (pyear - year < 0) ? getNextCountryYear(country.id, year) : getPreviousCountryYear(country.id, year)
    }

    if (pyear == year)
        return;

    storyCount = 0;

    updateData();
    updateMap();
    updateMapTooltips();
    updateNodes();
    updateLinks();
    updateStats();
    updateStoryHead();
    updateStoryBody();
    updateStoryButtons();

    updateStrokeWeights();

    hideMapTooltips();

    if (!highlighted && !selected)
        setTimeout(function() {
            updateMapTooltips();
        }, 750);

    updateURL();
}

function getNextCountryYear(id, year) {
    for (var i = year; i <= yearDomain[1]; i++)
        if (nodes.get(i).has(id))
            return i;

    return getPreviousCountryYear(id, year);
}

function getPreviousCountryYear(id, year) {
    for (var i = year; i >= yearDomain[0]; i--)
        if (nodes.get(i).has(id))
            return i;

    return getNextCountryYear(id, year);
}

function gotoNextYear() {
    if (playing) {
        if (year < yearDomain[1])
            gotoAndPlay((parseInt(year) + 1));
        else
            stop();
    } else {
        if (year < yearDomain[1])
            gotoYear((parseInt(year) + 1));
    }
}

function gotoPreviousYear() {
    if (year > yearDomain[0])
        gotoYear((parseInt(year) - 1));
}

function gotoAndPlay(y) {
    playing = true;

    gotoYear(y);

    d3.select('#play-button').attr('class', 'pause frame');
    d3.select('#play-button a').classed('blink', true);

    playTimer = setTimeout(gotoNextYear, 1200);
}

function gotoAndStop(y) {
    playing = false;

    gotoYear(y);

    d3.select('#play-button').attr('class', 'play frame');
    d3.select('#play-button a').classed('blink', false);

    clearTimeout(playTimer);
}

function play() {
    gotoAndPlay(year);
}

function stop() {
    playing = false;

    updateStoryHead();
    hideMapTooltips();

    d3.select('#play-button').attr('class', 'play frame');
    d3.select('#play-button a').classed('blink', false);

    clearTimeout(playTimer);
}

function togglePlay() {
    playing = !playing;

    if (playing)
        gotoAndPlay(year);
    else
        stop();
}



function toggleValueMode() {
    valueMode = !valueMode;

    //updateToggleButtons()

    d3.select('#peopleNumInAP').classed('value-mode-value', !valueMode);
    d3.select('#refugeesPopulation').classed('value-mode-value', valueMode);
    d3.selectAll(".value-mode-value").classed("asylum", typeMode);

    updateData();
    updateMap();
    updateMapTooltips();
    updateNodes();
    updateLinks();
    updateStats();
}

//origin asylum

function toggleTypeMode() {
    typeMode = !typeMode;

    nodes = (typeMode) ? asylumNodes : originNodes;
    links = (typeMode) ? asylumLinks : originLinks;

    allNodes = [];

    nodes.values().forEach(function(yearNodes) {
        yearNodes.values().forEach(function(node) {
            allNodes.push(node);
        });
    });

    //updateToggleButtons()

    updateData();
    updateMap();
    updateMapTooltips();
    updateNodes();
    updateLinks();
    updateStats();

    d3.selectAll(".node").classed("asylum", typeMode);
    d3.selectAll("#year-region").classed("asylum", typeMode);
    d3.selectAll(".value-mode-value").classed("asylum", typeMode);
}


function getMaxFeature(country) {
    var parent = country;

    if (parent.geometry == undefined) {
        //console.log(country);
        return false;
    }

    if (parent.geometry.coordinates.length > 1) {
        var largestChild = {
            'type': 'Feature',
            'id': country.id + '-0',
            'properties': {
                'name': country.id + '-0'
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [(parent.geometry.coordinates[0].length == 1) ? parent.geometry.coordinates[0][0] : parent.geometry.coordinates[0]]
            }
        };

        for (var i = 1; i < parent.geometry.coordinates.length; i++) {
            var child = {
                'type': 'Feature',
                'id': country.id + '-' + i,
                'properties': {
                    'name': country.id + '-' + i
                },
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [(parent.geometry.coordinates[i].length == 1) ? parent.geometry.coordinates[i][0] : parent.geometry.coordinates[i]]
                }
            };

            if (path.area(child) > path.area(largestChild))
                largestChild = child;
        }
        return largestChild;
    } else {
        return parent;
    }
}

function decimalFormat(d) {
    return '1 of ' + numberFormat(Math.round(1 / d));
}

function orderFormat(n) {
    var nLast = (n + '').slice(-1);
    var nPrefix = 'th';

    if (nLast == 1)
        return n + 'st';
    else if (nLast == 2 && n != 12)
        return n + 'nd';
    else if (nLast == 3 && n != 13)
        return n + 'rd';
    else
        return n + 'th';
}

function showMap(duration) {
    if (!duration)
        duration = 750;

    d3.select('#map-page')
        .transition()
        .duration(duration)
        .style('opacity', 1);
}

function hideMap(duration) {
    if (!duration)
        duration = 750;

    d3.select('#map-page')
        .transition()
        .duration(duration)
        .style('opacity', 0);
}

function updateURL() {
}

function gotoURL() {
    var params = location.hash.split('/');

    var delay = 0;

    if (params[1]) {
        if (params[2]) {
            if (year != params[1]) {
                gotoYear(params[1]);
                delay = 1500;
            }
        } else {
            unselectMap();
            if (year != params[1])
                gotoYear(params[1]);

            zoomToWorld();
        }
    }

    if (params[2] && selected.id != params[2])
        setTimeout(function() {
                var country = landLayer.select('#' + params[2]).datum();
                selectMap(country);
            },
            delay);
}



queue()
    .defer(d3.json, 'xbf/data/map.json')
    .defer(d3.json, 'xbf/data/countrycodes.json')
    .defer(d3.json, 'xbf/data/airplaneAccidents2.json')
    .defer(d3.json, 'xbf/data/populations.json')
    .defer(d3.csv, 'xbf/data/stories.csv')
    .await(load);


