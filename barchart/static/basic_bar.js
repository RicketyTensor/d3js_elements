function basicBarFunc(data) {
    // Set the dimensions of the svg
    var margin = {top: 30, right: 50, bottom: 20, left: 100};
    var svgWidth = 600;
    var svgHeight = 800;
    var graphWidth = svgWidth - margin.left - margin.right;
    var graphHeight = svgHeight - margin.top - margin.bottom;

    // Set up the svg canvas
    var svg = d3.select("#div_chart")
        .append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Get extreme values
    var minValue = Math.min.apply(Math, data.map(function (d) { return parseFloat(d.Value);}));
    var maxValue = Math.max.apply(Math, data.map(function (d) { return parseFloat(d.Value);}));
    
    // Setup color scale
    var color = d3.scaleSequential(d3.interpolateRainbow)
        .domain([minValue,maxValue])

    // Set up X-axis
    var x = d3.scaleLinear()  // horizontal bar chart
        .domain([0, maxValue])
        .range([0, graphWidth]);
    svg.append("g")
        .attr("transform", "translate(0" + svgHeight + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

    // Set up Y-axis
    var y = d3.scaleBand()
        // .domain(data.map(function(d) {return d.Category;}))
        .domain(data.map(d => d.Category))
        .range([0, graphHeight])
        .padding(.1);
    svg.append("g")
        .call(d3.axisLeft(y))

    // Bars
    svg.selectAll("barRect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", x(0))
        .attr("y", d => y(d.Category) )
        .attr("width", d => x(d.Value) )
        .attr("height", y.bandwidth())
        .attr("fill", d => color(d.Value) )

    // alert(data.map(function (d) { return parseFloat(d.Value);}));
}
