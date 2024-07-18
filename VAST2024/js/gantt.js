d3.csv("MC1/mc1_data/relationships.csv").then(data => {
    // Prepare the data
    const parsedData = data.map(d => ({
        event: d.event,
        object: d.object,
        subject: d.subject,
        sentence: d.sentence,
        appearsInArticle: d.appears_in_article,
        appearsInKnowledgeGraph: d.appears_in_knowledge_graph,
        reference: d.reference,
        revision: d.revision,
        thread: d.thread,
        biasScore: +d.bias_score,
        algorithm: d.algorithm,
        analyst: d.analyst,
        timestamp: new Date(d.timestamp),
        company: d.reference.split('__')[0],
        journal: d.reference.split('__')[3],
        version: d.reference.split('__')[2]
    }));

    const companies = Array.from(new Set(parsedData.map(d => d.company)));
    const journals = Array.from(new Set(parsedData.map(d => d.journal)));
    const versions = ["0", "1", "2"]; // Define the versions

    // Set up dimensions and scales
    const margin = { top: 20, right: 20, bottom: 50, left: 150 };
    const container = document.querySelector('.chart-container');
    const width = container.clientWidth;
    const height = window.innerHeight * 3; // Increased height for more vertical space
    
    const x = d3.scaleTime()
        .domain(d3.extent(parsedData, d => d.timestamp))
        .range([margin.left, width - margin.right]);
    
    const yCompany = d3.scaleBand()
        .domain(companies)
        .range([margin.top, height - margin.bottom])
        .padding(0.2); // Increased padding for more vertical space

    const yJournal = d3.scaleBand()
        .domain(journals)
        .range([0, yCompany.bandwidth()])
        .padding(0.2); // Increased padding for more vertical space

    const color = d3.scaleSequential(d3.interpolateRdBu)
        .domain(d3.extent(parsedData, d => d.biasScore));

    // Create SVG
    const svg = d3.select("#ganttChartDiagram")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%d")));

    // Add y-axis for companies
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yCompany).tickFormat(d => d + " "));

    // Add Gantt chart rectangles and line plots for bias evolution
    companies.forEach(company => {
        const companyData = parsedData.filter(d => d.company === company);

        journals.forEach(journal => {
            const journalData = companyData.filter(d => d.journal === journal);
            const yOffset = yCompany(company) + yJournal(journal);

            versions.forEach(version => {
                const versionData = journalData.filter(d => d.version === version);
                
                if (versionData.length > 0) {
                    const minTimestamp = d3.min(versionData, d => d.timestamp);
                    const maxTimestamp = d3.max(versionData, d => d.timestamp);

                    // Draw Gantt rectangle
                    svg.append("rect")
                        .attr("x", x(minTimestamp))
                        .attr("y", yOffset)
                        .attr("width", x(maxTimestamp) - x(minTimestamp))
                        .attr("height", yJournal.bandwidth())
                        .attr("fill", "#f0f0f0")
                        .attr("stroke", "#ccc");

                    // Draw separation line within Gantt rectangle for versions
                    svg.append("line")
                        .attr("x1", x(minTimestamp))
                        .attr("x2", x(maxTimestamp))
                        .attr("y1", yOffset + yJournal.bandwidth() / 2)
                        .attr("y2", yOffset + yJournal.bandwidth() / 2)
                        .attr("stroke", "#999")
                        .attr("stroke-width", 1)
                        .attr("stroke-dasharray", "5,5");

                    // Draw bias evolution line plot
                    const line = d3.line()
                        .x(d => x(d.timestamp))
                        .y(d => yOffset + yJournal.bandwidth() / 2 - (d.biasScore * yJournal.bandwidth() / 2))
                        .curve(d3.curveMonotoneX);

                    svg.append("path")
                        .datum(versionData)
                        .attr("fill", "none")
                        .attr("stroke", d => color(d.biasScore))
                        .attr("stroke-width", 2)
                        .attr("d", line);
                }
            });
        });
    });

    // Add legend
    const legendWidth = 200;
    const legendHeight = 10;

    const lengthDifferenceLegend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - margin.right - legendWidth},${margin.top})`);

    const legendScale = d3.scaleLinear()
        .domain([d3.extent(parsedData, d => d.biasScore)[0], d3.extent(parsedData, d => d.biasScore)[1]])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d => d.toFixed(2));

    lengthDifferenceLegend.selectAll("rect")
        .data(d3.range(legendScale.domain()[0], legendScale.domain()[1], (legendScale.domain()[1] - legendScale.domain()[0]) / legendWidth))
        .enter().append("rect")
        .attr("x", (d, i) => i)
        .attr("y", 0)
        .attr("width", 1)
        .attr("height", legendHeight)
        .attr("fill", d => color(d));

    lengthDifferenceLegend.append("g")
        .attr("transform", `translate(0,${legendHeight})`)
        .call(legendAxis);
});
