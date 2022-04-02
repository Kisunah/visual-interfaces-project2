class Timeline {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            width: 2000,
            height: 240,
            contextHeight: 50,
            margin: { top: 10, right: 10, bottom: 100, left: 45 },
            contextMargin: { top: 280, right: 10, bottom: 20, left: 45 }
        }

        this.data = _data;

        this.initVis();
    }

    initVis() {
        let vis = this;

        const containerWidth = vis.config.width + vis.config.margin.left + vis.config.margin.right;
        const containerHeight = vis.config.height + vis.config.margin.top + vis.config.margin.bottom;

        vis.height = containerHeight;

        vis.yearColorScale = d3.scaleSequential(d3.interpolateOrRd)
            .domain([1859, 2017]);

        vis.xScaleFocus = d3.scaleBand()
            .padding(0.1)
            .range([0, vis.config.width]);

        vis.xScaleContext = d3.scaleBand()
            .padding(0.1)
            .range([0, vis.config.width]);

        vis.yScaleFocus = d3.scaleLinear()
            .range([vis.config.height, 0])
            .nice();

        vis.yScaleContext = d3.scaleLinear()
            .range([vis.config.contextHeight, 0])
            .nice();

        // Initialize axes
        vis.xAxisFocus = d3.axisBottom(vis.xScaleFocus).tickSizeOuter(0);
        vis.xAxisContext = d3.axisBottom(vis.xScaleContext).tickSizeOuter(0);
        vis.yAxisFocus = d3.axisLeft(vis.yScaleFocus);

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', containerWidth)
            .attr('height', containerHeight);

        // Append focus group with x- and y-axes
        vis.focus = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.focus.append('defs').append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', vis.config.width)
            .attr('height', vis.config.height);

        vis.xAxisFocusG = vis.focus.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.config.height})`);

        vis.yAxisFocusG = vis.focus.append('g')
            .attr('class', 'axis y-axis');

        // Append context group with x- and y-axes
        vis.context = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.contextMargin.left},${vis.config.contextMargin.top})`);

        vis.xAxisContextG = vis.context.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.config.contextHeight})`);

        vis.brushG = vis.context.append('g')
            .attr('width', 2000)
            .attr('class', 'brush x-brush');


        // Initialize brush component
        vis.brush = d3.brushX()
            .extent([
                [0, 0],
                [vis.config.width, vis.config.contextHeight]
            ])
            .on('brush', function({ selection }) {
                if (selection) vis.brushed(selection);
            })
            .on('end', function({ sourceEvent, selection }) {
                vis.brushEnd(selection, sourceEvent);
            });

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.xValue = d => d.year;
        vis.yValue = d => d.specimenCount;

        // Initialize line and area generators
        vis.line = d3.line()
            .x(d => vis.xScaleFocus(vis.xValue(d)))
            .y(d => vis.yScaleFocus(vis.yValue(d)));

        vis.area = d3.area()
            .x(d => vis.xScaleContext(vis.xValue(d)))
            .y1(d => vis.yScaleContext(vis.yValue(d)))
            .y0(vis.config.contextHeight);

        // Set the scale input domains
        vis.xScaleFocus.domain(vis.data.map(d => d.year));
        vis.yScaleFocus.domain([0, d3.max(vis.data, d => d.specimenCount)]);
        vis.xScaleContext.domain(vis.xScaleFocus.domain());
        vis.yScaleContext.domain(vis.yScaleFocus.domain());
        vis.xAxisFocus.tickValues(vis.xScaleFocus.domain().filter(function(d,i){ return !(i%5)}));

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        vis.contextBar = vis.brushG.selectAll('rect')
            .data(vis.data)
            .join('rect')
            .attr('width', vis.xScaleContext.bandwidth())
            .attr('height', d => 50 - vis.yScaleContext(d.specimenCount))
            .attr('x', d => vis.xScaleContext(d.year))
            .attr('y', d => vis.yScaleContext(d.specimenCount))
            .attr('fill', 'grey');

        vis.focusBar = vis.focus.selectAll('rect')
            .data(vis.data)
            .join('rect')
            .attr('width', vis.xScaleFocus.bandwidth())
            .attr('height', d => vis.height - vis.config.margin.top - vis.config.margin.bottom - vis.yScaleFocus(d.specimenCount))
            .attr('x', d => vis.xScaleFocus(d.year))
            .attr('y', d => vis.yScaleFocus(d.specimenCount))
            .attr('fill', d => vis.yearColorScale(d.year))
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 2)
                    .style('cursor', 'pointer');

                d3.select('#timelineTooltip')
                    .style('opacity', 1)
                    .style('z-index', 100000)
                    .html(`<div class="tooltip-label">Year: ${d.year}<br>Count: ${d.specimenCount}</div>`)
            })
            .on('mousemove', function(event) {
                d3.select('#timelineTooltip')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY + 10) + 'px');
            })
            .on('mouseleave', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('stroke-width', 0)
                    .style('cursor', 'default');

                d3.select('#timelineTooltip')
                    .style('left', 0)
                    .style('top', 0)
                    .style('opacity', 0);
            });

        vis.xAxisFocusG.call(vis.xAxisFocus);

        vis.brushG.call(vis.brush);
    }

    brushed(selection) {
        let vis = this;

        let year1, year2;
        if (selection) {
            let eachBand = vis.xScaleContext.step();
            let index1 = Math.floor(selection[0] / eachBand);
            year1 = vis.xScaleContext.domain()[index1];
            let index2 = Math.floor(selection[1] / eachBand) - 1;
            year2 = vis.xScaleContext.domain()[index2];

            let newDomain = [];
            for (let i = year1; i <= year2; i++) {
                newDomain.push(i);
            }

            vis.xScaleFocus.domain(newDomain);
        } else {
            vis.xScaleFocus.domain(vis.xScaleContext.domain());
        }

        if (vis.xScaleFocus.domain().length < 10) {
            vis.xAxisFocus.tickValues(vis.xScaleFocus.domain().filter(function(d,i){ return !(i%1)}))
        } else {
            vis.xAxisFocus.tickValues(vis.xScaleFocus.domain().filter(function(d,i){ return !(i%5)}))
        }
        vis.xAxisFocusG.call(vis.xAxisFocus);

        vis.focusBar.attr('x', d => vis.xScaleFocus(d.year));

        vis.focusBar
            .attr('width', vis.xScaleFocus.bandwidth())
            .attr('height', d => vis.height - vis.config.margin.top - vis.config.margin.bottom - vis.yScaleFocus(d.specimenCount))
            .attr('x', d => vis.xScaleFocus(d.year))
            .attr('y', d => vis.yScaleFocus(d.specimenCount))
            .attr('fill', d => {
                if (vis.xScaleFocus(d.year)) return vis.yearColorScale(d.year);
                return 'none';
            });

        const event = new CustomEvent('timelineFilter', { detail: { begin: year1, end: year2 } });
        document.dispatchEvent(event);
    }

    brushEnd(selection, sourceEvent) {
        let vis = this;
        if (!sourceEvent) return;
        if (!selection) {
            vis.xScaleFocus.domain(vis.xScaleContext.domain());
            if (vis.xScaleFocus.domain().length < 10) {
                vis.xAxisFocus.tickValues(vis.xScaleFocus.domain().filter(function(d,i){ return !(i%1)}))
            } else {
                vis.xAxisFocus.tickValues(vis.xScaleFocus.domain().filter(function(d,i){ return !(i%5)}))
            }
            vis.xAxisFocusG.call(vis.xAxisFocus);

            vis.focusBar
                .attr('width', vis.xScaleFocus.bandwidth())
                .attr('height', d => vis.height - vis.config.margin.top - vis.config.margin.bottom - vis.yScaleFocus(d.specimenCount))
                .attr('x', d => vis.xScaleFocus(d.year))
                .attr('y', d => vis.yScaleFocus(d.specimenCount))
                .attr('fill', d => {
                    if (vis.xScaleFocus(d.year)) return vis.yearColorScale(d.year);
                    return 'none';
                });

            const event = new CustomEvent('timelineFilter', { detail: { begin: 1859, end: 2017 } });
            document.dispatchEvent(event);
            return;
        }

        let eachBand = vis.xScaleContext.step();
        let index1 = Math.round(selection[0] / eachBand);
        let year1 = vis.xScaleContext.domain()[index1];
        let index2 = Math.round(selection[1] / eachBand) - 1;
        let year2 = vis.xScaleContext.domain()[index2];

        let begin = vis.xScaleContext(year1);
        let end = vis.xScaleContext(year2);

        vis.brushG.transition().call(vis.brush.move, [begin, end + eachBand]);

        vis.focusBar
            .attr('width', vis.xScaleFocus.bandwidth())
            .attr('height', d => vis.height - vis.config.margin.top - vis.config.margin.bottom - vis.yScaleFocus(d.specimenCount))
            .attr('x', d => vis.xScaleFocus(d.year))
            .attr('y', d => vis.yScaleFocus(d.specimenCount))
            .attr('fill', d => {
                if (vis.xScaleFocus(d.year)) return vis.yearColorScale(d.year);
                return 'none';
            });

        const event = new CustomEvent('timelineFilter', { detail: { begin: year1, end: year2 } });
        document.dispatchEvent(event);
    }
}