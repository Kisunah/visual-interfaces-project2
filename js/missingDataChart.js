class missingDataChart {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 350,
            margin: { top: 50, right: 50, bottom: 50, left: 50 }
        }

        this.data = _data;

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.xScale = d3.scaleBand()
            .padding(0.1)
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0])
            .nice();

        vis.xAxis = d3.axisBottom(vis.xScale);

        vis.yAxis = d3.axisLeft(vis.yScale);

        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);

        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.xScale.domain(vis.data.map(d => d.field));
        vis.yScale.domain([0, 100]);

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        const bar = vis.svg.selectAll('rect')
            .data(vis.data)
            .join('rect')
            .attr('x', d => vis.xScale(d.field))
            .attr('y', d => vis.yScale(d.missing))
            .attr('height', d => vis.height - vis.yScale(d.missing))
            .attr('width', vis.xScale.bandwidth())
            .attr('pointer-events', 'all')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`)
            .attr('fill', 'green')
            .attr('class', 'off')
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 2)
                    .style('cursor', 'pointer');

                d3.select('#monthTooltip')
                    .style('opacity', 1)
                    .style('z-index', 100000)
                    .html(`<div class="tooltip-label">Name: ${d.field}<br>Total Specimens: ${d.totalSpecimens}<br>Missing: ${d.missing}<br>Existing: ${d.existing}</div>`)
            })
            .on('mousemove', function (event) {
                d3.select('#monthTooltip')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY + 10) + 'px');
            })
            .on('mouseleave', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('stroke-width', 0)
                    .style('cursor', 'default');

                d3.select('#monthTooltip')
                    .style('left', 0)
                    .style('top', 0)
                    .style('opacity', 0);
            })
            .on('click', function () {
                const bar = d3.select(this);
                if (bar.attr('class') == 'off') {
                    bar.attr('class', 'on');
                } else {
                    bar.attr('class', 'off');
                }

                let selectedMissingValues = [];

                d3.selectAll('.on')._groups[0].forEach((item) => {
                    selectedMissingValues.push(item.__data__.field);
                });

                const event = new CustomEvent('missingFilter', { detail: selectedMissingValues });
                document.dispatchEvent(event);
            });


        vis.xAxisG.call(vis.xAxis)
            .selectAll('text')
            .style('font-weight', 'bold')
        vis.yAxisG.call(vis.yAxis);
    }

    updateChart(newData, enabled) {
        let vis = this;

        vis.svg.selectAll('rect')
            .data(newData)
            .transition().duration(1000)
            .attr('y', d => vis.yScale(d.missing))
            .attr('height', d => vis.height - vis.yScale(d.missing));

        if (enabled) {
            vis.svg.selectAll('rect')
                .on('click', function () {
                    const bar = d3.select(this);
                    if (bar.attr('class') == 'off') {
                        bar.attr('class', 'on');
                    } else {
                        bar.attr('class', 'off');
                    }

                    let selectedMissingValues = [];

                    d3.selectAll('.on')._groups[0].forEach((item) => {
                        selectedMissingValues.push(item.__data__.field);
                    });

                    const event = new CustomEvent('missingFilter', { detail: selectedMissingValues });
                    document.dispatchEvent(event);
                });
        } else {
            vis.svg.selectAll('rect')
                .on('click', () => { });
        }
    }
}