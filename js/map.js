class SpecimenMap {

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
            zoom: 2
        });

        const defaultLayer = L.tileLayer.provider('Esri.WorldImagery').addTo(vis.theMap);

        vis.baseLayers = {
            'Satellite': defaultLayer,
            'Topographical': L.tileLayer.provider('OpenTopoMap'),
            'Roads': L.tileLayer.provider('OpenStreetMap.Mapnik')
        };

        vis.layerControl = L.control.layers(this.baseLayers, {}, {
            collapsed: false
        }).addTo(vis.theMap);

        // Make the map clickable
        L.svg({ clickable: true }).addTo(vis.theMap)
        vis.overlay = d3.select(vis.theMap.getPanes().overlayPane)
        vis.svg = vis.overlay.select('svg').attr("pointer-events", "auto");

        // Initialize the color scales
        vis.yearColorScale = d3.scaleSequential(d3.interpolateOrRd)
            .domain([d3.min(vis.data, d => parseInt(d['year'])), d3.max(vis.data, d => parseInt(d['year']))]);

        vis.dayColorScale = d3.scaleSequential(d3.interpolateBuGn)
            .domain([d3.min(vis.data, d => parseInt(d['startDayOfYear'])), d3.max(vis.data, d => parseInt(d['startDayOfYear']))]);

        vis.phylumColorScale = d3.scaleOrdinal(d3.schemeSet1)
            .domain(['Myxomycota', 'Ascomycota', 'Amoebozoa', 'Basidiomycota', 'Chytridiomycota', 'Zygomycota', 'Oomycota', 'Blastocladiomycota'])
            .range(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#000000']);

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
                    .html(`<div class="tooltip-label">Name: ${d['genus']} ${d['specificEpithet']}<br>Year: ${d['year']}<br>Recorded By: ${d['recordedBy']}<br>Classification: ${d['higherClassification']}<br>Habitat Notes: ${d['habitat']}<br>Substrate Notes: ${d['substrate']}</div>`);

            })
            .on('mousemove', function (event) {
                d3.select('#tooltip')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY + 10) + 'px');
            })
            .on('mouseleave', function (event) {
                d3.select('#tooltip')
                    .style('left', 0)
                    .style('top', 0)
                    .style('opacity', 0);

                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('stroke-width', 1)
                    .attr('r', vis.radiusSize)
            })
            .on('click', function(event, d) {
                window.open(d['references']);
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

        vis.legend = d3.select('#mapLegend')
            .attr('width', 500)
            .attr('height', 30);

        vis.addYearLegend();
        vis.addDayLegend();
        vis.addPhylumLegend();
    }

    addYearLegend() {
        const vis = this;

        vis.yearLegend = vis.legend.append('g')
            .attr('id', 'yearLegend');

        vis.defs = vis.yearLegend.append('defs');

        vis.linearGradient = vis.defs.append('linearGradient')
            .attr('id', 'linearGradientYear');

        vis.linearGradient.selectAll('stop')
            .data(vis.yearColorScale.ticks().map((t, i, n) => ({ offset: `${100 * i / n.length}%`, color: vis.yearColorScale(t) })))
            .join('stop')
            .attr('offset', d => d.offset)
            .attr('stop-color', d => d.color);

        vis.gradientRect = vis.yearLegend.append('rect')
            .attr('height', '100%')
            .attr('width', '100%')
            .style('fill', 'url(#linearGradientYear)');

        vis.gradientStart = vis.yearLegend.append('text')
            .attr('transform', 'translate(0, 25)')
            .attr('id', 'gradientStart')
            .text(`${vis.yearColorScale.domain()[0]}`);

        vis.gradientEnd = vis.yearLegend.append('text')
            .attr('id', 'gradientEnd')
            .attr('transform', 'translate(465, 25)')
            .text(`${vis.yearColorScale.domain()[1]}`);
    }

    addDayLegend() {
        const vis = this;

        vis.dayLegend = vis.legend.append('g')
            .attr('id', 'dayLegend')
            .style('visibility', 'hidden');

        vis.defsDay = vis.dayLegend.append('defs');

        vis.linearGradientDay = vis.defs.append('linearGradient')
            .attr('id', 'linearGradientDay');

        vis.linearGradientDay.selectAll('stop')
            .data(vis.dayColorScale.ticks().map((t, i, n) => ({ offset: `${100 * i / n.length}%`, color: vis.dayColorScale(t) })))
            .join('stop')
            .attr('offset', d => d.offset)
            .attr('stop-color', d => d.color);

        vis.gradientRectDay = vis.dayLegend.append('rect')
            .attr('height', '100%')
            .attr('width', '100%')
            .style('fill', 'url(#linearGradientDay)');

        vis.gradientStartDay = vis.dayLegend.append('text')
            .attr('transform', 'translate(0, 25)')
            .attr('id', 'gradientStart')
            .text(`${vis.dayColorScale.domain()[0]}`);

        vis.gradientEndDay = vis.dayLegend.append('text')
            .attr('id', 'gradientEnd')
            .attr('transform', 'translate(465, 25)')
            .text(`${vis.dayColorScale.domain()[1]}`);
    }

    addPhylumLegend() {
        const vis = this;

        vis.ordinalRects = vis.legend.append('g')
            .attr('id', 'phylumLegend')
            .style('visibility', 'hidden');

        let phylum = vis.phylumColorScale.domain();
        phylum.forEach((item, index) => {
            if (item != 'null') {
                vis.ordinalRects.append('rect')
                    .style('fill', vis.phylumColorScale(item))
                    .attr('height', '20')
                    .attr('width', '20')
                    .attr('transform', `translate(0, ${25 * index})`);

                vis.ordinalRects.append('text')
                    .attr('transform', `translate(${35}, ${(25 * index) + 15})`)
                    .text(item);
            }
        });
    }

    updateVis() {
        let vis = this;

        vis.zoomLevel = vis.theMap.getZoom();

        // Change the size of the circles based on zoom level
        if (vis.zoomLevel >= 6) vis.radiusSize = 4;
        if (vis.zoomLevel >= 8) vis.radiusSize = 5;
        if (vis.zoomLevel >= 10) vis.radiusSize = 6;
        if (vis.zoomLevel < 6) vis.radiusSize = 3;

        // Rerenders the dots on a zoom or change select event
        vis.Dots
            .attr('fill', (d) => {
                if (vis.colorBy == 'year') {
                    if (d['year'] == 'null') return 'black';
                    return vis.yearColorScale(parseInt(d['year']));
                }
                else if (vis.colorBy == 'startDay') {
                    return vis.dayColorScale(parseInt(d['startDayOfYear']));
                }
                else if (vis.colorBy == 'phylum') {
                    return vis.phylumColorScale(d['phylum']);
                }
            })
            .attr('cx', d => vis.theMap.latLngToLayerPoint([d['decimalLatitude'], d['decimalLongitude']]).x)
            .attr('cy', d => vis.theMap.latLngToLayerPoint([d['decimalLatitude'], d['decimalLongitude']]).y)
            .attr('r', vis.radiusSize);

        if (vis.colorBy == 'year') {
            vis.legend.attr('height', 30);

            d3.select('#dayLegend')
                .style('visibility', 'hidden');

            d3.select('#yearLegend')
                .style('visibility', 'visible');

            d3.select('#phylumLegend')
                .style('visibility', 'hidden');
        } else if (vis.colorBy == 'startDay') {
            vis.legend.attr('height', 30);

            d3.select('#yearLegend')
                .style('visibility', 'hidden');

            d3.select('#dayLegend')
                .style('visibility', 'visible');

            d3.select('#phylumLegend')
                .style('visibility', 'hidden');
        } else if (vis.colorBy == 'phylum') {
            vis.legend.attr('height', 200);

            d3.select('#yearLegend')
                .style('visibility', 'hidden');

            d3.select('#dayLegend')
                .style('visibility', 'hidden');

            d3.select('#phylumLegend')
                .style('visibility', 'visible');
        }
    }
}