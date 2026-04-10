// SVG
var width = 800;
var height = 600;
var svg = d3.select("#myDiv")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

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

    var dropdown = d3.select("body")
        .append("select")
        .attr("id", "variableDropdown");

    dropdown.selectAll("option")
        .data(variables)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d.replaceAll("_", " "));    
	
    function updateMap(variable) {

        var dataMap = {};

        csvData.forEach(function(d) {
            d[variable] = +d[variable];
            dataMap[d.iso_3166_2] = d[variable];
        });

        var values = csvData.map(d => d[variable]);

        var breaks = ss.ckmeans(values, 5).map(d => d3.min(d));

        var colorScale = d3.scaleThreshold()
            .domain(breaks.slice(1, -1))
            .range([
                "#ffffcc",
                "#a1dab4",
                "#41b6c4",
                "#2c7fb8",
                "#253494"
            ]);

    svg.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "county");
}
	// CSV values to map
	var dataMap = {};
    	
    // Creating counties
    svg.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "county")
		.attr("fill", function(d) {
        var value = dataMap[d.properties.iso_3166_2];
        return value != null ? colorScale(value) : "#ccc";
    });
	
    // initial render
    updateMap(currentVariable);

    // dropdown interaction
    dropdown.on("change", function() {
        currentVariable = this.value;
        updateMap(currentVariable);
    });
    
	// Graticule
	//var graticule = d3.geoGraticule();

	//svg.append("path")
    //	.datum(graticule())
    //	.attr("class", "graticule")
    //	.attr("d", path);//
}

