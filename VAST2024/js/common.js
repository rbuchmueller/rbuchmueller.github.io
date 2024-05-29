// js/common.js

// Function to show the article text in the bottom view
function showArticleText(articleId) {
    d3.text(`MC1/mc1_data/articles/${articleId}.txt`).then(text => {
        d3.select("#bottomView").html(`<p>${text}</p>`);
    });
}

// Function to highlight a point
function highlightPoint(articleId) {
    d3.selectAll(".dot")
        .style("fill", function(d) {
            return d.article_id === articleId ? "orange" : "steelblue";
        });
}
