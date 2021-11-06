function zoomTreeFunc(data) {
    // Basic size information
    var margin = {top: 30, right: 0, bottom: 0, left: 0},
        width = 1200 - margin.right - margin.left,
        height = 800 - margin.top - margin.bottom,
        formatNumber = d3.format(",d"),
        transitioning;

	// Create x and y scales
	var x = d3.scaleLinear()
		.domain([0, width])
		.range([0, width]);

	var y = d3.scaleLinear()
		.domain([0, height])
        .range([0, height]);
        
    // Ceate svg canvas
    var svg = d3.select("#div_treeview")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.bottom + margin.top)
            .style("margin-left", -margin.left + "px")
            .style("margin.right", -margin.right + "px")
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .style("shape-rendering", "crispEdges");

    // Assign colors
    var categories = [];
    data["children"].forEach(function(x, i) {categories[i] = x["name"];});
    var color = d3.scaleOrdinal()
        .domain(categories)
        .range(d3.schemeCategory10);

    // Prepare rectangle to be able to go back
    var grandparent = svg.append("g")
        .attr("class", "grandparent");

    grandparent.append("rect")
        .attr("y", -margin.top)
        .attr("width", width)
        .attr("height", margin.top);

    grandparent.append("text")
        .attr("x", 8)
        .attr("y", 8 - margin.top)
        .attr("dy", ".75em");

    // Declare d3 graph
    var treemap = d3.treemap()
        .size([width, height])
        .paddingInner(0)
        .round(false);

    // Build up tree
    var root = d3.hierarchy(data)
        .sum(function (d) {return d.value;})
        .sort(function (a,b) {return b.height - a.height || b.value - a.value;});
    treemap(root);

    // Run main function from root
    display(root);

    // Main visualization function
    function display(d) {
        // Prepare grandparent
        grandparent
            .datum(d.parent)
            .on("click", transition)
            .select("text")
            .text(name(d));

        grandparent
            .datum(d.parent)
            .select("rect")
            .attr("fill", function () {
                return '#bbbbbb'
            });

        var g1 = svg.insert("g", ".grandparent")
            .datum(d)
            .attr("class", "depth");

        var g = g1.selectAll("g")
            .data(d.children)
            .enter().
            append("g");

        // Add class and click handler
        // ---------------------------
        // Add a transition function to g's with children
        g.filter(function (d) {return d.children;})
            .classed("children", true)
            .on("click", transition);

        // Add rectangles for children
        g.selectAll(".child")
            .data(function (d) {return d.children || [d];})
            .enter().append("rect")
            .attr("class", "child")
            .call(rect);
            
        // Add title to parents
        g.append("rect")
            .attr("class", "parent")
            .call(rect)
            .append("title")
            .text(function (d){
                return d.data.name;
            });

        // Adding a foreign object instead of a text object, allows for text wrapping
        g.append("foreignObject")
            .call(rect)
            .attr("class", "foreignobj")
            .append("xhtml:div")
            .attr("dy", ".75em")
            .html(function (d) {
                return '' +
                    '<p class="title"> ' + d.data.name + '</p>' +
                    '<p>' + formatNumber(d.value) + '</p>'
                ;
            })
            .attr("class", "textdiv"); //textdiv class allows us to style the text easily with CSS

        // Function to handle transitions
        function transition(d) {
            // Wait for an occuring transition to finish
            if (transitioning || !d) return;
            transitioning = true;

            // Set time for a smooth transition
            var g2 = display(d),
                t1 = g1.transition().duration(350),
                t2 = g2.transition().duration(350);


            // Update the domain only after entering new elements.
            x.domain([d.x0, d.x1]);
            y.domain([d.y0, d.y1]);

            // Draw child nodes on top of parent nodes.
            svg.selectAll(".depth").sort(function (a, b) {
                return a.depth - b.depth;
            });

            // Fade-in entering text.
            g2.selectAll("text").style("fill-opacity", 0);
            g2.selectAll("foreignObject div").style("display", "none");
            
            // Transition to the new view.
            t1.selectAll("text").call(text).style("fill-opacity", 0);
            t2.selectAll("text").call(text).style("fill-opacity", 1);
            t1.selectAll("rect").call(rect);
            t2.selectAll("rect").call(rect);
            
            // Foreign object
            t1.selectAll(".textdiv").style("display", "none");
            t1.selectAll(".foreignobj").call(foreign);
            t2.selectAll(".textdiv").style("display", "block");
            t2.selectAll(".foreignobj").call(foreign);

            // Remove the old node when the transition is finished.
            t1.on("end.remove", function(){
                this.remove();
                transitioning = false;  // Declare transitioning to be finished
            });
        }

        return g;
    }

    // Utility functions
    // -----------------
    function text(text) {
        text.attr("x", function (d) {return x(d.x) + 6;})
            .attr("y", function (d) {return y(d.y) + 6;});
    }

    function rect(rect) {
        rect
            .attr("x", function (d) {return x(d.x0);})
            .attr("y", function (d) {return y(d.y0);})
            .attr("width", function (d) {return x(d.x1) - x(d.x0);})
            .attr("height", function (d) {return y(d.y1) - y(d.y0);})
            .style("fill", function(d){ return color(getParentName(d));} )
    }

    function foreign(foreign) { /* added */
        foreign
            .attr("x", function (d) {return x(d.x0);})
            .attr("y", function (d) {return y(d.y0);})
            .attr("width", function (d) {return x(d.x1) - x(d.x0);})
            .attr("height", function (d) {return y(d.y1) - y(d.y0);});
    }

    function name(d) {
        return breadcrumbs(d) +
            (d.parent
            ? " (  Click to zoom out )"
            : " ");
    }

    function breadcrumbs(d) {
        var res = "";
        var sep = " > ";
        d.ancestors().reverse().forEach(function(i){res += i.data.name + sep;});
        return res
            .split(sep)
            .filter(function(i){return i!== "";})
            .join(sep);
    }

    // Get initial parent's name
    function getParentName(data) {
        if (data.depth < 2) {
           return data.data.name
        } else {
           return getParentName(data.parent)
        }
     }
}
