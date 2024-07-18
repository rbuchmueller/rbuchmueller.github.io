// Function to extract company names from filenames
function extractCompanyNamesFromFilenames(filenames) {
    const companySet = new Set();

    filenames.forEach(filename => {
        const companyName = filename.split('_')[0];
        companySet.add(companyName);
    });

    return Array.from(companySet);
}

// Function to show article text when hovering over a point
async function showArticleText(articleId) {
    try {
        const response = await fetch(`MC1/mc1_data/articles/${articleId}.txt`);
        const text = await response.text();
        d3.select("#articleText").text(text);
    } catch (error) {
        console.error("Error fetching article text:", error);
    }
}

// Load the article filenames and create bar charts
fetch('MC1/mc1_data/articles/')
    .then(response => response.text())
    .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const filenames = Array.from(doc.querySelectorAll('a'))
            .map(a => a.href.split('/').pop())
            .filter(filename => filename.endsWith('.txt'));
        d3.json("MC1/mc1_data/mc1.json").then(data => {
            const nodes = data.nodes;
            const links = data.links;
            // Count the number of times each document is involved in the links
            const docCounts = extractDocCountsFromLinks(filenames, links);
            createStackedBarCharts(filenames, docCounts, links, nodes); // Pass links here
        }).catch(error => console.error("Error loading mc1.json data:", error));
    })
    .catch(error => console.error("Error loading article filenames:", error));

    function createStackedBarCharts(filenames, docCounts, links, nodes) {
        // Prepare data for the stacked bar chart, excluding _Police journals
        const companies = Object.keys(docCounts);
        const journals = Array.from(new Set(Object.values(docCounts)
            .flatMap(d => Object.keys(d))
            .filter(journal => !journal.includes('_Police'))));
        const versions = ["0", "1"]; // Explicitly define versions 0 and 1
    
        const chartData = companies.map(company => {
            return {
                company,
                journals: journals.map(journal => {
                    const totalMentions = versions.reduce((acc, version) => acc + (docCounts[company][journal].versions[version] || 0), 0);
                    return {
                        journal,
                        totalMentions,
                        counts: versions.map(version => ({
                            version,
                            count: docCounts[company][journal] ? (docCounts[company][journal].versions[version] || 0) : 0,
                            articleId: `${company}__0__${version}__${journal}`
                        })),
                        types: docCounts[company][journal].types,
                        editors: docCounts[company][journal].editors,
                        algorithms: docCounts[company][journal].algorithms
                    };
                })
            };
        });
    
        // Set up dimensions and scales for bar chart
        const container = document.querySelector('.chart-container');
        const width = container.clientWidth;
        const barChartHeight = window.innerHeight / 10; // Adjust the height of the bar chart
        const margin = { top: 5, right: 5, bottom: 1, left: 50 };
    
        const x0 = d3.scaleBand()
            .domain(companies)
            .range([margin.left, width - margin.right])
            .padding(0.2); // Increased padding for wider bars
    
        const x1 = d3.scaleBand()
            .domain(journals)
            .range([0, x0.bandwidth()])
            .padding(0.1); // Increased padding for wider bars
    
        const y = d3.scaleLinear()
            .domain([0, 200]) // Set maximum scale to 200
            .nice()
            .range([barChartHeight - margin.bottom, margin.top]);
    
        const color = d3.scaleOrdinal()
            .domain(versions)
            .range(["#55AD9B", "#D8EFD3"]);
    
        const barSvg = d3.select("#barCharts")
            .append("svg")
            .attr("width", width)
            .attr("height", barChartHeight);
    
        // Add y-axis
        barSvg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(10));
    
        // Add bars
        const barGroups = barSvg.selectAll(".bar-group")
            .data(chartData)
            .enter().append("g")
            .attr("class", "bar-group")
            .attr("id", d => `group-${d.company.replace(/\s+/g, '-')}`)
            .attr("transform", d => `translate(${x0(d.company)},0)`);
    
        // Function to show the filtered dot plot based on selected article
        function showFilteredDotPlot(articleId) {
            d3.json("MC1/mc1_data/mc1.json").then(data => {
                const links = data.links;
    
                // Filter links based on the selected article ID
                const filteredLinks = links.filter(link => link._articleid === articleId);
    
                // Get unique entities involved in the filtered links
                const entities = Array.from(new Set(filteredLinks.flatMap(link => [link.source, link.target])));
    
                // Create a map to store node positions on the y-axis
                const nodeYPositions = new Map(entities.map((id, index) => [id, index]));
    
                // Parse dates and sort links by date
                filteredLinks.forEach(link => {
                    link.date = new Date(link._date_added);
                });
                filteredLinks.sort((a, b) => a.date - b.date);
    
                // Set up dimensions and scales for the dot plot
                const container = document.querySelector('.chart-container');
                const width = container.clientWidth;
                const height = window.innerHeight / 2;
                const margin = { top: 20, right: 20, bottom: 50, left: 100 };
    
                const x = d3.scaleTime()
                    .domain(d3.extent(filteredLinks, d => d.date))
                    .range([margin.left, width - margin.right]);
    
                const y = d3.scaleBand()
                    .domain(entities)
                    .range([margin.top, height - margin.bottom])
                    .padding(0.1);
    
                const color = d3.scaleOrdinal(d3.schemeCategory10);
    
                // Remove the existing dot plot
                d3.select("#dotPlotDiagram").selectAll("*").remove();
    
                const svg = d3.select("#dotPlotDiagram")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .style("display", "block")
                    .style("margin", "auto");
    
                // Add x-axis
                svg.append("g")
                    .attr("transform", `translate(0,${height - margin.bottom})`)
                    .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%d")));
    
                // Add y-axis with full names
                svg.append("g")
                    .attr("transform", `translate(${margin.left},0)`)
                    .call(d3.axisLeft(y).tickFormat(d => d + " "));
    
                // Add lines for each node
                svg.selectAll(".node-line")
                    .data(entities)
                    .enter().append("line")
                    .attr("class", "node-line")
                    .attr("x1", margin.left)
                    .attr("x2", width - margin.right)
                    .attr("y1", d => y(d) + y.bandwidth() / 2)
                    .attr("y2", d => y(d) + y.bandwidth() / 2)
                    .attr("stroke", "#ccc");
    
                // Add vertical lines for each link
                svg.selectAll(".link-line")
                    .data(filteredLinks)
                    .enter().append("line")
                    .attr("class", "link-line")
                    .attr("x1", d => x(d.date))
                    .attr("x2", d => x(d.date))
                    .attr("y1", d => y(d.source) + y.bandwidth() / 2)
                    .attr("y2", d => y(d.target) + y.bandwidth() / 2)
                    .attr("stroke", "#888");
    
                // Add symbols for each link's source
                svg.selectAll(".link-symbol-source")
                    .data(filteredLinks)
                    .enter().append("circle")
                    .attr("class", "link-symbol-source")
                    .attr("cx", d => x(d.date))
                    .attr("cy", d => y(d.source) + y.bandwidth() / 2)
                    .attr("r", 5)
                    .attr("fill", d => color(d._algorithm))
                    .on("mouseover", function (event, d) {
                        d3.select(this).attr("stroke", "orange");
                        showArticleText(d._articleid);
                        const tooltip = d3.select("body").append("div")
                            .attr("class", "tooltip")
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 10) + "px")
                            .style("display", "block")
                            .html(`Source: ${d.source}<br>Target: ${d.target}<br>Date: ${d3.timeFormat("%Y-%m-%d")(d.date)}`);
                    })
                    .on("mousemove", function (event) {
                        d3.select(".tooltip")
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 10) + "px");
                    })
                    .on("mouseout", function () {
                        d3.select(".tooltip").remove();
                        d3.select(this).attr("stroke", null);
                    });
    
                // Add symbols for each link's target
                svg.selectAll(".link-symbol-target")
                    .data(filteredLinks)
                    .enter().append("circle")
                    .attr("class", "link-symbol-target")
                    .attr("cx", d => x(d.date))
                    .attr("cy", d => y(d.target) + y.bandwidth() / 2)
                    .attr("r", 5)
                    .attr("fill", d => color(d._algorithm))
                    .on("mouseover", function (event, d) {
                        d3.select(this).attr("stroke", "orange");
                        showArticleText(d._articleid);
                        const tooltip = d3.select("body").append("div")
                            .attr("class", "tooltip show")
                            .style("left", `${event.pageX + 10}px`)
                            .style("top", `${event.pageY - 10}px`)
                            .html(`Source: ${d.source}<br>Target: ${d.target}<br>Date: ${d3.timeFormat("%Y-%m-%d")(d.date)}`);
                    })
                    .on("mousemove", function (event) {
                        d3.select(".tooltip")
                            .style("left", `${event.pageX + 10}px`)
                            .style("top", `${event.pageY - 10}px`);
                    })
                    .on("mouseout", function () {
                        d3.select(".tooltip").attr("class", "tooltip hidden").transition().delay(300).remove();
                        d3.select(this).attr("stroke", null);
                    });
    
    
                // Handle window resize
                window.addEventListener('resize', () => {
                    const newWidth = container.clientWidth;
                    const newHeight = window.innerHeight / 2;
    
                    svg.attr("width", newWidth).attr("height", newHeight);
    
                    x.range([margin.left, newWidth - margin.right]);
                    y.range([margin.top, newHeight - margin.bottom]);
    
                    svg.select(".x-axis")
                        .attr("transform", `translate(0,${newHeight - margin.bottom})`)
                        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%d")));
    
                    svg.select(".y-axis")
                        .attr("transform", `translate(${margin.left},0)`)
                        .call(d3.axisLeft(y).tickFormat(d => d + " "));
    
                    svg.selectAll(".node-line")
                        .attr("x2", newWidth - margin.right)
                        .attr("y1", d => y(d) + y.bandwidth() / 2)
                        .attr("y2", d => y(d) + y.bandwidth() / 2);
    
                    svg.selectAll(".link-line")
                        .attr("x1", d => x(d.date))
                        .attr("x2", d => x(d.date))
                        .attr("y1", d => y(d.source) + y.bandwidth() / 2)
                        .attr("y2", d => y(d.target) + y.bandwidth() / 2);
    
                    svg.selectAll(".link-symbol-source")
                        .attr("cx", d => x(d.date))
                        .attr("cy", d => y(d.source) + y.bandwidth() / 2);
    
                    svg.selectAll(".link-symbol-target")
                        .attr("cx", d => x(d.date))
                        .attr("cy", d => y(d.target) + y.bandwidth() / 2);
                });
            }).catch(error => console.error("Error loading mc1.json data:", error));
        }
    
        // Update the bar chart event to call showFilteredDotPlot on click
        barGroups.selectAll(".bar")
            .data(d => d.journals.flatMap(j => j.counts.map(c => ({ ...c, journal: j.journal }))))
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x1(d.journal))
            .attr("y", d => y(d.count))
            .attr("width", x1.bandwidth())
            .attr("height", d => y(0) - y(d.count))
            .attr("fill", d => color(d.version))
            .on("mouseover", function (event, d) {
                const tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("position", "absolute")
                    .style("background-color", "white")
                    .style("border", "solid")
                    .style("border-width", "1px")
                    .style("border-radius", "5px")
                    .style("padding", "5px")
                    .style("pointer-events", "none")
                    .html(`File: ${d.articleId}`);
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px")
                    .style("display", "block");
                showArticleText(d.articleId);
            })
            .on("mousemove", function (event) {
                d3.select(".tooltip")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function () {
                d3.select(".tooltip").remove();
            })
            .on("click", function (event, d) {
                showFilteredDotPlot(d.articleId);
            });
    
        // Add legend
        const legend = barSvg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - margin.right - 100},${margin.top})`);
    
        versions.forEach((version, i) => {
            legend.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 18)
                .attr("height", 18)
                .attr("fill", color(version));
    
            legend.append("text")
                .attr("x", 24)
                .attr("y", i * 20 + 9)
                .attr("dy", "0.35em")
                .text(`Version ${version}`);
        });
     // Add sentiment matrix
     d3.json("MC1/mc1_data/analysis_results.json").then(sentimentData => {
        const sentimentChartHeight = window.innerHeight / 15;
        const sentimentMatrixSvg = d3.select("#sentimentMatrixDiagram")
            .append("svg")
            .attr("width", width)
            .attr("height", sentimentChartHeight);

            
        const sentimentMatrixData = companies.flatMap(company =>
            journals.flatMap(journal =>
                versions.map(version => ({
                    company,
                    journal,
                    version,
                    sentiment: sentimentData[`${company}__0__${version}__${journal}.txt`] ? sentimentData[`${company}__0__${version}__${journal}.txt`].sentiment : null,
                    articleId: `${company}__0__${version}__${journal}`
                }))
            )
        );



        const sentimentValues = sentimentMatrixData.map(d => d.sentiment).filter(d => d !== null);
        const sentimentMin = d3.min(sentimentValues);
        const sentimentMax = d3.max(sentimentValues);

        const sentimentColor = d3.scaleSequential()
            .domain([sentimentMin, sentimentMax])
            .interpolator(d3.interpolateRdBu);

        const yMatrix = d3.scaleBand()
            .domain(versions)
            .range([margin.top, sentimentChartHeight - margin.bottom])
            .padding(0.2);
        // Add y-axis for versions with custom labels
        sentimentMatrixSvg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yMatrix).tickFormat(d => `Sentiment Version ${d}`).tickSize(0));

        sentimentMatrixSvg.append("g")
            .selectAll(".row")
            .data(sentimentMatrixData)
            .enter().append("g")
            .attr("class", "row")
            .attr("transform", d => `translate(${x0(d.company)},0)`) // Align rows by company
            .selectAll(".cell")
            .data(d => [d])
            .enter().append("rect")
            .attr("class", "cell")
            .attr("x", d => x1(d.journal)) // Align cells by journal within the company
            .attr("y", d => yMatrix(d.version))
            .attr("width", x1.bandwidth())
            .attr("height", yMatrix.bandwidth())
            .attr("fill", d => d.sentiment !== null ? sentimentColor(d.sentiment) : "none")
            .attr("stroke", "#ccc")
            .on("mouseover", function (event, d) {
                const tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip show")
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`)
                    .html(`Sentiment: ${d.sentiment !== null ? d.sentiment.toFixed(2) : "N/A"}<br>File: ${d.articleId}`);
            })
            .on("mousemove", function (event) {
                d3.select(".tooltip")
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`);
            })
            .on("mouseout", function () {
                d3.select(".tooltip").remove();
            });

        sentimentMatrixSvg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yMatrix).tickSize(0));
            const lengthDifferenceChartHeight = window.innerHeight / 15;
            const lengthDifferenceMatrixSvg = d3.select("#lengthDifferenceMatrixDiagram")
                .append("svg")
                .attr("width", width)
                .attr("height", lengthDifferenceChartHeight);
            
            const lengthDifferenceMatrixData = companies.flatMap(company =>
                journals.map(journal => {
                    const version0 = sentimentData[`${company}__0__0__${journal}.txt`];
                    const version1 = sentimentData[`${company}__0__1__${journal}.txt`];
                    
                    const length0 = version0 ? version0.length : null;
                    const length1 = version1 ? version1.length : null;
            
                    const proportionDiff1 = length0 && length1 ? ((length1 - length0) / length0) * 100 : null;
            
                    return [
                        { company, journal, version: '0-1', proportionDiff: proportionDiff1, articleId: `${company}__0__0__${journal}` }
                    ];
                }).flat()
            );
            
            const proportionDiffValues = lengthDifferenceMatrixData.map(d => d.proportionDiff).filter(d => d !== null);
            const proportionDiffMin = d3.min(proportionDiffValues);
            const proportionDiffMax = d3.max(proportionDiffValues);
            
            const lengthDifferenceColor = d3.scaleSequential()
                .domain([proportionDiffMin, proportionDiffMax])
                .interpolator(d3.interpolateRdBu);
            
            const lengthYMatrix = d3.scaleBand()
                .domain(['0-1'])
                .range([margin.top, lengthDifferenceChartHeight - margin.bottom])
                .padding(0.2);
            
            // Add y-axis for versions with custom labels
            lengthDifferenceMatrixSvg.append("g")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(lengthYMatrix).tickFormat(d => `Length Difference ${d}`).tickSize(0));
            
            lengthDifferenceMatrixSvg.append("g")
                .selectAll(".row")
                .data(lengthDifferenceMatrixData)
                .enter().append("g")
                .attr("class", "row")
                .attr("transform", d => `translate(${x0(d.company)},0)`) // Align rows by company
                .selectAll(".cell")
                .data(d => [d])
                .enter().append("rect")
                .attr("class", "cell")
                .attr("x", d => x1(d.journal)) // Align cells by journal within the company
                .attr("y", d => lengthYMatrix(d.version))
                .attr("width", x1.bandwidth())
                .attr("height", lengthYMatrix.bandwidth())
                .attr("fill", d => d.proportionDiff !== null ? lengthDifferenceColor(d.proportionDiff) : "none")
                .attr("stroke", "#ccc")
                .on("mouseover", function (event, d) {
                    const tooltip = d3.select("body").append("div")
                        .attr("class", "tooltip show")
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 10}px`)
                        .html(`Length Difference: ${d.proportionDiff !== null ? d.proportionDiff.toFixed(2) + "%" : "N/A"}<br>File: ${d.articleId}`);
                })
                .on("mousemove", function (event) {
                    d3.select(".tooltip")
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 10}px`);
                })
                .on("mouseout", function () {
                    d3.select(".tooltip").remove();
                });
            
            lengthDifferenceMatrixSvg.append("g")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(lengthYMatrix).tickSize(0));
            
            // Add legend for length difference matrix
            const legendWidth = 200;
            const legendHeight = 10;
            
            const lengthDifferenceLegend = lengthDifferenceMatrixSvg.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${width - margin.right - legendWidth},${margin.top})`);
            
            const legendScale = d3.scaleLinear()
                .domain([proportionDiffMin, proportionDiffMax])
                .range([0, legendWidth]);
            
            const legendAxis = d3.axisBottom(legendScale)
                .ticks(5)
                .tickFormat(d => d + "%");
            
            lengthDifferenceLegend.selectAll("rect")
                .data(d3.range(proportionDiffMin, proportionDiffMax, (proportionDiffMax - proportionDiffMin) / legendWidth))
                .enter().append("rect")
                .attr("x", (d, i) => i)
                .attr("y", 0)
                .attr("width", 1)
                .attr("height", legendHeight)
                .attr("fill", d => lengthDifferenceColor(d));
            
            lengthDifferenceLegend.append("g")
                .attr("transform", `translate(0,${legendHeight})`)
                .call(legendAxis);
            

    });



    
        // Prepare data for the types matrix
        const types = Array.from(new Set(Object.values(docCounts)
            .flatMap(company => Object.values(company))
            .flatMap(journal => Object.keys(journal.types))));
    
        const totalTypeCounts = companies.reduce((acc, company) => {
            journals.forEach(journal => {
                types.forEach(type => {
                    acc[type] = (acc[type] || 0) + (docCounts[company][journal].types[type] || 0);
                });
            });
            return acc;
        }, {});
    
        const typeMatrixData = companies.flatMap(company => 
            journals.flatMap(journal => 
                types.map(type => ({
                    company,
                    journal,
                    type,
                    count: docCounts[company][journal].types[type] || 0,
                    proportion: (docCounts[company][journal].types[type] || 0) / (totalTypeCounts[type] || 1),
                    articleId: `${company}__0__${type}__${journal}`
                }))
            )
        );
    
        const typeMatrixHeight = window.innerHeight / 10; // Adjust the height of the matrix
        const typeMatrixSvg = d3.select("#typeMatrixDiagram")
            .append("svg")
            .attr("width", width)
            .attr("height", typeMatrixHeight);
    
        // Add y-axis for types
        const typeMatrixY = d3.scaleBand()
            .domain(types)
            .range([margin.top, typeMatrixHeight - margin.bottom])
            .padding(0.2);
    
        typeMatrixSvg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(typeMatrixY).tickSize(0));
    
        // Define a color scale for proportions
        const typeMatrixColor = d3.scaleSequential(d3.interpolateReds)
            .domain([0, 0.04]);
    
        // Add cells to the type matrix
        typeMatrixSvg.append("g")
            .selectAll(".row")
            .data(typeMatrixData)
            .enter().append("g")
            .attr("class", "row")
            .attr("transform", d => `translate(${x0(d.company)},0)`) // Align rows by company
            .selectAll(".cell")
            .data(d => [d])
            .enter().append("rect")
            .attr("class", "cell")
            .attr("x", d => x1(d.journal)) // Align cells by journal within the company
            .attr("y", d => typeMatrixY(d.type))
            .attr("width", x1.bandwidth())
            .attr("height", typeMatrixY.bandwidth())
            .attr("fill", d => typeMatrixColor(d.proportion))
            .attr("stroke", "#ccc")
            .on("mouseover", function (event, d) {
                const tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip show")
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`)
                    .html(`Type: ${d.type}<br>Count: ${(d.count * 100).toFixed(2)}%<br>File: ${d.articleId}`);
            })
            .on("mousemove", function (event) {
                d3.select(".tooltip")
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`);
            })
            .on("mouseout", function () {
                d3.select(".tooltip").remove();
            });
    
        // Add y-axis for the type matrix
        typeMatrixSvg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(typeMatrixY).tickSize(0));
    
        // Prepare data for the editors matrix
        const editors = Array.from(new Set(Object.values(docCounts)
            .flatMap(company => Object.values(company))
            .flatMap(journal => Object.keys(journal.editors))));
    
        const totalEditorCounts = companies.reduce((acc, company) => {
            journals.forEach(journal => {
                editors.forEach(editor => {
                    acc[editor] = (acc[editor] || 0) + (docCounts[company][journal].editors[editor] || 0);
                });
            });
            return acc;
        }, {});
    
        const editorMatrixData = companies.flatMap(company => 
            journals.flatMap(journal => 
                editors.map(editor => ({
                    company,
                    journal,
                    editor,
                    count: docCounts[company][journal].editors[editor] || 0,
                    proportion: (docCounts[company][journal].editors[editor] || 0) / (totalEditorCounts[editor] || 1),
                    articleId: `${company}__0__${editor}__${journal}`
                }))
            )
        );
    
        const editorMatrixHeight = window.innerHeight / 10; // Adjust the height of the matrix
        const editorMatrixSvg = d3.select("#editorMatrixDiagram")
            .append("svg")
            .attr("width", width)
            .attr("height", editorMatrixHeight);
    
        // Add y-axis for editors
        const editorMatrixY = d3.scaleBand()
            .domain(editors)
            .range([margin.top, editorMatrixHeight - margin.bottom])
            .padding(0.2);
    
        editorMatrixSvg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(editorMatrixY).tickSize(0));
    
        // Define a color scale for proportions
        const editorMatrixColor = d3.scaleSequential(d3.interpolateReds)
            .domain([0, 0.04]);
    
        // Add cells to the editor matrix
        editorMatrixSvg.append("g")
            .selectAll(".row")
            .data(editorMatrixData)
            .enter().append("g")
            .attr("class", "row")
            .attr("transform", d => `translate(${x0(d.company)},0)`) // Align rows by company
            .selectAll(".cell")
            .data(d => [d])
            .enter().append("rect")
            .attr("class", "cell")
            .attr("x", d => x1(d.journal)) // Align cells by journal within the company
            .attr("y", d => editorMatrixY(d.editor))
            .attr("width", x1.bandwidth())
            .attr("height", editorMatrixY.bandwidth())
            .attr("fill", d => editorMatrixColor(d.proportion))
            .attr("stroke", "#ccc")
            .on("mouseover", function (event, d) {
                const tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip show")
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`)
                    .html(`Editor: ${d.editor}<br>Count: ${(d.count * 100).toFixed(2)}%<br>File: ${d.articleId}`);
            })
            .on("mousemove", function (event) {
                d3.select(".tooltip")
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`);
            })
            .on("mouseout", function () {
                d3.select(".tooltip").remove();
            });
    
        // Add y-axis for the editor matrix
        editorMatrixSvg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(editorMatrixY).tickSize(0));
    
        // Prepare data for the algorithms matrix
        const algorithms = Array.from(new Set(Object.values(docCounts)
            .flatMap(company => Object.values(company))
            .flatMap(journal => Object.keys(journal.algorithms))));
    
        const totalAlgorithmCounts = companies.reduce((acc, company) => {
            journals.forEach(journal => {
                algorithms.forEach(algorithm => {
                    acc[algorithm] = (acc[algorithm] || 0) + (docCounts[company][journal].algorithms[algorithm] || 0);
                });
            });
            return acc;
        }, {});
    
        const algorithmMatrixData = companies.flatMap(company => 
            journals.flatMap(journal => 
                algorithms.map(algorithm => ({
                    company,
                    journal,
                    algorithm,
                    count: docCounts[company][journal].algorithms[algorithm] || 0,
                    proportion: (docCounts[company][journal].algorithms[algorithm] || 0) / (totalAlgorithmCounts[algorithm] || 1),
                    articleId: `${company}__0__${algorithm}__${journal}`
                }))
            )
        );
    
        const algorithmMatrixHeight = window.innerHeight / 40; // Adjust the height of the matrix
        const algorithmMatrixSvg = d3.select("#algorithmMatrixDiagram")
            .append("svg")
            .attr("width", width)
            .attr("height", algorithmMatrixHeight);
    
        // Add y-axis for algorithms
        const algorithmMatrixY = d3.scaleBand()
            .domain(algorithms)
            .range([margin.top, algorithmMatrixHeight - margin.bottom])
            .padding(0.2);
    
        algorithmMatrixSvg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(algorithmMatrixY).tickSize(0));
    
        // Define a color scale for proportions
        const algorithmMatrixColor = d3.scaleSequential(d3.interpolateReds)
            .domain([0, 1]);
    
        // Add cells to the algorithm matrix
        algorithmMatrixSvg.append("g")
            .selectAll(".row")
            .data(algorithmMatrixData)
            .enter().append("g")
            .attr("class", "row")
            .attr("transform", d => `translate(${x0(d.company)},0)`) // Align rows by company
            .selectAll(".cell")
            .data(d => [d])
            .enter().append("rect")
            .attr("class", "cell")
            .attr("x", d => x1(d.journal)) // Align cells by journal within the company
            .attr("y", d => algorithmMatrixY(d.algorithm))
            .attr("width", x1.bandwidth())
            .attr("height", algorithmMatrixY.bandwidth())
            .attr("fill", d => algorithmMatrixColor(d.count))
            .attr("stroke", "#ccc")
            .on("mouseover", function (event, d) {
                const tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip show")
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 10}px`)
                    .html(`Algorithm: ${d.algorithm}<br>Count: ${(d.count * 100).toFixed(2)}%<br>File: ${d.articleId}`);
            })
            .on("mousemove", function (event) {
                d3.select(".tooltip")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function () {
                d3.select(".tooltip").remove();
            });
    
        // Add y-axis for the algorithm matrix
        algorithmMatrixSvg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(algorithmMatrixY).tickSize(0));
    
        // Source-Target Matrix
       console.log("stamp")
       const sourceTargetMatrixData = extractSourceTargetMatrixData(filenames, links, nodes);

       const sourceTargetMatrixHeight = window.innerHeight * 1.5; // Adjust the height of the matrix
       const groupedNodes = d3.group(sourceTargetMatrixData, d => d.nodeType);
       const allEntities = Array.from(groupedNodes.keys()).flatMap(type => groupedNodes.get(type).map(d => d.node));
       const allArticles = Array.from(new Set(sourceTargetMatrixData.map(d => d.articleId)));
       const maxProportion = d3.max(sourceTargetMatrixData, d => d.proportion);
       
       const x0Matrix = d3.scaleBand()
           .domain(allArticles)
           .range([margin.left, width - margin.right])
           .padding(0.2);
       
       const yMatrix = d3.scaleBand()
           .domain(allEntities)
           .range([margin.top, sourceTargetMatrixHeight - margin.bottom])
           .padding(0.2);
       
       const sourceTargetColor = d3.scaleSequential(d3.interpolateReds)
           .domain([0, maxProportion]);
       
       const sourceTargetMatrixSvg = d3.select("#sourceTargetMatrixDiagram")
           .append("svg")
           .attr("width", width)
           .attr("height", sourceTargetMatrixHeight);
       
       // Add y-axis for nodes
       sourceTargetMatrixSvg.append("g")
           .attr("transform", `translate(${margin.left},0)`)
           .call(d3.axisLeft(yMatrix).tickSize(0));
       
       // Add cells to the source-target matrix
       sourceTargetMatrixSvg.append("g")
           .selectAll(".row")
           .data(sourceTargetMatrixData)
           .enter().append("g")
           .attr("class", "row")
           .attr("transform", d => `translate(${x0Matrix(d.articleId)},0)`) // Align rows by articleId
           .selectAll(".cell")
           .data(d => [d])
           .enter().append("rect")
           .attr("class", "cell")
           .attr("x", d => x0Matrix(d.articleId))
           .attr("y", d => yMatrix(d.node))
           .attr("width", x0Matrix.bandwidth())
           .attr("height", yMatrix.bandwidth())
           .attr("fill", d => d.proportion > 0 ? sourceTargetColor(d.proportion) : "none")
           .attr("stroke", "#ccc")
           .on("mouseover", function (event, d) {
               const tooltip = d3.select("body").append("div")
                   .attr("class", "tooltip show")
                   .style("left", `${event.pageX + 10}px`)
                   .style("top", `${event.pageY - 10}px`)
                   .html(`Node: ${d.node}<br>Count: ${(d.count)}<br>Proportion: ${(d.proportion * 100).toFixed(2)}%<br>File: ${d.articleId}`);
           })
           .on("mousemove", function (event) {
               d3.select(".tooltip")
                   .style("left", `${event.pageX + 10}px`)
                   .style("top", `${event.pageY - 10}px`);
           })
           .on("mouseout", function () {
               d3.select(".tooltip").remove();
           });
       
       // Add vertical gaps between node groups
       const groupGapSize = 0.1; // Size of the gap between groups
       const groupedYMatrix = d3.scaleBand()
           .domain(Array.from(groupedNodes.keys()))
           .range([margin.top, sourceTargetMatrixHeight - margin.bottom])
           .padding(groupGapSize);
       
       sourceTargetMatrixSvg.append("g")
           .selectAll(".group-gap")
           .data(Array.from(groupedNodes.keys()))
           .enter().append("line")
           .attr("class", "group-gap")
           .attr("x1", margin.left)
           .attr("x2", width - margin.right)
           .attr("y1", d => groupedYMatrix(d) + groupedYMatrix.bandwidth())
           .attr("y2", d => groupedYMatrix(d) + groupedYMatrix.bandwidth())
           .attr("stroke", "#000")
           .attr("stroke-width", 1);
       
    // Add y-axis for the source-target matrix
    sourceTargetMatrixSvg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yMatrix).tickSize(0));

    }
    
    function extractSourceTargetMatrixData(filenames, links, nodes) {
        const sourceTargetCounts = {};
        const allJournals = ['Haacklee Herald', 'Lomark Daily', 'The News Buoy']; // List of all possible journals
    
        // Initialize counts for all filenames
        filenames.forEach(filename => {
            const decodedFilename = decodeURIComponent(filename.replace('.txt', ''));
            const parts = decodedFilename.split('__');
            const companyName = parts[0];
            const journal = parts[3];
    
            if (!sourceTargetCounts[companyName]) {
                sourceTargetCounts[companyName] = {};
                allJournals.forEach(j => {
                    sourceTargetCounts[companyName][j] = {};
                });
            }
    
            if (!sourceTargetCounts[companyName][journal]) {
                sourceTargetCounts[companyName][journal] = {};
            }
        });
    
        // Accumulate node counts for each article
        links.forEach(link => {
            const linkFilename = decodeURIComponent(link._articleid);
            const parts = linkFilename.split('__');
            const companyName = parts[0];
            const journal = parts[3];
            const articleKey = `${companyName}__${journal}`;
    
            if (sourceTargetCounts[companyName] && sourceTargetCounts[companyName][journal]) {
                if (!sourceTargetCounts[companyName][journal][articleKey]) {
                    sourceTargetCounts[companyName][journal][articleKey] = {
                        nodes: {},
                        totalNodes: 0
                    };
                }
    
                if (link.source !== companyName) {
                    sourceTargetCounts[companyName][journal][articleKey].totalNodes++;
                    if (!sourceTargetCounts[companyName][journal][articleKey].nodes[link.source]) {
                        sourceTargetCounts[companyName][journal][articleKey].nodes[link.source] = 0;
                    }
                    sourceTargetCounts[companyName][journal][articleKey].nodes[link.source]++;
                }
    
                if (link.target !== companyName) {
                    sourceTargetCounts[companyName][journal][articleKey].totalNodes++;
                    if (!sourceTargetCounts[companyName][journal][articleKey].nodes[link.target]) {
                        sourceTargetCounts[companyName][journal][articleKey].nodes[link.target] = 0;
                    }
                    sourceTargetCounts[companyName][journal][articleKey].nodes[link.target]++;
                }
            }
        });
    
        // Ensure all nodes are present in the node list
        nodes.forEach(node => {
            const nodeId = node.id;
            for (const company in sourceTargetCounts) {
                for (const journal in sourceTargetCounts[company]) {
                    for (const articleKey in sourceTargetCounts[company][journal]) {
                        if (!sourceTargetCounts[company][journal][articleKey].nodes[nodeId]) {
                            sourceTargetCounts[company][journal][articleKey].nodes[nodeId] = 0;
                        }
                    }
                }
            }
        });
    
        // Prepare data for the source-target matrix
        const sourceTargetMatrixData = [];
        for (const company in sourceTargetCounts) {
            for (const journal in sourceTargetCounts[company]) {
                for (const articleId in sourceTargetCounts[company][journal]) {
                    const articleData = sourceTargetCounts[company][journal][articleId];
                    for (const node in articleData.nodes) {
                        if (node !== company && articleData.nodes[node] > 0) { // Exclude the node that is the same name as the company and zero counts
                            sourceTargetMatrixData.push({
                                articleId,
                                company,
                                journal,
                                node,
                                count: articleData.nodes[node],
                                proportion: articleData.nodes[node] / articleData.totalNodes,
                                nodeType: nodes.find(n => n.id === node).type // Include node type
                            });
                        }
                    }
                }
            }
        }
    
        return sourceTargetMatrixData;
    }
    
    
    
// Helper functions
async function loadSentimentData(filePath) {
    const response = await fetch(filePath);
    const data = await response.json();
    return data;
}

function getMinMaxSentiment(sentimentData) {
    const sentimentScores = Object.values(sentimentData).map(d => d.sentiment);
    const minSentiment = Math.min(...sentimentScores);
    const maxSentiment = Math.max(...sentimentScores);
    return { minSentiment, maxSentiment };
}

function prepareSentimentMatrixData(sentimentData) {
    const matrixData = [];
    const versions = ["0", "1", "2"];
    const allArticles = Object.keys(sentimentData);

    allArticles.forEach(articleId => {
        const parts = articleId.split('__');
        const companyName = parts[0];
        const version = parts[2];
        const journal = parts[3].replace('.txt', '');

        matrixData.push({
            articleId,
            companyName,
            version,
            journal,
            sentiment: sentimentData[articleId].sentiment,
        });
    });

    return matrixData;
}


function extractDocCountsFromLinks(filenames, links) {
    const docCounts = {};
    const allJournals = ['Haacklee Herald', 'Lomark Daily', 'The News Buoy']; // List of all possible journals

    filenames.forEach(filename => {
        const decodedFilename = decodeURIComponent(filename.replace('.txt', ''));
        const parts = decodedFilename.split('__');
        const companyName = parts[0];
        const version = parts[2];
        const journal = parts[3];

        if (!docCounts[companyName]) {
            docCounts[companyName] = {};
            // Initialize all possible journals for this company
            allJournals.forEach(j => {
                docCounts[companyName][j] = {
                    versions: { "0": 0, "1": 0 },
                    types: {},
                    editors: {},
                    algorithms: {}
                };
            });
        }

        if (!docCounts[companyName][journal]) {
            docCounts[companyName][journal] = {
                versions: { "0": 0, "1": 0 },
                types: {},
                editors: {},
                algorithms: {}
            };
        }

        // Summing up versions 0 and 1 together
        const matchingLinks = links.filter(link => {
            const linkFilename = decodeURIComponent(link._articleid);
            const linkParts = linkFilename.split('__');
            return linkParts[0] === companyName && linkParts[3] === journal;
        });

        // Accumulate counts for both versions
        matchingLinks.forEach(link => {
            const linkFilename = decodeURIComponent(link._articleid);
            const linkVersion = linkFilename.split('__')[2];

            docCounts[companyName][journal].versions[linkVersion]++;

            const type = link.type;
            const editor = link._last_edited_by;
            const algorithm = link._algorithm;

            if (!docCounts[companyName][journal].types[type]) {
                docCounts[companyName][journal].types[type] = 0;
            }
            docCounts[companyName][journal].types[type]++;

            if (!docCounts[companyName][journal].editors[editor]) {
                docCounts[companyName][journal].editors[editor] = 0;
            }
            docCounts[companyName][journal].editors[editor]++;

            if (!docCounts[companyName][journal].algorithms[algorithm]) {
                docCounts[companyName][journal].algorithms[algorithm] = 0;
            }
            docCounts[companyName][journal].algorithms[algorithm]++;
        });
    });

    // Calculate proportions for types, editors, and algorithms
    for (const company in docCounts) {
        for (const journal in docCounts[company]) {
            const totalMentions = Object.values(docCounts[company][journal].versions).reduce((a, b) => a + b, 0);

            for (const type in docCounts[company][journal].types) {
                docCounts[company][journal].types[type] /= totalMentions;
            }

            for (const editor in docCounts[company][journal].editors) {
                docCounts[company][journal].editors[editor] /= totalMentions;
            }

            for (const algorithm in docCounts[company][journal].algorithms) {
                docCounts[company][journal].algorithms[algorithm] /= totalMentions;
            }
        }
    }

    return docCounts;
}

// Load the mc1.json file and create the dot plot
d3.json("MC1/mc1_data/mc1.json").then(data => {
    const links = data.links;

    // Extract company names from filenames in the articles folder
    fetch('MC1/mc1_data/articles/')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const filenames = Array.from(doc.querySelectorAll('a'))
                .map(a => a.href.split('/').pop())
                .filter(filename => filename.endsWith('.txt'));

            const companyNames = extractCompanyNamesFromFilenames(filenames).map(str => str.replace(/%20/g, ' ')).map(str => str.replace(/%2C/g, ' '));

            // Filter links to include only those with source or target in the extracted company names
            const filteredLinks = links.filter(link =>
                companyNames.includes(link.source) && companyNames.includes(link.target)
            );

            // Create a map to store node positions on the y-axis
            const nodeYPositions = new Map(companyNames.map((id, index) => [id, index]));

            // Parse dates and sort links by date
            filteredLinks.forEach(link => {
                link.date = new Date(link._date_added);
            });
            filteredLinks.sort((a, b) => a.date - b.date);

            // Set up dimensions and scales for dot plot
            const container = document.querySelector('.chart-container');
            const width = container.clientWidth;
            const height = window.innerHeight / 2;
            const margin = { top: 20, right: 20, bottom: 50, left: 100 };

            const x = d3.scaleTime()
                .domain(d3.extent(filteredLinks, d => d.date))
                .range([margin.left, width - margin.right]);

            const y = d3.scaleBand()
                .domain(companyNames)
                .range([margin.top, height - margin.bottom])
                .padding(0.1);

            const color = d3.scaleOrdinal(d3.schemeCategory10);

            const svg = d3.select("#dotPlotDiagram")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .style("display", "block")
                .style("margin", "auto");

            // Add x-axis
            svg.append("g")
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%d")));

            // Add y-axis with full names
            svg.append("g")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(y).tickFormat(d => d + " "));

            // Add lines for each node
            svg.selectAll(".node-line")
                .data(companyNames)
                .enter().append("line")
                .attr("class", "node-line")
                .attr("x1", margin.left)
                .attr("x2", width - margin.right)
                .attr("y1", d => y(d) + y.bandwidth() / 2)
                .attr("y2", d => y(d) + y.bandwidth() / 2)
                .attr("stroke", "#ccc");

            // Add symbols for each link
            svg.selectAll(".link-symbol")
                .data(filteredLinks)
                .enter().append("circle")
                .attr("class", "link-symbol")
                .attr("cx", d => x(d.date))
                .attr("cy", d => y(d.source) + y.bandwidth() / 2)
                .attr("r", 5)
                .attr("fill", d => color(d._algorithm))
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("stroke", "orange");
                    showArticleText(d._articleid);
                    const tooltip = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px")
                        .style("display", "block")
                        .html(`Source: ${d.source}<br>Target: ${d.target}<br>Date: ${d3.timeFormat("%Y-%m-%d")(d.date)}`);
                })
                .on("mousemove", function (event) {
                    d3.select(".tooltip")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", function () {
                    d3.select(".tooltip").remove();
                    d3.select(this).attr("stroke", null);
                });

            // Handle window resize
            window.addEventListener('resize', () => {
                const newWidth = container.clientWidth;
                const newHeight = window.innerHeight / 2;

                svg.attr("width", newWidth).attr("height", newHeight);

                x.range([margin.left, newWidth - margin.right]);
                y.range([margin.top, newHeight - margin.bottom]);

                svg.select(".x-axis")
                    .attr("transform", `translate(0,${newHeight - margin.bottom})`)
                    .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%d")));

                svg.select(".y-axis")
                    .attr("transform", `translate(${margin.left},0)`)
                    .call(d3.axisLeft(y).tickFormat(d => d + " "));

                svg.selectAll(".node-line")
                    .attr("x2", newWidth - margin.right)
                    .attr("y1", d => y(d) + y.bandwidth() / 2)
                    .attr("y2", d => y(d) + y.bandwidth() / 2);

                svg.selectAll(".link-symbol")
                    .attr("cx", d => x(d.date))
                    .attr("cy", d => y(d.source) + y.bandwidth() / 2);
            });
        })
        .catch(error => console.error("Error loading article filenames:", error));
});
