class Timeline {
    constructor(_config, _data) {
        let width = document.getElementById('map').offsetWidth;

        this.config = {
            parentElement: _config.parentElement,
            width: width,
            height: 120
        };

        this.data = _data;
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.xScaleFocus = d3.scaleBand()
            .padding(0.2)
            .range([0, vis.config.width]);

        vis.xScaleContext = d3.scaleBand()
            .padding(0.2)
            .range([0, vis.config.width]);

        vis.yScaleFocus = d3.scaleLinear()
            .range([vis.config.height, 0])
            .nice();

        vis.yScaleContext = d3.scaleLinear()
            .range([vis.config.height, 0])
            .nice();

        vis.xAxisFocus = d3.axisBottom(vis.xScaleFocus).tickSizeOuter(0);
        vis.xAxisContext = d3.axisBottom(vis.xScaleContext).tickSizeOuter(0);
        vis.yAxisFocus = d3.axisLeft(vis.yScaleFocus);

        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.width)
            .attr('height', vis.config.height);

        vis.context = vis.svg.append('g')
            .attr('id', 'contextGroup');

        vis.brushG = vis.context.append('g');

        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.config.width, vis.config.contextHeight]])
            .on('brush', function ({ selection }) {
                if (selection) vis.brushed(selection);
            })
            .on('end', function ({ selection }) {
                if (!selection) vis.brushed(null);
            });

        vis.focus = vis.svg.append('g')
            .attr('id', 'focusGroup');

        vis.focus.append('defs')
            .append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', vis.config.width)
            .attr('height', vis.config.height);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        let minYear = d3.min(vis.data, d => d['year']);
        let maxYear = d3.max(vis.data, d => d['year']);

        let years = [];
        for (let i = minYear; i < maxYear + 1; i++) {
            years.push(i);
        }

        vis.xScaleContext.domain(years);
        vis.xScaleFocus.domain(years);

        vis.yScaleContext.domain([0, d3.max(vis.data, d => d['specimenCount'])]);

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        const contextBar = vis.context.selectAll('rect')
            .data(vis.data)
            .join('rect')
            .attr('x', d => vis.xScaleContext(parseInt(d['year'])))
            .attr('y', 0)
            .attr('fill', 'blue')
            .attr('width', vis.xScaleContext.bandwidth())
            .attr('height', d => vis.config.height - vis.yScaleContext(parseInt(d['specimenCount'])));

        const defaultBrushSelection = [0, vis.xScaleContext.range()[1]];
        vis.brushG
            .call(vis.brush)
            .call(vis.brush.move, defaultBrushSelection);
    }

    brushed(selection) {

    }
}