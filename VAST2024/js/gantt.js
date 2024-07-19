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
    const versions = ["0", "1"]; // Define the versions

    // Set up dimensions and scales
    const margin = { top: 50, right: 20, bottom: 50, left: 150 };
    const container = document.querySelector('.chart-container');
    const width = window.innerWidth; // Set width to the monitor's width
    const height = window.innerHeight * 6; // Increased height for more vertical space

    const x = d3.scaleTime()
        .domain(d3.extent(parsedData, d => d.timestamp))
        .range([margin.left, width - margin.right]);

    const yCompany = d3.scaleBand()
        .domain(companies)
        .range([margin.top, height - margin.bottom])
        .paddingInner(0.2) // Adjusted inner padding
        .paddingOuter(0.2); // Adjusted outer padding

    const yJournal = d3.scaleBand()
        .domain(journals)
        .range([0, yCompany.bandwidth()])
        .paddingInner(0.2) // Adjusted inner padding
        .paddingOuter(0.2); // Adjusted outer padding

    const color = d3.scaleOrdinal()
        .domain(versions)
        .range(["#55AD9B", "#D8EFD3"]);

    const yBias = d3.scaleLinear()
        .domain([-1, 1]) // Assuming bias scores range from -1 to 1
        .range([yJournal.bandwidth() * 2, 0]); // Increased range for larger plots

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

    // Add area chart for bias evolution
    companies.forEach(company => {
        const companyData = parsedData.filter(d => d.company === company);
        const yOffsetCompany = yCompany(company);

        journals.forEach(journal => {
            const journalData = companyData.filter(d => d.journal === journal);
            const yOffsetJournal = yOffsetCompany + yJournal(journal);

            versions.forEach(version => {
                const versionData = journalData.filter(d => d.version === version);

                const area = d3.area()
                    .x(d => x(d.timestamp))
                    .y0(yOffsetJournal + yBias(0))
                    .y1(d => yOffsetJournal + yBias(d.biasScore))
                    .curve(d3.curveMonotoneX);

                svg.append("path")
                    .datum(versionData)
                    .attr("fill", color(version))
                    .attr("fill-opacity", 0.5)
                    .attr("stroke", "none")
                    .attr("d", area);
            });
        });
    });

    // Add legend
    const legendWidth = 200;
    const legendHeight = 20;

    const lengthDifferenceLegend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - margin.right - legendWidth},${margin.top})`);

    const legendScale = d3.scaleLinear()
        .domain([-1, 1]) // Assuming bias scores range from -1 to 1
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d => d.toFixed(2));

    lengthDifferenceLegend.selectAll("rect")
        .data(d3.range(-1, 1, 2 / legendWidth))
        .enter().append("rect")
        .attr("x", (d, i) => i)
        .attr("y", 0)
        .attr("width", 1)
        .attr("height", legendHeight)
        .attr("fill", d => color(d > 0 ? "1" : "0"));

    lengthDifferenceLegend.append("g")
        .attr("transform", `translate(0,${legendHeight})`)
        .call(legendAxis);
});
