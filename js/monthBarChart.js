class monthBarChart {
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

        vis.xScale.domain(vis.data.map(d => d.month));
        vis.yScale.domain([0, d3.max(vis.data, d => d.count)]);

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        const bar = vis.svg.selectAll('rect')
            .data(vis.data)
            .join('rect')
            .attr('width', vis.xScale.bandwidth())
            .attr('x', d => vis.xScale(d.month))
            .attr('y', d => vis.yScale(d.count))
            .attr('pointer-events', 'all')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`)
            .attr('fill', 'red')
            .attr('height', d => vis.height - vis.yScale(d.count))
            .attr('class', 'off')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 2)
                    .style('cursor', 'pointer');

                d3.select('#monthTooltip')
                    .style('opacity', 1)
                    .style('z-index', 100000)
                    .html(`<div class="tooltip-label">Name: ${d.month}<br>Count: ${d.count}</div>`)
            })
            .on('mousemove', function (event) {
                d3.select('#monthTooltip')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY + 10) + 'px');
            })
            .on('mouseleave', function(event, d) {
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
            .on('click', function() {
                const bar = d3.select(this);
                if (bar.attr('class') == 'off') {
                    bar.attr('class', 'on');
                } else {
                    bar.attr('class', 'off');
                }

                let monthMap = {
                    'January': '1',
                    'February': '2',
                    'March': '3',
                    'April': '4', 
                    'May': '5',
                    'June': '6',
                    'July': '7',
                    'August': '8',
                    'September': '9',
                    'October': '10',
                    'November': '11',
                    'December': '12'
                };

                let selectedMonths = [];
                d3.selectAll('.on')._groups[0].forEach((item) => {
                    selectedMonths.push(monthMap[item.__data__.month]);
                });

                const event = new CustomEvent('monthFilter', {detail: selectedMonths});
                document.dispatchEvent(event);
            });

        vis.xAxisG.call(vis.xAxis)
            .selectAll('text')
                .attr('transform', 'rotate(-45)')
                .style('text-anchor', 'end')
                .style('font-weight', 'bold')
        vis.yAxisG.call(vis.yAxis);
    }

    updateChart(newData) {
        let vis = this;

        vis.yScale.domain([0, d3.max(newData, d => d.count)]);
        vis.yAxisG.call(vis.yAxis);

        vis.svg.selectAll('rect')
            .data(newData)
            .transition().duration(1000)
            .attr('y', d => vis.yScale(d.count))
            .attr('height', d => vis.height - vis.yScale(d.count));
    }
}