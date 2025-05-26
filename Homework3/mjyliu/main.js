const width = window.innerWidth;
const height = window.innerHeight;

// pie chart measurements
let pieLeft = 40, pieTop = 90;
let pieMargin = {top: 20, right: 30, bottom: 30, left: 60},
    pieWidth = 350 - pieMargin.left - pieMargin.right,
    pieHeight = 350 - pieMargin.top - pieMargin.bottom;
const radius = Math.min(pieWidth, pieHeight) / 2;

// heatmap measurements
let heatLeft = 40, heatTop = 550;
let heatMargin = {top: 10, right: 30, bottom: 30, left: 60},
    heatWidth = 350 - heatMargin.left - heatMargin.right,
    heatHeight = 300 - heatMargin.top - heatMargin.bottom;

// streamgraph measurements
let streamLeft = 500, streamTop = 120;
let streamMargin = {top: 20, right: 150, bottom: 30, left: 60},
    streamWidth = 980 - streamMargin.left - streamMargin.right,
    streamHeight = 770 - streamMargin.top - streamMargin.bottom;

// make group for title
const title = d3.select("svg").append("g")
    .attr("transform", "translate(" + (width / 2) + ", 30)"); // position title in center top

// write text for title
title.append("text")
    .attr("text-anchor", "middle") // center text
    .style("font-size", "24px") // set font size
    .style("font-weight", "bold") // bold text
    .text("Music & Mental Health Dashboard"); // set text

// create group for filter dropdown menus
const filters = d3.select("svg").append("g")
    .attr("transform", "translate(0, 60)"); // position under title

// add text for genre filter
filters.append("text")
    .text("Filter by Favorite Genre:") // set text
    .attr("x", 440) // position to left
    .attr("y", 0); // position under title

// add container for genre dropdown menu
filters.append("foreignObject")
    .attr("x", 605) // set x position
    .attr("y", -15) // set y position
    .attr("width", 200) // set width
    .attr("height", 40) // set height
    .append("xhtml:select") // add html select element
    .attr("id", "genreDropdown") // set id
    .selectAll("option") // prepare to create option elements
    .data(["All", "Classical", "Country", "EDM", "Folk", "Gospel", "Hip hop", "Jazz", "K pop", "Latin", "Lofi", "Metal", "Pop", "R&B", "Rap", "Rock", "Video game music"]) // set array of genre options
    .enter() // start entering new elements
    .append("option") // create option element for each data element
    .text(d => d); // set text of each option to data value

// add text for music effect filter
filters.append("text")
    .text("Filter by Music Effect:") // set text
    .attr("x", 840) // position to right
    .attr("y", 0); // position under title

// add container for music effect dropdown menu
filters.append("foreignObject")
    .attr("x", 995) // set x position
    .attr("y", -15) // set y position
    .attr("width", 200) // set width
    .attr("height", 40) // set height
    .append("xhtml:select") // add html select element
    .attr("id", "effectDropdown") // set id
    .selectAll("option") // prepare to create option elements
    .data(["All", "Improve", "No effect", "Worsen"]) // set array of genre options
    .enter() // start entering new elements
    .append("option") // create option element for each data elemnt
    .text(d => d); // set text of each option to data value

