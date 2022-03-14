class Map {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement
        };

        this.data = _data;
        this.initVis();
    }

    initVis() {
        let vis = this;

        // Initialize the map
        vis.theMap = L.map('map', {
            center: [30, 0],
            zoom: 3
        });

        const defaultLayer = L.tileLayer.provider('Esri.WorldImagery').addTo(vis.theMap);

        vis.baseLayers = {
            'Satellite': defaultLayer,
            'Topographical': L.tileLayer.provider('OpenTopoMap'),
            'Roads': L.tileLayer.provider('OpenStreetMap.Mapnik')
        };

        vis.layerControl = L.control.layers(this.baseLayers, {} , {
            collapsed: false
        }).addTo(vis.theMap);

        // Make the map clickable
        L.svg({ clickable: true }).addTo(vis.theMap)
        vis.overlay = d3.select(vis.theMap.getPanes().overlayPane)
        vis.svg = vis.overlay.select('svg').attr("pointer-events", "auto");

        // Initialize the color scales
        vis.yearColorScale = d3.scaleSequential()
            .interpolator(d3.interpolateRdBu)
            .domain([d3.min(vis.data, d => parseInt(d['year'])), d3.max(vis.data, d => parseInt(d['year']))]);

        // Need 2 more color scales, one for startDayFromYear and one for class

        vis.radiusSize = 3;

        // Append the specimen dots to the map
        vis.Dots = vis.svg.selectAll('circle')
            .data(vis.data)
            .join('circle')
            .attr('fill', (d) => {
                if (d['year'] == 'null') return 'black';
                vis.colorBy = 'year';
                return vis.yearColorScale(parseInt(d['year']));
            })
            .attr('stroke', 'black')
            .attr('cx', d => vis.theMap.latLngToLayerPoint([d['decimalLatitude'], d['decimalLongitude']]).x)
            .attr('cy', d => vis.theMap.latLngToLayerPoint([d['decimalLatitude'], d['decimalLongitude']]).y)
            .attr('r', vis.radiusSize)
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('stroke-width', 2)
                    .attr('r', vis.radiusSize + 1)
                    .style('cursor', 'default')

                d3.select('#tooltip')
                    .style('opacity', 1)
                    .style('z-index', 100000)
                    .html(`<div class="tooltip-label">Name: ${d['genus']} ${d['specificEpithet']}, Year: ${d['year']}</div>`);

            })
            .on('mousemove', function (event) {
                d3.select('#tooltip')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY + 10) + 'px');
            })
            .on('mouseleave', function (event) {
                d3.select('#tooltip').style('opacity', 0);

                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('stroke-width', 1)
                    .attr('r', vis.radiusSize)
            });

        vis.theMap.on("zoomend", function () {
            vis.updateVis();
        });

        document.querySelectorAll('input[name="colorScale"]').forEach((elem) => {
            elem.addEventListener('click', (event) => {
                vis.colorBy = event.target.value;
                vis.updateVis();
            });
        });
    }

    updateVis() {
        let vis = this;

        vis.zoomLevel = vis.theMap.getZoom();

        // Change the size of the circles based on zoom level
        if (vis.zoomLevel >= 6) vis.radiusSize = 4;
        if (vis.zoomLevel >= 8) vis.radiusSize = 5;
        if (vis.zoomLevel >= 10) vis.radiusSize = 6;        

        // Rerenders the dots on a zoom or change select event
        vis.Dots
            .attr('fill', (d) => {
                if (vis.colorBy == 'year') {
                    if (d['year'] == 'null') return 'black';
                    return vis.yearColorScale(parseInt(d['year']));
                }
                else if (vis.colorBy == 'startDay') {
                    return 'red'; // Needs to change to a new color scale
                }
                else if (vis.colorBy == 'class') {
                    return 'green'; // Needs to change to a new color scale
                }
            })
            .attr('cx', d => vis.theMap.latLngToLayerPoint([d['decimalLatitude'], d['decimalLongitude']]).x)
            .attr('cy', d => vis.theMap.latLngToLayerPoint([d['decimalLatitude'], d['decimalLongitude']]).y)
            .attr('r', vis.radiusSize);
    }
}