function basicTreeFunc(data) {
    // Set the dimensions of the svg
    var margin = {top: 30, right: 50, bottom: 30, left: 50};
    var svgWidth = 600;
    var svgHeight = 800;
    var graphWidth = svgWidth - margin.left - margin.right;
    var graphHeight = svgHeight - margin.top - margin.bottom;

    // Set up the svg canvas
    var svg = d3.select("#div_treeview")
        .append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Feed data to the hierarchy
    var root = d3.hierarchy(data).sum(function(d){ return d.value});  // size of a square is given by the value

    // Let d3 compute and prepare the treeview
    d3.treemap()
        .size([graphWidth, graphHeight])
        .paddingTop(28)
        .paddingRight(2)
        .paddingInner(2)      // Padding between each rectangle
        //.paddingOuter(6)
        //.padding(20)
        (root)

    // prepare a color scale
    var color = d3.scaleOrdinal()
        .domain(["Preproc", "Solver", "Post"])
        .range([ "#2a52be", "#a52a2a", "#006b3c"])

    // Add rectangles
    svg
        .selectAll("rect")
        .data(root.leaves())
        .enter()
        .append("rect")
            .attr('x', function (d) { return d.x0; })
            .attr('y', function (d) { return d.y0; })
            .attr('width', function (d) { return d.x1 - d.x0; })
            .attr('height', function (d) { return d.y1 - d.y0; })
            .style("stroke", "black")
            .style("fill", function(d){ return color(d.parent.data.name)} )

    // Add the name labels
    svg
        .selectAll("text")
        .data(root.leaves())
        .enter()
        .append("text")
            .attr("x", function(d){ return d.x0 + 5})   // +10 to adjust position (more right)
            .attr("y", function(d){ return d.y0 + 20})  // +20 to adjust position (lower)
            .text(function(d){ return d.data.name })
            .attr("font-size", "10px")
            .attr("fill", "white")

    // Add the value labels
    svg
    .selectAll("vals")
    .data(root.leaves())
    .enter()
    .append("text")
        .attr("x", function(d){ return d.x0 + 5})    // +10 to adjust position (more right)
        .attr("y", function(d){ return d.y0 + 35})    // +20 to adjust position (lower)
        .text(function(d){ return d.data.value })
        .attr("font-size", "11px")
        .attr("fill", "white")

    // Add title for the 3 groups
    svg
    .selectAll("titles")
    .data(root.descendants().filter(function(d){return d.depth==1}))
    .enter()
    .append("text")
        .attr("x", function(d){ return d.x0})
        .attr("y", function(d){ return d.y0+21})
        .text(function(d){ return d.data.name })
        .attr("font-size", "19px")
        .attr("fill",  function(d){ return color(d.data.name)} )
        
    //alert(data.name);
}
