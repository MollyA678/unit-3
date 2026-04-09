// SVG
var width = 800;
var height = 600;
var svg = d3.select("#myDiv")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Promise.all 
Promise.all([
    d3.json("./data/HungaryCounties.topojson"),
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
        topoData.objects.ne_10m_admin_1_states_provinces
    );
	console.log("GeoJSON:", geojson);
 
    // Using mercator and trying to rotate it to approximate the Hungarian national projection for visualization purposes. Nevermind, that failed too.
	// Why doesn't the d3-geo projection library not have a oblique projection option?
	var projection = d3.geoMercator()                          
    projection.fitSize([width, height], geojson);
    console.log("Projection:", projection);

    var path = d3.geoPath()
        .projection(projection);
	
	// CSV values to map
	var dataMap = {};

	csvData.forEach(function(d) {
        d.fdi_huf_millions = +d.fdi_huf_millions;
    	dataMap[d.iso_3166_2] = d.fdi_huf_millions;
        
	});
     console.log("Data Map:", dataMap);
	// Color scale: Needs domain array work with ckmeans clustering. jenks is a placeholder
	var values = csvData.map(d => d.fdi_huf_millions);

    var breaks = ss.ckmeans(values, 5).map(d => d3.min(d));
    
    var ylgnbu5 = [
        "#ffffcc",
        "#a1dab4",
        "#41b6c4",
        "#2c7fb8",
        "#253494"
    ];

    var colorScale = d3.scaleThreshold()
        .domain(breaks.slice(1, -1))
        .range(ylgnbu5);
    	
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
	

	// Graticule
	var graticule = d3.geoGraticule();

	svg.append("path")
    	.datum(graticule())
    	.attr("class", "graticule")
    	.attr("d", path);
}

