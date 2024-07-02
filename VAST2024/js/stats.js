
// // Load the mc1.json file and analyze the data
// d3.json("MC1/mc1_data/mc1.json").then(data => {
//     const links = data.links;
//     const nodes = data.nodes;

//     function analyzeAttributes(items) {
//         const attributeAnalysis = {};

//         items.forEach(item => {
//             Object.keys(item).forEach(attr => {
//                 if (!attributeAnalysis[attr]) {
//                     attributeAnalysis[attr] = new Set();
//                 }
//                 attributeAnalysis[attr].add(item[attr]);
//             });
//         });

//         // Convert the Sets to Arrays for easier readability
//         Object.keys(attributeAnalysis).forEach(attr => {
//             attributeAnalysis[attr] = Array.from(attributeAnalysis[attr]);
//         });

//         return attributeAnalysis;
//     }

//     const linkAttributes = analyzeAttributes(links);
//     const nodeAttributes = analyzeAttributes(nodes);

//     function logAnalysisResults(attributeAnalysis, itemType) {
//         console.log(`Analysis of ${itemType}:`);
//         Object.keys(attributeAnalysis).forEach(attr => {
//             const uniqueValues = attributeAnalysis[attr];
//             console.log(`Attribute: ${attr}`);
//             console.log(`Number of unique values: ${uniqueValues.length}`);
//             console.log(`Unique values: ${uniqueValues.join(', ')}`);
//             console.log('---------------------------------------');
//         });
//     }

//     logAnalysisResults(linkAttributes, "Links");
//     logAnalysisResults(nodeAttributes, "Nodes");
// }).catch(error => {
//     console.error("Error loading the JSON file:", error);
// });


d3.json("MC1/mc1_data/mc1.json").then(data => {
    const links = data.links;

    // Create an object to store counts of each entity
    const entityCounts = {};

    // Iterate through each link and count the occurrences of each entity
    links.forEach(link => {
        const entity = link._last_edited_by;
        if (entityCounts[entity]) {
            entityCounts[entity]++;
        } else {
            entityCounts[entity] = 1;
        }
    });

    // Log the entity counts
    console.log(entityCounts);

    // Optionally, convert the counts to an array and log
    const entityCountsArray = Object.entries(entityCounts).map(([entity, count]) => ({ entity, count }));
    console.log(entityCountsArray);
}).catch(error => console.error("Error loading mc1.json data:", error));
