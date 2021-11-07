function zoomDonutFunc(data) {
    // Basic size information
    var margin = {top: 10, right: 10, bottom: 10, left: 10};
    var padding = {top: 10, right: 10, bottom: 10, left: 10};
    var svgWidth = 600;
    var svgHeight = svgWidth;
    
    // Basic formatting variables
    const radius = (svgWidth / 2 - margin.left - margin.right) / 3;
    const graphWidth = svgWidth - margin.left - margin.right;
    const graphHeight = svgHeight - margin.top - margin.bottom;

    // Function to define the arcs
    var arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.015))
        .padRadius(radius * 1.5)
        .innerRadius(d => d.y0 * radius)
        .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 2))

    // Function to format values
    var format = d3.format(",d")

    // Color function (1 Color / 1 Child at root)
    var color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length+1))

    // Use partition layout
    var partition = data => {
        const root = d3.hierarchy(data)
            .sum(d => d.value);
        return d3.partition()
            .size([2 * Math.PI, root.height + 1])
            (root);
    }

    // Process data
    const root = partition(data);
    root.each(d => d.current = d);  // Add information about what is current child

    // Prepare svg canvas
    var svg = d3.select("#div_chart")
        .append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .attr("viewBox", [0, 0, svgWidth, svgHeight])
            .style("font", "10px sans-serif");
    
    // Add graphics area
    var g = svg.append("g")
            .attr("transform", "translate(" + (margin.left + graphWidth / 2) + "," + (margin.top + graphHeight / 2) + ")");

    // Draw items
    const path = g.append("g")
        .selectAll("path")
        .data(root.descendants().slice(1))
        .join("path")
            .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
            .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.8 : 0.6) : 0)
            .attr("d", d => arc(d.current));

    // Add title
    path.append("title")
        .text(d => d.ancestors().map(d => d.data.name).reverse().join("/") + format(d.value));

    // Add labels
    const label = g.append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
        .selectAll("text")
            .data(root.descendants().slice(1))
            .join("text")
                .attr("dy", "0.35em")
                .attr("fill-opacity", d => +labelVisible(d.current))
                .attr("transform", d => labelTransform(d.current))
                .text(d => d.data.name);

    // Add a circle with a function to go back
    const parent = g.append("circle")
        .datum(root)
        .attr("r", radius)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("click", clicked);

    // Make clickable
    path.filter(d => d.children)
        .style("cursos", "pointer")
        .on("click", clicked);

    // Function to modify visibility of circles
    function arcVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    // Function to modify visibility of labels    
    function labelVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    // Function to make labels radial
    function labelTransform(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2 * radius;
        return "rotate(" + (x - 90) + ") translate(" + y + ",0) rotate(" + (x < 180 ? 0 : 180) + ")";
      }

    // Function to click on items
    function clicked(event, p) {
        parent.datum(p.parent || root);
    
        root.each(d => d.target = {
          x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          y0: Math.max(0, d.y0 - p.depth),
          y1: Math.max(0, d.y1 - p.depth)
        });
    
        const t = g.transition().duration(750);
    
        // Transition the data on all arcs, even the ones that aren’t visible,
        // so that if this transition is interrupted, entering arcs will start
        // the next transition from the desired position.
        path.transition(t)
            .tween("data", d => {
              const i = d3.interpolate(d.current, d.target);
              return t => d.current = i(t);
            })
          .filter(function(d) {
            return +this.getAttribute("fill-opacity") || arcVisible(d.target);
          })
            .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.8 : 0.6) : 0)
            .attrTween("d", d => () => arc(d.current));
    
        label.filter(function(d) {
            return +this.getAttribute("fill-opacity") || labelVisible(d.target);
          }).transition(t)
            .attr("fill-opacity", d => +labelVisible(d.target))
            .attrTween("transform", d => () => labelTransform(d.current));
      }

}
