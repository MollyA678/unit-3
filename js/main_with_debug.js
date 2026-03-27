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
        topoData.objects.HungaryCounties
    );

    // Using oblique mercator from the d3 projection library to approximate the Hungarian national projection (EOV) for visualization purposes
	var projection = d3.geoObliqueMercator()
 		.center([19.5, 47])      // Hungary center
    	.rotate([-19.5, -47])    // aligns projection axis
    	.scale(6000)
    	.translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);
	
	// CSV values to map
	var dataMap = {};

	csvData.forEach(function(d) {
    	dataMap[d.iso_3166_2] = +d.fdi_huf_millions;
	});

	// Color scale
	var colorScale = d3.scaleSequential()
		.domain([
        d3.min(csvData, d => +d.fdi_huf_millions),
        d3.max(csvData, d => +d.fdi_huf_millions)
    	])
    	.interpolator(d3.interpolateBlues);

    // Creating counties
    svg.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "county")
		.attr("fill", function(d) {
        var value = dataMap[d.properties.iso_3166_2];
        return value ? colorScale(value) : "#ccc";
    });

	// Graticule
	var graticule = d3.geoGraticule();

	svg.append("path")
    	.datum(graticule())
    	.attr("class", "graticule")
    	.attr("d", path);
}