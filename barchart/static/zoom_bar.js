function zoomBarFunc(data) {
    // Basic size information
    var margin = {top: 10, right: 10, bottom: 10, left: 10};
    var padding = {top: 20, right: 10, bottom: 10, left: 100};
    var svgWidth = 600;
    var svgHeight = 300;
    
    // Basic formatting variables
    duration = 150;
    barHeight = 30;
    barPadding = 3 / barHeight;

    // Ceate svg canvas
    var svg = d3.select("#div_chart")
        .append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .style("shape-rendering", "crispEdges");

    // Build up tree hierarchy with d3
    var root = d3.hierarchy(data)
        .sum(function (d) {return d.value;})
        .sort(function (a, b) {return b.value - a.value;})
        .eachAfter(d => d.index = d.parent ? d.parent.index = d.parent.index + 1 || 0 : 0);

    // Set graph sizes
    var maxChildren = 1;
    root.each(d => d.children && (maxChildren = Math.max(maxChildren, d.children.length)));
    const graphHeight = maxChildren * barHeight + margin.top + margin.bottom + padding.top + padding.bottom;
    const graphWidth = svgWidth - margin.left - margin.right;

    // Assign colors
    var color = d3.scaleOrdinal()
        .domain([true, false])
        .range(["steelblue", "#aaa"]);

	// Set up X
	var x = d3.scaleLinear()
		.domain([margin.left + padding.left, graphWidth - padding.right])
		.range([margin.left + padding.left, graphWidth - padding.right]);
    xAxis = g => g
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + (margin.top + padding.top) +  ")")
        .call(d3.axisTop(x).ticks(graphWidth / 80, "s"))
        .call(g => (g.selection ? g.selection() : g).select(".domain").remove())

    // Set up Y
    yAxis = g => g
        .attr("class", "y-axis")
        .attr("transform", "translate(" + (margin.left + 0.5) + ",0)")
        .call(g => g.append("line"))
            .attr("stroke", "currentColor")
            .attr("y1", margin.top)
            .attr("y2", graphHeight);

    // Build up tree
    var root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a,b) => b.value - a.value)
        .eachAfter(d => d.index = d.parent ? d.parent.index = d.parent.index +1 || 0 : 0)

    // Function: Stack bars
    function stack(i) {
        let value = 0;
        return d => {
            const t = "translate(" + (x(value) - x(0)) + "," + (barHeight * i)  + ")"
            value += d.value
            return t;
        }
    }

    // Function: stagger bars
    function stagger() {
        let value = 0;
        return (d, i) => {
          const t = "translate(" + (x(value) - x(0)) + "," + (barHeight * i) + ")";
          value += d.value;
          return t;
        };
      }

    // Function: return view
    function up(svg, d) {
        if (!d.parent || !svg.selectAll(".exit").empty()) return; // if at the top, do nothing

        // Bind parent
        svg.select(".background").datum(d.parent);

        // The whole transition will have 2 sequences
        const transition1 = svg.transition().duration(duration);
        const transition2 = transition1.transition();

        // Mark displayed bars
        const exit = svg.selectAll(".enter")
            .attr("class", "exit")

        // Rescale x-axis
        x.domain([0, d3.max(d.parent.children, d => d.value)]);
        svg.selectAll(".x-axis").transition(transition1)
            .call(xAxis)
        
        // Transition bars to new scale
        exit.selectAll("g").transition(transition1)
            .attr("transform", stagger());

        // Transition bars to  parent
        exit.selectAll("g").transition(transition2)
            .attr("transform", stack(d.index));

        // Fade parents and transition existing bars
        exit.selectAll("rect").transition(transition1)
            .attr("width", d => x(d.value) - x(0))
            .attr("fill", color(true));

        // Transition text
        exit.transition(transition2)
            .attr("fill-opacity", 0)
            .remove();

        // Enter the new bars for the clicked-on data's parent.
        const enter = bar(svg, down, d.parent, ".exit")
            .attr("fill-opacity", 0);

        enter.selectAll("g")
            .attr("transform", (d, i) => "translate(0," + (barHeight * i) + ")");

        // Transition entering bars to fade in over the full duration.
        enter.transition(transition2)
            .attr("fill-opacity", 1);

        // Color the bars as appropriate.
        // Exiting nodes will obscure the parent bar, so hide it.
        // Transition entering rects to the new x-scale.
        // When the entering parent rect is done, make it visible!
        enter.selectAll("rect")
            .attr("fill", d => color(!!d.children))
            .attr("fill-opacity", p => p === d ? 0 : null)  // if this was the parent, hide him
            .transition(transition2)
                .attr("width", d => x(d.value) - x(0))
                .on("end", function() { d3.select(this).attr("fill-opacity", 1); });
    }

    // Function: expand items
    function down(svg, d) {
        if (!d.children || d3.active(svg.node())) return;  // do nothing if a node doesn't have any childrten
      
        // Rebind the current node to the background.
        svg.select(".background").datum(d);
      
        // Define two sequenced transitions.
        const transition1 = svg.transition().duration(duration);
        const transition2 = transition1.transition();
      
        // Mark any currently-displayed bars as exiting.
        const exit = svg.selectAll(".enter")
            .attr("class", "exit");
      
        // Entering nodes immediately obscure the clicked-on bar, so hide it.
        exit.selectAll("rect")
            .attr("fill-opacity", p => p === d ? 0 : null);
      
        // Transition exiting bars to fade out.
        exit.transition(transition1)
            .attr("fill-opacity", 0)
            .remove();
      
        // Enter the new bars for the clicked-on data.
        // Per above, entering bars are immediately visible.
        const enter = bar(svg, down, d, ".y-axis")
            .attr("fill-opacity", 0);
      
        // Have the text fade-in, even though the bars are visible.
        enter.transition(transition1)
            .attr("fill-opacity", 1);
      
        // Transition entering bars to their new y-position.
        enter.selectAll("g")
            .attr("transform", stack(d.index))
            .transition(transition1)
            .attr("transform", stagger());
      
        // Update the x-scale domain.
        x.domain([0, d3.max(d.children, d => d.value)]);
      
        // Update the x-axis.
        svg.selectAll(".x-axis").transition(transition2)
            .call(xAxis);
      
        // Transition entering bars to the new x-scale.
        enter.selectAll("g").transition(transition2)
            .attr("transform", (d, i) => "translate(0," + (barHeight * i) + ")");
      
        // Color the bars as parents; they will fade to children if appropriate.
        enter.selectAll("rect")
            .attr("fill", color(true))
            .attr("fill-opacity", 1)
            .transition(transition2)
            .attr("fill", d => color(!!d.children))
            .attr("width", d => x(d.value) - x(0));

      }

    // Creates a set of bars for the given data node, at the specified index.
    function bar(svg, down, d, selector) {
        const g = svg.insert("g", selector)
            .attr("class", "enter")
            .attr("transform", "translate(0," + (margin.top + padding.top + barHeight * barPadding) + ")")
            .attr("text-anchor", "end")
            .style("font", "10px Arial");
    
        const bar = g.selectAll("g")
        .data(d.children)
        .join("g")
            .attr("cursor", d => !d.children ? null : "pointer")
            .on("click", (event, d) => down(svg, d));
    
        bar.append("text")
            .attr("x", margin.left + padding.left - 6)
            .attr("y", barHeight * (1 - barPadding) / 2)
            .attr("dy", ".35em")
            .text(d => d.data.name);
    
        bar.append("rect")
            .attr("x", x(0))
            .attr("width", d => x(d.value) - x(0))
            .attr("height", barHeight * (1 - barPadding));
    
        return g;
    }

    // Execute
    // -------
    // scale to base
    x.domain([0, root.value]);

    // Add background rectangle to zoom back
    var parent = svg.append("g")
        .attr("class", "parent")

    svg.append("rect")
        .attr("class", "background")
        .attr("fill", "none")  // Set fill to none
        .attr("pointer-events", "all")
        .attr("width", graphWidth)
        .attr("height", graphHeight)
        .attr("cursor", "pointer")  // change cursor when hovering over
        .on("click", (event, d) => up(svg, d));  // execute up on click

    // Draw axes
    svg.append("g")
        .call(xAxis);
    svg.append("g")
        .call(yAxis);

    // Draw root
    down(svg, root);
    
    // document.write("Still alive!");
}
