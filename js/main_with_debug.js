// SVG
var width = 800;
var height = 600;
var svg = d3.select("#myDiv")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
var legend = d3.select("#legend-container")
    .append("svg")
    .attr("width", 550)
    .attr("height", 60)
    .attr("id", "legend");
var colorScale;

// Promise.all 
Promise.all([
    d3.json("./data/hungary1.topojson"),
    d3.csv("./data/HungaryCounties.csv")
]).then(function(data) {

    var topoData = data[0];
    var csvData = data[1];

	window.topoData = topoData;  
	window.csvData = csvData;

    console.log("TopoJSON:", topoData);
    console.log("CSV:", csvData);

    makeMap(topoData, csvData);

}).catch(function(error){
    console.log(error);
});


function makeMap(topoData, csvData) {
    // convert TopoJSON to GeoJSON
    var geojson = topojson.feature(
        topoData,
        topoData.objects.hungary1
    );
	console.log("GeoJSON:", geojson);
    console.log("First feature properties:", geojson.features[0].properties);
    // Using mercator and trying to rotate it to approximate the Hungarian national projection for visualization purposes. Nevermind, that failed too.
	// Why doesn't the d3-geo projection library not have a oblique projection option?
	var projection = d3.geoMercator()                          
    projection.fitSize([width, height], geojson);
    console.log("Projection:", projection);

    var path = d3.geoPath()
        .projection(projection);

    //dropdown
    var variables = [
        "fdi_huf_millions",
        "employment_rate",
        "unemployment_rate",
        "gross_avg_salary_huf",
        "GDP_percapita_huf_thousands",
        "highschool_graduate_rate"
    ];

    var currentVariable = "fdi_huf_millions";

    var variableLabels = {
    fdi_huf_millions: "FDI (HUF, millions)",
    employment_rate: "Employment Rate (%)",
    unemployment_rate: "Unemployment Rate (%)",
    gross_avg_salary_huf: "Gross Average Salary (HUF)",
    GDP_percapita_huf_thousands: "GDP per Capita (HUF, thousands)",
    highschool_graduate_rate: "High School Graduate Rate (%)"
    };

    var dropdown = d3.select("body")
        .append("select")
        .attr("id", "variableDropdown");

    dropdown.selectAll("option")
        .data(variables)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => variableLabels[d]);    
	
    dropdown.property("value", currentVariable);

    function updateMap(variable) {

        // build data map
        var dataMap = {};
        csvData.forEach(function(d) {
        d[variable] = +d[variable];
        dataMap[d.iso_3166_2 = d.iso_3166_2.trim()] = d[variable];
        });

        // values
        var values = csvData
            .map(d => d[variable])
            .filter(v => !isNaN(v));

        // ckmeans clustering
        var clusters = ss.ckmeans(values, 5);

        var breaks = clusters.map(cluster => d3.min(cluster));

        console.log("Clusters:", clusters);
        console.log("Breaks:", breaks);

        // colors
        var domain = breaks.slice(1);

        colorScale = d3.scaleThreshold()
            .domain(domain)
            .range([
                "#ffffcc",
                "#a1dab4",
                "#41b6c4",
                "#2c7fb8",
                "#253494"
            ]);
             
        // legend
        legend.selectAll("*").remove();

        var legendWidth = 550;
        var legendHeight = 10;
        legend.append("text")
            .attr("x", 0)
            .attr("y", -5)
            .text(variableLabels[variable])
            .style("font-size", "12px")
            .style("font-weight", "bold");
        // combine min + breaks for labels
        var legendValues = [d3.min(values)].concat(breaks);

        var colors = colorScale.range();

        // groups
        var legendGroup = legend.selectAll("g")
            .data(colors)
            .enter()
            .append("g")
            .attr("transform", function(d, i) {
                return "translate(" + (i * (legendWidth / colors.length)) + ",0)";
            });

        // rectangles
        legendGroup.append("rect")
            .attr("width", legendWidth / colors.length)
            .attr("height", legendHeight)
            .attr("fill", d => d);

        // labels
        legendGroup.append("text")
            .attr("x", (legendWidth / colors.length) / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .text(function(d, i) {
                var start = legendValues[i];
                var end = legendValues[i + 1];

                if (end !== undefined) {
                    return d3.format(",")(Math.round(start)) + "–" + d3.format(",")(Math.round(end));
                } else {
                    return d3.format(",")(Math.round(start)) + "+";
                }
            })
            .style("font-size", "9px");    

        svg.selectAll("path")
            .transition()
            .duration(500)
            .attr("fill", function(d) {

                var key = d.properties.iso_3166_2?.trim();
                var value = dataMap[key];

            // debug?
                if (value == null) {
                    console.log("Missing value for:", key);
                }

                return value != null ? colorScale(value) : "#ccc";
            });
    }

    // draw path
    svg.selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "county")
    .on("mouseover", function(event, d) {
        var key = d.properties.iso_3166_2.trim();

        // highlight county (black stroke)
        d3.select(this)
            .attr("stroke", "black")
            .attr("stroke-width", 1.2);

        // highlight matching bar
        d3.selectAll(".bar")
            .filter(b => b.iso_3166_2.trim() === key)
            .attr("stroke", "black")
            .attr("stroke-width", 1.2);
    })

    .on("mouseout", function() {

        // reset county
        d3.select(this)
            .attr("stroke", null);

        // reset bars
        d3.selectAll(".bar")
            .attr("stroke", null);
    });

    // map render
    updateMap(currentVariable);
	
    // bar chart render
    makeBarChart(csvData, currentVariable);

    // dropdown interaction
    dropdown.on("change", function() {
        currentVariable = this.value;
        updateMap(currentVariable);
        makeBarChart(csvData, currentVariable);
    });

	// Graticule
	//var graticule = d3.geoGraticule();

	//svg.append("path")
    //	.datum(graticule())
    //	.attr("class", "graticule")
    //	.attr("d", path);//
}