// parse data
d3.csv("./data/mxmh_survey_results.csv").then(rawData =>{
    // filtered data variable for transitions
    let filteredData = rawData;

    // process pie chart data: total occurrences of mental health effects
    function processPieData(data) {
        // sum up total occurrences of mental health effects
        const effects = { "Improve": 0, "No effect": 0, "Worsen": 0 };
        data.forEach(function(d){
            if (d["Music effects"]) {
                effects[d["Music effects"]] += 1;
            }
        });
        return effects;
    }
    let pieData = processPieData(filteredData);

    // process heatmap data: correlations between music variables, age, bpm, and hours per day
    function processHeatmapData(data) {
        // array of variable pairs and their correlations
        const heatmapData = [];
        // array of variables
        const variables = ["Age", "BPM", "Hours per day", "Anxiety", "Depression", "Insomnia", "OCD"];
        // calculate correlations between all variables
        for (let i = 0; i < variables.length; i++) {
            for (let j = 0; j < variables.length; j++) {
                const variable1 = variables[i];
                const variable2 = variables[j];
                // if same variable, correlation is 1
                if (i === j) {
                    heatmapData.push({
                        v1: variable1,
                        v2: variable2,
                        value: 1
                    });
                    continue;
                }
                // for each data point, get valid pairs of variables
                const pairs = [];
                data.forEach(d => {
                    // get numbers for x and y
                    const x = +d[variable1];
                    const y = +d[variable2];
                    // if pair is valid, push to pairs
                    if (!isNaN(x) && !isNaN(y)) {
                        pairs.push({x, y});
                    }
                });
                // if less than 2 pairs, no correlation coefficient
                const l = pairs.length;
                if (l < 2) {
                    heatmapData.push({
                        v1: variable1,
                        v2: variable2,
                        value: 0
                    });
                    continue;
                }
                // calculate sums for pearson correlation coefficient calculation
                let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
                pairs.forEach(p => {
                    sumX += p.x;
                    sumY += p.y;
                    sumXY += p.x * p.y;
                    sumX2 += p.x * p.x;
                    sumY2 += p.y * p.y;
                });
                // calculate correlation coefficients
                const cc = (l * sumXY - sumX * sumY) / Math.sqrt((l * sumX2 - sumX * sumX) * (l * sumY2 - sumY * sumY));
                // push to heaetmap data
                heatmapData.push({
                    v1: variable1,
                    v2: variable2,
                    value: cc
                });
            }
        }
        return heatmapData;
    }
    let heatmapData = processHeatmapData(filteredData);

    // process streamgraph data: mental health score for each apir of genre and frequency
    function processStreamData(data) {
        const streamData = [];
        // type of issue array
        const mhIssues = ["Anxiety", "Depression", "Insomnia", "OCD"];
        // type of genre array
        const genres = ["Frequency [Classical]","Frequency [Country]","Frequency [EDM]","Frequency [Folk]","Frequency [Gospel]","Frequency [Hip hop]","Frequency [Jazz]","Frequency [K pop]","Frequency [Latin]","Frequency [Lofi]","Frequency [Metal]","Frequency [Pop]","Frequency [R&B]","Frequency [Rap]","Frequency [Rock]","Frequency [Video game music]"];
        // type of frequency array
        const frequencies = ["Never", "Rarely", "Sometimes", "Very frequently"];
        // for each genre and frequency pair
        genres.forEach(genre => {
            frequencies.forEach((freq) => {
                // calculate mental health score for genre and frequency, higher the better (40 - sum of issues)
                let totalScore = 0;
                let count = 0;
                data.forEach(d => {
                    // check if this row matches current frequency cataegory
                    if (d[genre] === freq) {
                        // get sum of all mental health issue scores
                        let issueSum = 0;
                        let validIssues = 0;
                        mhIssues.forEach(issue => {
                            if (!isNaN(+d[issue])) {
                                issueSum += +d[issue];
                                validIssues++;
                            }
                        });
                        if (validIssues == 4) {
                            totalScore += 40 - issueSum;
                            count++;
                        }
                    }
                });
                // push final score to stream data
                streamData.push({
                    genre: genre,
                    frequency: freq,
                    score: count > 0 ? totalScore / count : 0
                });
            });
        });
        return streamData;
    }
    let streamData = processStreamData(filteredData);

    const svg = d3.select("svg");

    // function to render all visualizations
    function renderVisualizations() {
        renderPieChart();
        renderHeatmap();
        renderStreamgraph();
    }

    // plot 1: pie chart for music effects on participants
    function renderPieChart() {
        // clear previous chart
        svg.selectAll(".pie-chart").remove();
    
        // create group for pie chart
        const g1 = svg.append("g")
            .attr("class", "pie-chart") // label class of pie chart group
            .attr("width", pieWidth + pieMargin.left + pieMargin.right) // set width
            .attr("height", pieHeight + pieMargin.top + pieMargin.bottom) // set height
            .attr("transform", `translate(${pieLeft + pieWidth/2 + pieMargin.left}, ${pieTop + pieHeight/2 + pieMargin.top})`); // position pie chart

        // set the color scale
        var color = d3.scaleOrdinal()
            .domain(Object.keys(pieData)) // set domain to music effects
            .range(d3.schemeSet2); // set colors

        // compute values on pie chart
        var pie = d3.pie()
            .value(d => d.value);
            
        // prepare data to pie chart
        var data_ready = pie(d3.entries(pieData));

        // create arc generator for chart
        var arc = d3.arc()
            .innerRadius(0) // set inner radius to 0 for no hole
            .outerRadius(radius); // set outer radius

        // create path for each music effect
        g1.selectAll('path') // select all path elements
            .data(data_ready) // set data to pie chart data
            .enter() // enter for each data point
            .append('path') //create path element
                .attr('d', arc) // set shape with arc generator
                .attr('fill', function(d){ return(color(d.data.key)) }) // set color based on data
                .style("stroke-width", "0px") // no visible strokes
                .style("opacity", 0) // start with 0 opacity
                .each(function(d) { this._current = { startAngle: 0, endAngle: 0, data: d.data }; }) // save initial angles
                .transition() // start transition
                .duration(1000) // set transition duration
                .ease(d3.easeSinInOut) // sinsuoidal easing for transition
                .style("opacity", 1) // end with 0 opacity
                .attrTween('d', function(d) {
                    var interpolate = d3.interpolate(this._current, d); // interpolation function between intiial and final slice
                    this._current = interpolate(0); // save current state
                    return function(t) { // return function for each animation step
                        return arc(interpolate(t)); // return svg path at each step of interpolation
                    };
                });

        // create legend
        const legend = svg.append("g")
            .attr("class", "pie-chart") // label class of pie chart legend
            .attr("transform", `translate(${pieLeft + 35}, ${pieTop + pieHeight + 10})`); // position legend

        // add keys to the legend
        Object.keys(pieData).forEach((key, i) => { // for each category of music effects
            const g = legend.append("g").attr("transform", `translate(0, ${i * 20})`); // create group for legend item
            g.append("rect")
                .attr("width", 18) // set square width
                .attr("height", 18) // set square height
                .attr("fill", color(key)); // set color
            g.append("text")
                .attr("x", 25) // set text width
                .attr("y", 14) // set text width
                .text(key); // set text
        });

        // add title to chart
        g1.append("text")
            .attr("x", 0) // set x position
            .attr("y", -150) // set y position
            .attr("text-anchor", "middle") // center text
            .style("font-size", "16px") // set font size
            .style("font-weight", "bold") // bold font
            .text("Effects of Music on Mental Health"); // set title text
    }

    // plot 2: heatmap for correlation between age, bpm, hours per day, mental health issues
    function renderHeatmap() {
        // clear previous heatmap
        svg.selectAll(".heatmap").remove();
        
        // create main heatmap container
        const g2 = svg.append("g")
            .attr("class", "heatmap") // label heatmap class
            .attr("width", heatWidth + heatMargin.left + heatMargin.right) // set width
            .attr("height", heatHeight + heatMargin.top + heatMargin.bottom) // set height
            .attr("transform", `translate(${heatLeft + heatMargin.left}, ${heatTop + heatMargin.top})`); // position heatmap
            
        // create clip path for zooming
        const clipId = "heatmap-clip";
        g2.append("defs").append("clipPath") // add clip path element
            .attr("id", clipId) // set clip id
            .append("rect") // rectangle shape for clip path
            .attr("width", heatWidth) // set width
            .attr("height", heatHeight) // set height
            .attr("x", 0) // set x position
            .attr("y", 0); // set y position
            
        // create inner group for zooming
        const inner = g2.append("g")
            .attr("class", "inner") // label class
            .attr("clip-path", `url(#${clipId})`) // set clip id
            .attr("transform", "translate(0,0)") // set position of inner group
            .style("cursor", "move"); // set cursor for dragging
            
        // set scale for x axis
        const xHeat = d3.scaleBand()
            .domain(["Age", "BPM", "Hours per day", "Anxiety", "Depression", "Insomnia", "OCD"]) // set domain
            .range([0, heatWidth]); // set range

        // set scale for y axis
        const yHeat = d3.scaleBand()
            .domain(["Age", "BPM", "Hours per day", "Anxiety", "Depression", "Insomnia", "OCD"]) // set domain
            .range([heatHeight, 0]); // set range
            
        // create axis generators
        const xAxis = d3.axisBottom(xHeat); // create x axis
        const yAxis = d3.axisLeft(yHeat); // create y axis
            
        // add x axis
        const gx = g2.append("g")
            .attr("class", "x-axis") // label x axis
            .attr("transform", `translate(0, ${heatHeight})`) // set position
            .call(xAxis); // render axis
            
        // style x-axis labels
        gx.selectAll("text")
            .style("text-anchor", "end") // align at end point
            .attr("dx", "-.8em") // shift horizontally
            .attr("dy", ".15em") // shift vertically
            .attr("transform", "rotate(-45)"); // rotate text 45 degrees

        // add y axis
        const gy = g2.append("g")
            .attr("class", "y-axis") // set class label
            .call(yAxis); // render y axis
            
        // create group for cells to transform
        const cellGroup = inner.append("g")
            .attr("class", "cell-group"); // set label
            
        // create zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 8]) // limit scale to 8
            .extent([[0, 0], [heatWidth, heatHeight]]) // set extent of zoom area
            .translateExtent([[0, 0], [heatWidth, heatHeight]]) // set extent of panning
            .filter(function() {
                // filter only with touhcpad and dragging
                return !d3.event.button && 
                (d3.event.type === "mousedown" || 
                    d3.event.type === "mousemove");
            })
            .on("zoom", zoomed); // call function during zoom events
        
        // zoom function
        function zoomed() {
            const transform = d3.event.transform;
            
            // update cell positions and sizes
            cellGroup.selectAll("rect")
                .attr("x", d => transform.x + xHeat(d.v1) * transform.k) // update x position
                .attr("y", d => transform.y + yHeat(d.v2) * transform.k) // update y position
                .attr("width", xHeat.bandwidth() * transform.k) // scale width
                .attr("height", yHeat.bandwidth() * transform.k); // scale height
                
            // create clip paths for the axes
            const xAxisClipId = "x-axis-clip";
            const yAxisClipId = "y-axis-clip";
            
            // create clip path for x axis
            g2.select("defs").append("clipPath")
                .attr("id", xAxisClipId) // set id
                .append("rect") // create rectangle for clipping
                .attr("x", 0) // left edge
                .attr("y", 0) // top edge
                .attr("width", heatWidth) // set width
                .attr("height", heatHeight + 30); // set height with extra space for x axis labels
                
            // create clip path for y axis
            g2.select("defs").append("clipPath")
                .attr("id", yAxisClipId) // set id
                .append("rect") // create rectangle for clipping
                .attr("x", -80) // left edge with room for y axis labels
                .attr("y", 0) // top edge
                .attr("width", heatWidth + 60) // set width with room for y axis labels
                .attr("height", heatHeight); // set height
                
            // apply clip paths to axes
            gx.attr("clip-path", `url(#${xAxisClipId})`); // clip x axis
            gy.attr("clip-path", `url(#${yAxisClipId})`); // clip y axis
            
            // create temporary scales for the current view
            const tempXScale = d3.scaleBand()
                .domain(xHeat.domain()) // keep domain
                .range([transform.x, transform.x + heatWidth * transform.k]); // adjust range
                
            // create temporary y scale with reversed domain for the y-axis labels only
            const tempYScale = d3.scaleBand()
                .domain(["OCD", "Insomnia", "Depression", "Anxiety", "Hours per day", "BPM", "Age"]) // keep domain
                .range([transform.y, transform.y + heatHeight * transform.k]); // adjust range
            
            // update axes
            gx.call(d3.axisBottom(tempXScale)); // update x axis
            gy.call(d3.axisLeft(tempYScale)); // update y axis
            
            // calculate clipping bounds
            const tx = Math.min(Math.max(transform.x, -heatWidth * (transform.k - 1)), 0); // bound x translation
            const ty = Math.min(Math.max(transform.y, -heatHeight * (transform.k - 1)), 0); // bound y translation
            
            // if transform is past bounds, new transform
            if (tx !== transform.x || ty !== transform.y) {
                const newTransform = d3.zoomIdentity.translate(tx, ty).scale(transform.k); // create new transform
                g2.call(zoom.transform, newTransform); // call new transform
            }
        }
        
        // apply zoom to heatmap
        g2.call(zoom).call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1)); // initialize without zoom
          
        // add zoom buttons
        const zoomControls = svg.append("g")
            .attr("class", "heatmap") // set class label
            .attr("transform", `translate(${heatLeft + heatWidth + heatMargin.left + 10}, ${heatTop + heatMargin.top})`); // position to right of heatmap
        
        // add zoom in button
        zoomControls.append("circle")
            .attr("cx", 15) // x position
            .attr("cy", 15) // y position
            .attr("r", 15) // radius
            .attr("fill", "white") // light gray fill
            .attr("stroke", "gray") // dark gray border
            .style("cursor", "pointer") // change cursor to pointer
            .on("click", function() {
                // when clicked
                g2.transition() // start transition
                .duration(300) // transition duration
                .call(zoom.scaleBy, 2); // zoom in 2x
            });
        
        // add + symbol
        zoomControls.append("text")
            .attr("x", 15) // x pos
            .attr("y", 20) // y pos
            .attr("text-anchor", "middle") // center text
            .style("font-size", "20px") // font size
            .style("pointer-events", "none") // ignore pointer events
            .text("+"); // set symbol
            
        // add zoom out button
        zoomControls.append("circle")
            .attr("cx", 15) // x pos
            .attr("cy", 55) // y pos
            .attr("r", 15) // radius
            .attr("fill", "white") // light gray fill
            .attr("stroke", "gray") // dark gray border
            .style("cursor", "pointer") // change cursor to points
            .on("click", function() {
                // when clicked
                g2.transition() // start transition
                .duration(300) // duration
                .call(zoom.scaleBy, 0.5); // zoom out 0.5x
            });
        
        // add - symbol
        zoomControls.append("text")
            .attr("x", 15) // x pos
            .attr("y", 60) // y pos
            .attr("text-anchor", "middle") // center text
            .style("font-size", "20px") // font size
            .style("pointer-events", "none") // ignore pointer events
            .text("-"); // set symbol
        
        // create zoom instructions
        g2.append("text") // add text
            .attr("x", heatWidth / 2) // center
            .attr("y", -10) // above heatmap
            .attr("text-anchor", "middle") // center text
            .style("font-size", "12px") // font size
            .style("fill", "gray") // gray fill
            .text("Click buttons to zoom in and out, drag to pan"); // set instructions
        
        // color scale for correlation
        const colorHeat = d3.scaleSequential()
            .domain([-1, 1]) // set domain for color scale
            .interpolator(d3.interpolatePiYG); // interpolate sclae
        
        // create rect for each correlation
        const cells = cellGroup.selectAll("rect")
            .data(heatmapData, d => d.v2 + ':' + d.v1) // set data to each pair of variables
            .enter() // enter to start creating elements
            .append("rect") // create rectangle
            .attr("x", d => xHeat(d.v1)) // set variable 1
            .attr("y", d => yHeat(d.v2)) // set variable 2
            .attr("width", xHeat.bandwidth()) // set width
            .attr("height", yHeat.bandwidth()) // set height
            .style("fill", d => colorHeat(d.value)) // set color to correlation value
            .style("opacity", 0); // no opacity
            
        // add tooltips
        cells.append("title")
            .text(d => `${d.v2} & ${d.v1}: Correlation = ${d.value.toFixed(3)}`); // format with correlation value
        
        // apply transition
        cells.transition() // start transition
            .duration(1000) // transition duration
            .ease(d3.easeSinInOut) // sinusoidal easing
            .style("opacity", 1); // full opacity
        
        // add color legend for heatmap
        const legendWidth = 20; // set width
        const legendHeight = heatHeight; // set height
        const legendX = heatWidth + 50; // position to right
        
        // create gradient for legend
        const defs = g2.append("defs"); // add definitions element for gradient
        const linearGradient = defs.append("linearGradient") // create linear gradient
            .attr("id", "heatmap-gradient") // set id
            .attr("x1", "0%") // start at left edge
            .attr("y1", "100%") // start from bottom
            .attr("x2", "0%") // end at left
            .attr("y2", "0%"); // end at top
        linearGradient.append("stop") // color stop for negative correlation
            .attr("offset", "0%") // position at bottom
            .attr("stop-color", colorHeat(-1)); // for -1 correlation
        linearGradient.append("stop") // color stop for no correlation
            .attr("offset", "50%") // position at middle
            .attr("stop-color", colorHeat(0)); // for 0 correlation
        linearGradient.append("stop") // color stop for positive correlation
            .attr("offset", "100%") // position at top
            .attr("stop-color", colorHeat(1)); // for 1 correlation
        
        // draw legend rectangle
        g2.append("rect") // add rectangle
            .attr("x", legendX) // set x
            .attr("y", 0) // set y
            .attr("width", legendWidth) // set width
            .attr("height", legendHeight) // set height
            .style("fill", "url(#heatmap-gradient)"); // fill with gradient
        
        // scale for legend axis
        const legendScale = d3.scaleLinear()
            .domain([-1, 1]) // set domain
            .range([legendHeight, 0]); // set range
            
        // legend axis for correlation values
        const legendAxis = d3.axisRight(legendScale)
            .tickValues([-1, -0.5, 0, 0.5, 1]) // set tick values
            .tickFormat(d3.format(".1f")); // set tick format
            
        // append axis to legend
        g2.append("g")
            .attr("transform", `translate(${legendX + legendWidth}, 0)`) // position
            .call(legendAxis); // render axis
            
        // legend title
        g2.append("text")
            .attr("x", legendX + legendWidth/2) // set x pos
            .attr("y", -10) // set y pos
            .style("text-anchor", "middle") // center text
            .style("font-size", "12px") // font size
            .text("Correlation"); // set title

        // heatmap title
        g2.append("text")
            .attr("x", heatWidth / 2 + 20) // set x pos
            .attr("y", -30) // set y pos
            .attr("text-anchor", "middle") // center text
            .style("font-size", "16px") // font size
            .style("font-weight", "bold") // bond font
            .text("Correlations Between Age, Listening Experience, & Mental Health"); // set title
    }

    // plot 3: streamgraph for genre frequency and mental health score

    // create popup for stream statistics
    const popup = svg.append("g")
        .attr("class", "popup") // label popup class
        .style("display", "none"); // no display at first
    
    // background rectangle for popup
    popup.append("rect")
        .attr("width", 320) // set width
        .attr("height", 160) // set height
        .attr("fill", "white") // white background
        .attr("stroke", "black") // black border
        .attr("rx", 5) // rounded corners
        .attr("ry", 5) // rounded corners
        .attr("opacity", 1.0); // opaque
    
    // title text
    popup.append("text")
        .attr("class", "popup-title") // label class
        .attr("x", 10) // set x pos
        .attr("y", 20) // set y pos
        .style("font-weight", "bold"); // bold text
    
    // anxiety score text
    popup.append("text")
        .attr("class", "popup-anxiety") // label class
        .attr("x", 10) // set x pos
        .attr("y", 45); // set y pos
    
    // depression text
    popup.append("text")
        .attr("class", "popup-depression") // label class
        .attr("x", 10) // set x pos
        .attr("y", 65); // set y pos
    
    // insomnia text
    popup.append("text")
        .attr("class", "popup-insomnia") // label class
        .attr("x", 10) // set x pos
        .attr("y", 85); // set y pos
    
    // ocd text
    popup.append("text")
        .attr("class", "popup-ocd") // label class
        .attr("x", 10) // set x pos
        .attr("y", 105); // set y pos
    
    // bpm text
    popup.append("text")
        .attr("class", "popup-bpm") // label class
        .attr("x", 10) // set x pos
        .attr("y", 125); // set y pos
    
    // hours per day text
    popup.append("text")
        .attr("class", "popup-hours") // label class
        .attr("x", 10) // set x pos
        .attr("y", 145); // set y pos

    // function to render streamgraph
    function renderStreamgraph() {
        // clear previous streamgraph
        svg.selectAll(".streamgraph").remove();

        // create container group for streamgraph
        const g3 = svg.append("g")
            .attr("class", "streamgraph") // label class
            .attr("width", streamWidth + streamMargin.left + streamMargin.right) // set width
            .attr("height", streamHeight + streamMargin.top + streamMargin.bottom) // set height
            .attr("transform", `translate(${streamLeft + streamMargin.left}, ${streamTop + streamMargin.top})`); // set position

        // nest data by frequency
        const nestedData = d3.nest()
            .key(d => d.frequency) // group by frequency value
            .entries(streamData); // use stream data

        // array of genres
        const genres = ["Frequency [Classical]","Frequency [Country]","Frequency [EDM]","Frequency [Folk]","Frequency [Gospel]","Frequency [Hip hop]","Frequency [Jazz]","Frequency [K pop]","Frequency [Latin]","Frequency [Lofi]","Frequency [Metal]","Frequency [Pop]","Frequency [R&B]","Frequency [Rap]","Frequency [Rock]","Frequency [Video game music]"];

        // stack generator for streamgraph
        const stack = d3.stack()
            .keys(genres) // genres as stack keys
            .value((d, key) => {
                const match = d.values.find(item => item.genre === key); // matching genre
                return match ? match.score : 0; // return match if exists
            })
            .offset(d3.stackOffsetSilhouette); // silhouette offset for streams

        // compute stacked data
        const stackedData = stack(nestedData);

        // set x scale
        const xStream = d3.scaleBand()
            .domain(["Never", "Rarely", "Sometimes", "Very frequently"]) // set domain
            .range([0, streamWidth]); // set range

        // set y scale
        const yStream = d3.scaleLinear()
            .domain([d3.min(stackedData.flat().flat()), d3.max(stackedData.flat().flat())]) // set domain
            .range([streamHeight, 0]); // set range

        // create color scale for genres
        const colorStream = d3.scaleOrdinal()
            .domain(genres) // set domain of genres
            .range([
                "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
                "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
                "#bcbd22", "#17becf", "#aec7e8", "#ffbb78",
                "#98df8a", "#ff9896", "#c5b0d5", "#c49c94"
            ]);

        // create area generator for streams
        const area = d3.area()
            .x(d => xStream(d.data.key) + xStream.bandwidth()/2) // set x to center of stream
            .y0(d => yStream(d[0])) // set bottom y position
            .y1(d => yStream(d[1])) // set top y position
            .curve(d3.curveBasis); // basis curve for smooth interpolation

        // create paths with transition
        const paths = g3.selectAll("path")
            .data(stackedData) // bind stacked data
            .enter() // enter selection for new elements
            .append("path") // create path element for each data item
            .attr("d", area) // shape wiht area generator
            .attr("fill", d => colorStream(d.key)) // fill based on genre
            .style("opacity", 0) // start hidden
            .transition() // start transition
            .duration(1000) // duration
            .ease(d3.easeSinInOut) // sinusoidal easing
            .style("opacity", 0.8); // end with 80% opacity
            
        // add interaction to streams
        g3.selectAll("path")
            .style("cursor", "pointer") // change cursor to pointer
            .on("click", function(d) { 
                // set all paths to less opaque
                g3.selectAll("path")
                    .transition() // start transition
                    .duration(300) // transition duration
                    .style("opacity", 0.3); // less opaque
                
                // highlight selected path
                d3.select(this)
                    .transition() // start transition
                    .duration(300) // transition duration
                    .style("opacity", 1.0); // more opaque
                
                // get genre name from key
                const genreMatch = d.key.match(/\[(.*?)\]/);
                const genreName = genreMatch ? genreMatch[1] : d.key;
                
                // get mouse position for popup position
                const [x, y] = d3.mouse(svg.node());
                
                // get selected frequency based on x position
                const mouseX = d3.mouse(g3.node())[0];
                const frequencies = ["Never", "Rarely", "Sometimes", "Very frequently"];
                let clickedFreq = "Rarely";
                
                // for each frequency, if clicked x position is in same bandwidth, set frequency
                frequencies.forEach(freq => {
                    const bandX = xStream(freq);
                    const bw = xStream.bandwidth();
                    if (mouseX >= bandX && mouseX <= bandX + bw) {
                        clickedFreq = freq;
                    }
                });
                
                // initialize scores for genre and frequency pair
                const scores = {
                    anxiety: 0,
                    depression: 0,
                    insomnia: 0,
                    ocd: 0,
                    bpm: 0,
                    hours: 0,
                    count: 0,
                    bpmCount: 0,
                    hoursCount: 0
                };
                
                // for each data point
                filteredData.forEach(row => {
                    // if row matches genre and frequency
                    if (row[d.key] === clickedFreq) {
                        // mental health metrics
                        const issues = ["Anxiety", "Depression", "Insomnia", "OCD"];
                        let issueSum = 0;
                        let validIssues = 0;
                        
                        // sum up score of each mental health issue
                        issues.forEach(issue => {
                            const value = +row[issue];
                            if (!isNaN(value)) {
                                // add to scores
                                scores[issue.toLowerCase()] += value;
                                issueSum += value;
                                validIssues++;
                            }
                        });
                        
                        // increment count of valid rows
                        if (validIssues == 4) {
                            scores.count++;
                        }
                        
                        // sum up bpm
                        const bpm = +row["BPM"];
                        if (!isNaN(bpm) && bpm > 0 && bpm < 300) {
                            scores.bpm += bpm;
                            scores.bpmCount++;
                        }
                        
                        // sum up hours per day
                        const hours = +row["Hours per day"];
                        if (!isNaN(hours) && hours >= 0 && hours <= 24) {
                            scores.hours += hours;
                            scores.hoursCount++;
                        }
                    }
                });
                
                // calculate averages
                if (scores.count > 0) {
                    scores.anxiety /= scores.count;
                    scores.depression /= scores.count;
                    scores.insomnia /= scores.count;
                    scores.ocd /= scores.count;
                }
                
                if (scores.bpmCount > 0) {
                    scores.bpm /= scores.bpmCount;
                }
                
                if (scores.hoursCount > 0) {
                    scores.hours /= scores.hoursCount;
                }
                
                // move popup to front
                popup.remove();
                svg.node().appendChild(popup.node());
                
                // position popup, avoiding screen edges
                const popupHeight = 160;
                // if popup is cutoff by screen edge, position above where clicked. else, position below
                const yPos = (y + popupHeight + 20 > height) ? (y - popupHeight - 20) : (y + 20);
                
                // render popup
                popup
                    .attr("transform", `translate(${x - 120}, ${yPos})`) // set position
                    .style("display", "block"); // display
                
                // set popup title
                popup.select(".popup-title")
                    .text(`${genreName} - ${clickedFreq}`); // set text
                
                // show scores on popup
                if (scores.count > 0) {
                    popup.select(".popup-anxiety") // select element
                        .text(`Anxiety: ${scores.anxiety.toFixed(2)}`); // set text to anxiety score
                    popup.select(".popup-depression")
                        .text(`Depression: ${scores.depression.toFixed(2)}`); // set text to depression score
                    popup.select(".popup-insomnia")
                        .text(`Insomnia: ${scores.insomnia.toFixed(2)}`); // set text to insomnia score
                    popup.select(".popup-ocd")
                        .text(`OCD: ${scores.ocd.toFixed(2)}`); // set text to ocd score
                } else { // if no valid scores, print no data
                    popup.select(".popup-anxiety")
                        .text(`Anxiety: No data for ${clickedFreq}`);
                    popup.select(".popup-depression")
                        .text(`Depression: No data for ${clickedFreq}`);
                    popup.select(".popup-insomnia")
                        .text(`Insomnia: No data for ${clickedFreq}`);
                    popup.select(".popup-ocd")
                        .text(`OCD: No data for ${clickedFreq}`);
                }
                
                // show bpm and hours data
                if (scores.bpmCount > 0) {
                    popup.select(".popup-bpm") // select bpm element
                        .text(`Avg BPM: ${scores.bpm.toFixed(2)}`); // set bpm text
                } else {
                    popup.select(".popup-bpm")
                        .text(`Avg BPM: No data for ${clickedFreq}`);
                }
                if (scores.hoursCount > 0) {
                    popup.select(".popup-hours") // select hours element
                        .text(`Avg Hours/Day: ${scores.hours.toFixed(2)}`); // set hours text
                } else {
                    popup.select(".popup-hours")
                        .text(`Avg Hours/Day: No data for ${clickedFreq}`);
                }
                
                // prevent event propagation
                d3.event.stopPropagation();
            });

        // click somewhere else to reset
        svg.on("click", function() {
            // hide popup
            popup.style("display", "none");
            // reset all streams
            g3.selectAll("path")
                .transition() // start transition
                .duration(300) // transition duration
                .style("opacity", 0.8); // set opacity
        });

        // add x axis at bottom
        g3.append("g")
            .attr("transform", `translate(0, ${streamHeight})`) // position x axis
            .call(d3.axisBottom(xStream)); // call x axis

        // add x axis label
        g3.append("text")
            .attr("x", streamWidth / 2) // set x pos
            .attr("y", streamHeight + 40) // set y pos
            .attr("text-anchor", "middle") // center text
            .style("font-size", "14px") // font size
            .text("Frequency of Listening to Music Genre"); // set label

        // add y axis
        g3.append("g")
            .call(d3.axisLeft(yStream)); // call y axis

        // add y axis label
        g3.append("text")
            .attr("transform", "rotate(-90)") // rotate label
            .attr("x", -streamHeight / 2) // set x pos
            .attr("y", -40) // set y pos
            .attr("text-anchor", "middle") // center text
            .style("font-size", "14px") // font size
            .text("Mental Health Score Distribution"); // set label

        // add legend
        const streamLegend = g3.append("g")
            .attr("transform", `translate(${streamWidth + 5}, 0)`); // position legend

        // add legend title
        streamLegend.append("text")
            .attr("x", 0) // set x pos
            .attr("y", 10) // set y pos
            .style("font-weight", "bold") // bold text
            .text("Music Genres"); // set legend title

        // add legend items for each genre
        genres.forEach((genre, i) => {
            const g = streamLegend.append("g") // create group for genre
                .attr("transform", `translate(0, ${i * 20 + 30})`); // set new position
            const genreMatch = genre.match(/\[(.*?)\]/); // match genre
            const genreName = genreMatch ? genreMatch[1] : genre; // get genre name
            g.append("rect") // add rectaingle
                .attr("width", 18) // set width
                .attr("height", 18) // set height
                .attr("fill", colorStream(genre)) // fill with matching color
                .attr("opacity", 0.8); // set opacity
            g.append("text") // add text
                .attr("x", 25) // set x pos
                .attr("y", 14) // set y pos
                .text(genreName); // set text as genre name
        });

        // create stream interaction instructions
        g3.append("text") // add text
            .attr("x", streamWidth/2) // center
            .attr("y", streamTop - 140) // above streamgraph
            .attr("text-anchor", "middle") // center text
            .style("font-size", "12px") // font size
            .style("fill", "gray") // gray fill
            .text("Click streams to see more!"); // set instructions

        // add streamgraph title
        svg.append("text")
            .attr("class", "streamgraph") // set streamgraph label
            .attr("x", streamLeft + streamWidth/2 + streamMargin.left) // set x axis
            .attr("y", streamTop - 20) // set y axis
            .attr("text-anchor", "middle") // center text
            .style("font-size", "16px") // set font size
            .style("font-weight", "bold") // bold text
            .text("Wellness of Mental Health by Listening Frequency to Each Music Genre"); // set streamgraph title
    }

    // initial render
    renderVisualizations();

    // add filter function
    d3.select("#genreDropdown").on("change", applyFilters);
    d3.select("#effectDropdown").on("change", applyFilters);

    function applyFilters() {
        const selectedGenre = d3.select("#genreDropdown").property("value");
        const selectedEffect = d3.select("#effectDropdown").property("value");
        
        // filter data based on selections
        filteredData = rawData.filter(d => {
            let genreMatch = selectedGenre === "All" || d["Fav genre"] === selectedGenre;
            let effectMatch = selectedEffect === "All" || d["Music effects"] === selectedEffect;
            return genreMatch && effectMatch;
        });
        
        // reprocess data with filters
        pieData = processPieData(filteredData);
        heatmapData = processHeatmapData(filteredData);
        streamData = processStreamData(filteredData);
        
        // rerender visualizations
        renderVisualizations();
    }
}).catch(function(error){
    console.log(error);
});