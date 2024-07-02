// js/custom_projection.js

// Function to load link data and count occurrences of each document
function loadLinkData(linkDataPath) {
    return d3.json(linkDataPath).then(data => {
        const linkCounts = {};
        data.links.forEach(link => {
            const articleId = link._articleid;
            if (linkCounts[articleId]) {
                linkCounts[articleId]++;
            } else {
                linkCounts[articleId] = 1;
            }
        });
        return linkCounts;
    });
}

// Load the data and create the visualization for custom projection
Promise.all([
    d3.csv("MC1/customProjection.csv"),
    loadLinkData("MC1/mc1_data/mc1.json")
]).then(([projectionData, linkCounts]) => {
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const container = document.querySelector('.chart');
    const size = Math.min(container.clientWidth, container.clientHeight) - margin.left - margin.right;

    const svg = d3.select("#customProjection")
        .append("svg")
        .attr("width", size + margin.left + margin.right)
        .attr("height", size + margin.top + margin.bottom)
        .style("display", "block")
        .style("margin", "auto")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse the data and count link occurrences
    projectionData.forEach(d => {
        d.x = +d.x;
        d.y = +d.y;
        d.scaling = Math.random() * 0.2; // Synthetic scaling factor between 0 and 0.2
        d.mentions = linkCounts[d.article_id] || 0; // Number of times the document is mentioned
    });

    const x = d3.scaleLinear()
        .domain(d3.extent(projectionData, d => d.x)).nice()
        .range([0, size]);

    const y = d3.scaleLinear()
        .domain(d3.extent(projectionData, d => d.y)).nice()
        .range([size, 0]);

    const color = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, Math.log(d3.max(projectionData, d => d.mentions) + 1)]);

    const centerX = size / 2;
    const centerY = size / 2;

    // Adjust points towards the center by 20%
    const adjustedData = projectionData.map(d => ({
        ...d,
        adjustedX: x(d.x) + (centerX - x(d.x)) * d.scaling,
        adjustedY: y(d.y) + (centerY - y(d.y)) * d.scaling
    }));

    svg.selectAll(".dot")
        .data(adjustedData)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => d.adjustedX)
        .attr("cy", d => d.adjustedY)
        .attr("r", 3)
        .style("fill", d => color(Math.log(d.mentions + 1)))
        .on("mouseover", function(event, d) {
            showArticleText(d.article_id);
            highlightPoint(d.article_id);
        });

    // Add legend to the bottom right of the middle panel
    const legendWidth = 200;
    const legendHeight = 10;
    const legendMargin = { top: 20, right: 20, bottom: 20, left: 20 };

    const legendSvg = d3.select("#legendContainer")
        .append("svg")
        .attr("width", legendWidth + legendMargin.left + legendMargin.right)
        .attr("height", legendHeight + 50 + legendMargin.top + legendMargin.bottom); // Adjusted height for histogram

    const defs = legendSvg.append("defs");

    const linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");

    linearGradient.selectAll("stop")
        .data(color.ticks().map((t, i, n) => ({ offset: `${100 * i / n.length}%`, color: color(t) })))
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#linear-gradient)")
        .attr("transform", `translate(${legendMargin.left},${legendMargin.top})`);

    const legendScale = d3.scaleLinear()
        .domain(color.domain())
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickSize(legendHeight)
        .tickFormat(d => Math.round(Math.exp(d) - 1));

    legendSvg.append("g")
        .attr("transform", `translate(${legendMargin.left},${legendMargin.top + legendHeight})`)
        .call(legendAxis)
        .select(".domain").remove();

    // Add histogram above the color legend
    const histogramHeight = 40;
    const histogram = d3.histogram()
        .value(d => Math.log(d.mentions + 1))
        .domain(color.domain())
        .thresholds(color.ticks());

    const bins = histogram(projectionData);

    const yHistogram = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([histogramHeight, 0]);

    const bar = legendSvg.selectAll(".bar")
        .data(bins)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", d => `translate(${legendScale(d.x0) + legendMargin.left},${legendMargin.top - histogramHeight})`);

    bar.append("rect")
        .attr("x", 1)
        .attr("width", d => legendScale(d.x1) - legendScale(d.x0) - 1)
        .attr("height", d => histogramHeight - yHistogram(d.length))
        .style("fill", d => color(d.x0));

    // Display max value on the legend
    legendSvg.append("text")
        .attr("x", legendWidth + legendMargin.left)
        .attr("y", legendMargin.top + legendHeight + 30)
        .attr("text-anchor", "end")
        .style("font-size", "10px")
        .text(`Max: ${d3.max(projectionData, d => d.mentions)}`);

    // Handle window resize
    window.addEventListener('resize', () => {
        const newSize = Math.min(container.clientWidth, container.clientHeight) - margin.left - margin.right;

        svg.attr("width", newSize + margin.left + margin.right)
           .attr("height", newSize + margin.top + margin.bottom);

        x.range([0, newSize]);
        y.range([newSize, 0]);

        const newCenterX = newSize / 2;
        const newCenterY = newSize / 2;

        const adjustedData = projectionData.map(d => ({
            ...d,
            adjustedX: x(d.x) + (newCenterX - x(d.x)) * d.scaling,
            adjustedY: y(d.y) + (newCenterY - y(d.y)) * d.scaling
        }));

        svg.selectAll("circle")
            .attr("cx", d => d.adjustedX)
            .attr("cy", d => d.adjustedY);
    });
});
