// js/parallel_coordinates.js

// Load the mc1.json file and create the parallel coordinates plot
d3.json("MC1/mc1_data/mc1.json").then(data => {
    const links = data.links;

    // Extract relevant fields
    const attributes = ["type", "_algorithm", "_raw_source", "source", "target"];
    const numericalAttributes = ["_date_added"];

    // Parse dates
    links.forEach(link => {
        link._date_added = new Date(link._date_added).getTime();
    });

    // Dimensions and margins
    const margin = {top: 30, right: 10, bottom: 10, left: 0},
          width = window.innerWidth - margin.left - margin.right,
          height = window.innerHeight - margin.top - margin.bottom;

    const x = d3.scalePoint().range([0, width]).padding(1),
          y = {};

    const line = d3.line(),
          axis = d3.axisLeft();
    let background,
        foreground;

    const svg = d3.select("#parallelPlot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Extract the list of dimensions and create a scale for each
    x.domain(dimensions = Object.keys(links[0]).filter(d => {
        if (attributes.includes(d) || numericalAttributes.includes(d)) {
            if (numericalAttributes.includes(d)) {
                y[d] = d3.scaleLinear()
                    .domain(d3.extent(links, p => +p[d]))
                    .range([height, 0]);
            } else {
                y[d] = d3.scalePoint()
                    .domain(links.map(p => p[d]))
                    .range([height, 0]);
            }
            return true;
        }
    }));

    // Add grey background lines for context
    background = svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(links)
        .enter().append("path")
        .attr("d", path);

    // Add blue foreground lines for focus
    foreground = svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(links)
        .enter().append("path")
        .attr("d", path);

    // Add a group element for each dimension
    const g = svg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", d => `translate(${x(d)})`);

    // Add an axis and title
    g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(d => d);

    // Add and store a brush for each axis
    g.append("g")
        .attr("class", "brush")
        .each(function(d) {
            d3.select(this).call(y[d].brush = d3.brushY()
                .extent([[-8, 0], [8, height]])
                .on("start", brushstart)
                .on("brush", brush)
                .on("end", brush));
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);

    function path(d) {
        return line(dimensions.map(p => [x(p), y[p](d[p])]));
    }

    function brushstart(event) {
        event.stopPropagation();
    }

    function brush(event) {
        const actives = [];
        svg.selectAll(".dimension .brush")
            .filter(function(d) {
                y[d].brushSelectionValue = d3.brushSelection(this);
                return y[d].brushSelectionValue;
            })
            .each(function(d) {
                actives.push({
                    dimension: d,
                    extent: y[d].brushSelectionValue
                });
            });

        foreground.style("display", function(d) {
            return actives.every(active => {
                const dim = active.dimension;
                return active.extent[0] <= y[dim](d[dim]) && y[dim](d[dim]) <= active.extent[1];
            }) ? null : "none";
        });
    }
});
