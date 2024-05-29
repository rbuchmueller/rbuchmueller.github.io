// js/custom_projection.js

// Load the data and create the visualization for custom projection
d3.csv("MC1/customProjection.csv").then(data => {
    const margin = { top: 10, right: 10, bottom: 10, left: 10 },
          width = Math.min(window.innerWidth * 0.4 - margin.left - margin.right, window.innerHeight * 0.6 - margin.top - margin.bottom),
          height = width;

    const svg = d3.select("#customProjection")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse the data
    data.forEach(d => {
        d.x = +d.x;
        d.y = +d.y;
    });

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.x)).nice()
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.y)).nice()
        .range([height, 0]);

    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", 3)
        .style("fill", "steelblue")
        .on("mouseover", function(event, d) {
            showArticleText(d.article_id);
            highlightPoint(d.article_id);
        });

    // Handle window resize
    window.addEventListener('resize', () => {
        const newWidth = Math.min(window.innerWidth * 0.4 - margin.left - margin.right, window.innerHeight * 0.6 - margin.top - margin.bottom);
        const newHeight = newWidth;

        svg.attr("width", newWidth + margin.left + margin.right)
           .attr("height", newHeight + margin.top + margin.bottom);

        x.range([0, newWidth]);
        y.range([newHeight, 0]);

        svg.selectAll("circle")
            .attr("cx", d => x(d.x))
            .attr("cy", d => y(d.y));
    });
});
