const width = window.innerWidth;
const height = window.innerHeight;

// pie chart measurements
let pieLeft = 40, pieTop = 40;
let pieMargin = {top: 20, right: 30, bottom: 30, left: 60},
    pieWidth = 350 - pieMargin.left - pieMargin.right,
    pieHeight = 350 - pieMargin.top - pieMargin.bottom;
const radius = Math.min(pieWidth, pieHeight) / 2;

// heatmap measurements
let heatLeft = 40, heatTop = 500;
let heatMargin = {top: 10, right: 30, bottom: 30, left: 60},
    heatWidth = 300 - heatMargin.left - heatMargin.right,
    heatHeight = 300 - heatMargin.top - heatMargin.bottom;

// streamgraph measurements
let streamLeft = 500, streamTop = 40;
let streamMargin = {top: 20, right: 150, bottom: 30, left: 60},
    streamWidth = 980 - streamMargin.left - streamMargin.right,
    streamHeight = 770 - streamMargin.top - streamMargin.bottom;

// parse data
d3.csv("./data/mxmh_survey_results.csv").then(rawData =>{
    console.log("rawData", rawData);

    // process pie chart data
    // sum up occurrences of mental health effects
    const effects = { "Improve": 0, "No effect": 0, "Worsen": 0 };
    rawData.forEach(function(d){
        if (d["Music effects"]) {
            effects[d["Music effects"]] += 1;
        }
    });

    // process heatmap data
    const heatmapData = [];
    const mhIssues = ["Anxiety", "Depression", "Insomnia", "OCD"];
    const heatmapX = mhIssues;
    const heatmapY = ["BPM", "Hours per day"];
    // calculate correlations between bpm, hours per day, and mental health issues
    heatmapY.forEach(variable => {
        heatmapX.forEach(issue => {
            // pair data points with variable and issue
            const pairs = [];
            rawData.forEach(d => {
                const x = +d[variable];
                const y = +d[issue];
                if (!isNaN(x) && !isNaN(y)) {
                    pairs.push({x, y});
                }
            });
            // calculate correlation coefficient
            const l = pairs.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
            pairs.forEach(p => {
                sumX += p.x;
                sumY += p.y;
                sumXY += p.x * p.y;
                sumX2 += p.x * p.x;
                sumY2 += p.y * p.y;
            });
            const cc = (l * sumXY - sumX * sumY) / Math.sqrt((l * sumX2 - sumX * sumX) * (l * sumY2 - sumY * sumY));
            // push to processed heatmap data
            heatmapData.push({
                variable: variable,
                group: issue,
                value: cc
            });
        });
    });

    // process streamgraph data
    const streamData = [];
    // type of genre array
    const genres = ["Frequency [Classical]","Frequency [Country]","Frequency [EDM]","Frequency [Folk]","Frequency [Gospel]","Frequency [Hip hop]","Frequency [Jazz]","Frequency [K pop]","Frequency [Latin]","Frequency [Lofi]","Frequency [Metal]","Frequency [Pop]","Frequency [R&B]","Frequency [Rap]","Frequency [Rock]","Frequency [Video game music]"];
    // type of frequency array
    const frequencies = ["Never", "Rarely", "Sometimes", "Very frequently"];
    // process each frequency for each genre
    genres.forEach(genre => {
        frequencies.forEach((freq) => {
            // calculate mental health score for genre and frequency, higher the better (40 - sum of issues)
            let totalScore = 0;
            let count = 0;
            rawData.forEach(d => {
                // Check if this row matches our current frequency category
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
                    if (validIssues > 0) {
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
    console.log("Stream data:", streamData);


    // plot 1: pie chart for music effects on participants
    const svg = d3.select("svg");

    // set width, height, radius
    const g1 = svg.append("g")
        .attr("width", pieWidth + pieMargin.left + pieMargin.right)
        .attr("height", pieHeight + pieMargin.top + pieMargin.bottom)
        .attr("transform", `translate(${pieLeft + pieWidth/2 + pieMargin.left}, ${pieTop + pieHeight/2 + pieMargin.top})`);

    // set the color scale
    var color = d3.scaleOrdinal()
        .domain(Object.keys(effects))
        .range(d3.schemeSet2);

    // compute values on pie chart
    var pie = d3.pie()
        .value(d => d.value);
        
    // prepare data to pie chart
    var data_ready = pie(d3.entries(effects));

    // create arc generator for chart
    var arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // create path for each music effect
    g1.selectAll('path')
        .data(data_ready)
        .enter()
        .append('path')
            .attr('d', arc)
            .attr('fill', function(d){ return(color(d.data.key)) })
            .attr("stroke", "black")
            .style("stroke-width", "0px")

    // create legend
    const legend = svg.append("g")
        .attr("transform", `translate(${pieLeft + 35}, ${pieTop + pieHeight + 10})`);

    // add keys to the legend
    Object.keys(effects).forEach((key, i) => {
        const g = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
        g.append("rect").attr("width", 18).attr("height", 18).attr("fill", color(key));
        g.append("text").attr("x", 25).attr("y", 14).text(key);
    });

    // add title to chart
    g1.append("text")
        .attr("x", 0)
        .attr("y", -170)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Music Effects on Mental Health");

    // plot 2: heatmap for correlation between bpm, hours per day, mental health issues
    const g2 = svg.append("g")
        .attr("width", heatWidth + heatMargin.left + heatMargin.right)
        .attr("height", heatHeight + heatMargin.top + heatMargin.bottom)
        .attr("transform", `translate(${heatLeft + heatMargin.left}, ${heatTop + heatMargin.top})`);

    // set scale for x axis
    const xHeat = d3.scaleBand()
        .range([0, heatWidth])
        .domain(heatmapY)
        .padding(0.05);

    // set scale for y axis
    const yHeat = d3.scaleBand()
        .range([heatHeight, 0])
        .domain(heatmapX)
        .padding(0.05);

    // append x axis
    g2.append("g")
        .attr("transform", `translate(0, ${heatHeight})`)
        .call(d3.axisBottom(xHeat));

    // append y axis
    g2.append("g")
        .call(d3.axisLeft(yHeat));

    // color scale for correlation
    const colorHeat = d3.scaleSequential()
        .domain([-1, 1])
        .interpolator(d3.interpolatePiYG);

    // create rect for each correlation
    g2.selectAll("rect")
        .data(heatmapData, d => d.group + ':' + d.variable)
        .enter()
        .append("rect")
        .attr("x", d => xHeat(d.variable))
        .attr("y", d => yHeat(d.group))
        .attr("width", xHeat.bandwidth())
        .attr("height", yHeat.bandwidth())
        .style("fill", d => colorHeat(d.value))
        .append("title")
        .text(d => `${d.group} & ${d.variable}: Correlation = ${d.value.toFixed(3)}`);
        
    // add color legend for heatmap
    const legendWidth = 20;
    const legendHeight = heatHeight;
    const legendX = heatWidth + 40;
    
    // create gradient for legend
    const defs = g2.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "heatmap-gradient")
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");
    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorHeat(-1));
    linearGradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", colorHeat(0));
    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorHeat(1));
    
    // draw legend rectangle
    g2.append("rect")
        .attr("x", legendX)
        .attr("y", 0)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#heatmap-gradient)");
    
    // scale for legend axis
    const legendScale = d3.scaleLinear()
        .domain([-1, 1])
        .range([legendHeight, 0]);
        
    // legend axis for correlation values
    const legendAxis = d3.axisRight(legendScale)
        .tickValues([-1, -0.5, 0, 0.5, 1])
        .tickFormat(d3.format(".1f"));
        
    // append axis to legend
    g2.append("g")
        .attr("transform", `translate(${legendX + legendWidth}, 0)`)
        .call(legendAxis);
        
    // legend title
    g2.append("text")
        .attr("x", legendX + legendWidth/2)
        .attr("y", -10)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Correlation");

    // heatmap title
    g2.append("text")
        .attr("x", 150)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Correlation Between Music Variables and Mental Health");


    // plot 3: streamgraph for genre frequency and mental health score
    const g3 = svg.append("g")
        .attr("width", streamWidth + streamMargin.left + streamMargin.right)
        .attr("height", streamHeight + streamMargin.top + streamMargin.bottom)
        .attr("transform", `translate(${streamLeft + streamMargin.left}, ${streamTop + streamMargin.top})`);

    // nest data by frequency
    const nestedData = d3.nest()
        .key(d => d.frequency)
        .entries(streamData);

    // stack generator for streamgraph
    // center the streams vertically
    const stack = d3.stack()
        .keys(genres)
        .value((d, key) => {
            const match = d.values.find(item => item.genre === key);
            return match ? match.score : 0;
        })
        .offset(d3.stackOffsetSilhouette);

    // compute stacked data
    const stackedData = stack(nestedData);

    // set x scale
    const xStream = d3.scaleBand()
        .domain(frequencies)
        .range([0, streamWidth])
        .padding(0.1);

    // set y scale
    const yStream = d3.scaleLinear()
        .domain([d3.min(stackedData.flat().flat()), d3.max(stackedData.flat().flat())])
        .range([streamHeight, 0]);

    // create color scale for genres
    const colorStream = d3.scaleOrdinal()
        .domain(genres)
        .range([
            "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
            "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
            "#bcbd22", "#17becf", "#aec7e8", "#ffbb78",
            "#98df8a", "#ff9896", "#c5b0d5", "#c49c94"
        ]);

    // create area generator
    const area = d3.area()
        .x(d => xStream(d.data.key) + xStream.bandwidth()/2)
        .y0(d => yStream(d[0]))
        .y1(d => yStream(d[1]))
        .curve(d3.curveBasis);

    // add path for each streams
    g3.selectAll("path")
        .data(stackedData)
        .enter()
        .append("path")
        .attr("d", area)
        .attr("fill", d => colorStream(d.key))
        .attr("opacity", 0.8)
        .append("title")
        .text(d => {
            const genreName = d.key.match(/\[(.*?)\]/)[1];
            return genreName;
        });

    // add x axis at bottom
    g3.append("g")
        .attr("transform", `translate(0, ${streamHeight})`)
        .call(d3.axisBottom(xStream));

    // add x axis label
    g3.append("text")
        .attr("x", streamWidth / 2)
        .attr("y", streamHeight + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Frequency of Listening to Music Genre");

    // add y axis
    g3.append("g")
        .call(d3.axisLeft(yStream));

    // add y axis label
    g3.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -40)
        .attr("x", -streamHeight / 2)
        .attr("text-anchor", "middle")
        .text("Mental Health Score Distribution");

    // add legend
    const streamLegend = g3.append("g")
        .attr("transform", `translate(${streamWidth + 20}, 0)`);

    // add legend title
    streamLegend.append("text")
        .attr("x", 0)
        .attr("y", 10)
        .style("font-weight", "bold")
        .text("Music Genres");

    // add legend items
    genres.forEach((genre, i) => {
        const g = streamLegend.append("g")
            .attr("transform", `translate(0, ${i * 20 + 30})`);
        const genreName = genre.match(/\[(.*?)\]/)[1];
        g.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", colorStream(genre))
            .attr("opacity", 0.8);
        g.append("text")
            .attr("x", 25)
            .attr("y", 14)
            .text(genreName);
    });

    // add streamgraph title
    svg.append("text")
        .attr("x", streamLeft + streamWidth/2 + streamMargin.left)
        .attr("y", streamTop + 10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Mental Health Score by Music Genre and Listening Frequency");

}).catch(function(error){
    console.log(error);
});