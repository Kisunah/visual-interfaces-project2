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

        // Map URLs
        vis.esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        vis.esriAttr = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

        // Initialize the map
        vis.base_layer = L.tileLayer(vis.esriUrl, {
            id: 'esri-image',
            attribution: vis.esriAttr,
            ext: 'png'
        });

        vis.theMap = L.map('map', {
            center: [30, 0],
            zoom: 2,
            layers: [vis.base_layer]
        });

        // Make the map clickable
        L.svg({ clickable: true }).addTo(vis.theMap)
        vis.overlay = d3.select(vis.theMap.getPanes().overlayPane)
        vis.svg = vis.overlay.select('svg').attr("pointer-events", "auto");

        // Initialize the color scales
        vis.yearColorScale = d3.scaleSequential()
            .interpolator(d3.interpolateRdGy)
            .domain([d3.min(vis.data, d => parseInt(d['year'])), d3.max(vis.data, d => parseInt(d['year']))]);

        // Need 2 more color scales, one for startDayFromYear and one for class

        // Append the specimen dots to the map
        vis.Dots = vis.svg.selectAll('circle')
            .data(vis.data)
            .join('circle')
            .attr('fill', (d) => {
                if (d['year'] == 'null') return 'black';
                return vis.yearColorScale(parseInt(d['year']));
            })
            .attr('stroke', 'black')
            .attr('cx', d => vis.theMap.latLngToLayerPoint([d['decimalLatitude'], d['decimalLongitude']]).x)
            .attr('cy', d => vis.theMap.latLngToLayerPoint([d['decimalLatitude'], d['decimalLongitude']]).y)
            .attr('r', 3);

        vis.theMap.on("zoomend", function () {
            vis.updateVis();
        });

        // Handles the change event of the select object to choose how the dots are colored
        document.getElementById('colorBy').addEventListener('change', (event) => {
            vis.updateVis();
        });
    }

    updateVis() {
        let vis = this;

        vis.radiusSize = 3;

        let colorBy = document.getElementById('colorBy').value;

        // Rerenders the dots on a zoom or change select event
        vis.Dots
            .attr('fill', (d) => {
                if (colorBy == 'year') {
                    if (d['year'] == 'null') return 'black';
                    return vis.yearColorScale(parseInt(d['year']));
                }
                else if (colorBy == 'startDay') {
                    return 'red'; // Needs to change to a new color scale
                }
                else if (colorBy == 'class') {
                    return 'green'; // Needs to change to a new color scale
                }
            })
            .attr('cx', d => vis.theMap.latLngToLayerPoint([d['decimalLatitude'], d['decimalLongitude']]).x)
            .attr('cy', d => vis.theMap.latLngToLayerPoint([d['decimalLatitude'], d['decimalLongitude']]).y)
            .attr('r', 3);
    }
}