document.addEventListener('DOMContentLoaded', function () {
    const svg = d3.select('#themeRiverChart');
    const margin = { top: 20, right: 150, bottom: 50, left: 50 };
    const width = document.querySelector('.chart-container').clientWidth * 1.5 - margin.left - margin.right; // Increased width
    const height = document.querySelector('.chart-container').clientHeight - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    svg.attr('width', width + margin.left + margin.right)
       .attr('height', height + margin.top + margin.bottom);

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const area = d3.area()
        .x(d => x(d.data.date))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
        .curve(d3.curveBasis); // Apply curve to smooth the area chart

    const stack = d3.stack()
        .offset(d3.stackOffsetNone) // Changed to stackOffsetNone
        .order(d3.stackOrderAppearance);

    d3.csv('MC1/mc1_data/relationships.csv').then(data => {
        console.log("Raw data loaded:", data);
        data.forEach(d => {
            d.date = new Date(d.timestamp);
            d.bias_score = +d.bias_score;
        });

        const dimensionSelect = document.getElementById('dimension-select');
        const legend = d3.select('#legend');

        function update() {
            const selectedDimension = dimensionSelect.value;
            console.log("Selected dimension:", selectedDimension);

            const keys = Array.from(new Set(data.map(d => d[selectedDimension])));
            const nestedData = Array.from(
                d3.group(data, d => d.date),
                ([key, values]) => {
                    const result = { date: new Date(key) };
                    keys.forEach(k => {
                        result[k] = d3.mean(values.filter(d => d[selectedDimension] === k), d => d.bias_score) || 0;
                    });
                    return result;
                }
            );

            console.log("Nested data:", nestedData);

            const stackDataInput = nestedData.map(d => {
                const obj = { date: d.date };
                keys.forEach(key => {
                    obj[key] = d[key];
                });
                return obj;
            });

            console.log("Stack data input:", stackDataInput);

            const stackData = stack.keys(keys)(stackDataInput);

            console.log("Stack data:", stackData);

            x.domain(d3.extent(data, d => d.date));
            y.domain([0, d3.max(stackData, d => d3.max(d, d => d[1]))]);

            g.selectAll('.area').remove();
            g.selectAll('.axis').remove();

            const areaPaths = g.selectAll('.area')
                .data(stackData)
                .enter().append('path')
                .attr('class', 'area')
                .attr('d', area)
                .attr('fill', d => color(d.key));

            g.append('g')
                .attr('class', 'axis axis--x')
                .attr('transform', `translate(0,${height})`)
                .call(d3.axisBottom(x));

            g.append('g')
                .attr('class', 'axis axis--y')
                .call(d3.axisLeft(y));

            // Tooltip
            const tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('padding', '10px')
                .style('background', 'rgba(0,0,0,0.7)')
                .style('color', '#fff')
                .style('border-radius', '5px')
                .style('visibility', 'hidden');

            areaPaths.on('mouseover', function (event, d) {
                d3.select(this).attr('opacity', 0.7);
                tooltip.style('visibility', 'visible');
            })
            .on('mousemove', function (event, d) {
                const [xPos, yPos] = d3.pointer(event);
                const date = x.invert(xPos);
                const formattedDate = d3.timeFormat("%Y-%m-%d")(date);
                const key = d.key;
                const value = d.find(point => point.data.date.getTime() === date.getTime());

                tooltip.html(`
                    <strong>${key}</strong><br>
                    Date: ${formattedDate}<br>
                    Bias Score: ${(value ? value.data[key].toFixed(2) : 'N/A')}
                `)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 10}px`);
            })
            .on('mouseout', function () {
                d3.select(this).attr('opacity', 1);
                tooltip.style('visibility', 'hidden');
            });

            // Update the legend
            legend.selectAll('*').remove();
            keys.forEach(key => {
                const legendItem = legend.append('div').attr('class', 'legend-item');
                legendItem.append('div')
                    .attr('class', 'legend-color')
                    .style('background-color', color(key));
                legendItem.append('div').text(key);
            });
        }

        dimensionSelect.addEventListener('change', update);
        update();
    });
});
