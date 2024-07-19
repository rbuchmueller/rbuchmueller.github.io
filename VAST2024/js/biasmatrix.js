document.addEventListener('DOMContentLoaded', function () {
    const svg = d3.select('#biasMatrix');
    const margin = { top: 20, right: 20, bottom: 50, left: 150 };
    const width = document.querySelector('.chart-container').clientWidth - margin.left - margin.right;
    const height = document.querySelector('.chart-container').clientHeight - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    svg.attr('width', width + margin.left + margin.right)
       .attr('height', height + margin.top + margin.bottom);

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleBand().range([0, height]).padding(0.2);
    const color = d3.scaleSequential(d3.interpolateBlues);

    const tooltip = d3.select('.tooltip');

    d3.csv('MC1/mc1_data/relationships.csv').then(data => {
        data.forEach(d => {
            d.date = new Date(d.timestamp);
            d.bias_score = +d.bias_score;
        });

        const dimensionSelect = document.getElementById('dimension-select');
        const legend = d3.select('#legend');

        function update() {
            const selectedDimension = dimensionSelect.value;

            const keys = Array.from(new Set(data.map(d => d[selectedDimension])));

            // Group data by date and dimension
            const nestedData = d3.rollups(data, v => d3.mean(v, d => d.bias_score), d => d3.timeDay(d.date), d => d[selectedDimension])
                .map(([date, values]) => {
                    const result = { date: new Date(date) };
                    values.forEach(([key, mean]) => {
                        result[key] = mean;
                    });
                    return result;
                });

            console.log("Nested Data:", nestedData);

            const startDate = d3.min(nestedData, d => d.date);
            const endDate = d3.max(nestedData, d => d.date);
            
            const binnedData = d3.timeDays(startDate, endDate).map(date => {
                const bin = nestedData.find(d => +d.date === +date) || { date };
                keys.forEach(key => {
                    if (!bin[key]) {
                        bin[key] = 0;
                    }
                });
                return bin;
            });

            console.log("Binned Data:", binnedData);

            const stack = d3.stack().keys(keys);
            const stackData = stack(binnedData);

            console.log("Stack Data:", stackData);

            x.domain([startDate, endDate]);
            y.domain(keys);
            color.domain([0, d3.max(stackData, d => d3.max(d, d => d[1] - d[0]))]);

            g.selectAll('.bin').remove();
            g.selectAll('.axis').remove();

            const bins = g.selectAll('.bin')
                .data(stackData)
                .enter().append('g')
                .attr('class', 'bin');

            bins.selectAll('rect')
                .data(d => d)
                .enter().append('rect')
                .attr('x', d => x(d.data.date))
                .attr('y', (d, i, nodes) => {
                    const key = d3.select(nodes[i].parentNode).datum().key;
                    return y(key);
                })
                .attr('width', x(d3.timeDay.offset(new Date(), 1)) - x(new Date()))  // Width of one day
                .attr('height', y.bandwidth())
                .attr('fill', (d, i, nodes) => {
                    const key = d3.select(nodes[i].parentNode).datum().key;
                    return color(d[1] - d[0]);
                })
                .on('mouseover', function (event, d) {
                    const key = d3.select(this.parentNode).datum().key;
                    tooltip.style('visibility', 'visible');
                    d3.select(this).attr('opacity', 0.7);
                    tooltip.html(`
                        <strong>${key}</strong><br>
                        Date: ${d3.timeFormat("%Y-%m-%d")(d.data.date)}<br>
                        Bias Score: ${(d[1] - d[0]).toFixed(2)}
                    `);
                })
                .on('mousemove', function (event) {
                    tooltip.style('left', `${event.pageX + 10}px`)
                           .style('top', `${event.pageY - 10}px`);
                })
                .on('mouseout', function () {
                    tooltip.style('visibility', 'hidden');
                    d3.select(this).attr('opacity', 1);
                });

            g.append('g')
                .attr('class', 'axis axis--x')
                .attr('transform', `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%B")));

            g.append('g')
                .attr('class', 'axis axis--y')
                .call(d3.axisLeft(y));

            // Update the legend
            const legendHeight = 20;
            const legendWidth = width / 2;

            legend.selectAll('*').remove();
            const legendScale = d3.scaleLinear()
                .domain(color.domain())
                .range([0, legendWidth]);

            const legendAxis = d3.axisBottom(legendScale)
                .ticks(5);

            const legendSvg = legend.append('svg')
                .attr('width', legendWidth)
                .attr('height', legendHeight + 20)
                .append('g')
                .attr('transform', `translate(0,10)`);

            legendSvg.selectAll('rect')
                .data(d3.range(legendWidth))
                .enter().append('rect')
                .attr('x', (d, i) => i)
                .attr('y', 0)
                .attr('width', 1)
                .attr('height', legendHeight)
                .attr('fill', d => color(legendScale.invert(d)));

            legendSvg.append('g')
                .attr('transform', `translate(0,${legendHeight})`)
                .call(legendAxis);
        }

        dimensionSelect.addEventListener('change', update);
        update();
    });
});
