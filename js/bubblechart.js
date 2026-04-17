// margins
var margin = { top: 20, right: 20, bottom: 80, left: 80 };

window.chartWidth = Math.floor(window.innerWidth * 0.35) - margin.left - margin.right;
window.chartHeight = 400 - margin.top - margin.bottom;

var chartWidth = window.chartWidth;
var chartHeight = window.chartHeight;

var chart = d3.select("#chart")
    .append("svg")
    .attr("width", chartWidth + margin.left + margin.right)
    .attr("height", chartHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// flannery
function flanneryScale(value, min, max) {
    var minRadius = 5;
    var maxRadius = 40;

    return minRadius + (Math.pow(value / max, 0.57) * (maxRadius - minRadius));
}

// choose chart type
function updateChart(csvData, var1, var2, var3) {
    // Parse columns
    csvData.forEach(function(d) {
        d[var1] = +d[var1];
        if (var2 !== "none") d[var2] = +d[var2];
        if (var3 !== "none") d[var3] = +d[var3];
    });

    // Clear chart
    chart.selectAll("*").remove();

    if (var2 === "none") {

        // bar chart
        csvData.sort((a, b) => b[var1] - a[var1]);

        var xScale = d3.scaleBand()
            .domain(csvData.map(d => d.iso_3166_2))
            .range([0, chartWidth])
            .padding(0.1);

        var yScale = d3.scaleLinear()
            .domain([0, d3.max(csvData, d => d[var1])])
            .range([chartHeight, 0]);

        chart.selectAll(".chart-element")
            .data(csvData, d => d.iso_3166_2)
            .enter()
            .append("rect")
            .attr("class", "chart-element")
            .attr("id", d => "chart-element-" + (d.iso_3166_2 || "").trim())
            .attr("x", d => xScale(d.iso_3166_2))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(d[var1]))
            .attr("height", d => chartHeight - yScale(d[var1]))
            .attr("fill", d => colorScale(d[var1]))
            .on("mouseover", function(event, d) {
                var key = (d.iso_3166_2 || "").trim();
                d3.select(this)
                    .style("stroke", "black")
                    .style("stroke-width", "2.5px");
                var countyNode = d3.select("#county-" + key);
                countyNode.raise();
                countyNode.style("stroke", "black").style("stroke-width", "3px");
                d3.select("#tooltip")
                    .style("display", "block")
                    .text(d.county_name);
                var ttW = d3.select("#tooltip").node().offsetWidth;
                var ttH = d3.select("#tooltip").node().offsetHeight;
                var x = Math.min(event.pageX + 12, window.scrollX + window.innerWidth  - ttW - 8);
                var y = Math.min(event.pageY + 12, window.scrollY + window.innerHeight - ttH - 8);
                d3.select("#tooltip")
                    .style("left", x + "px")
                    .style("top", y + "px");
            })
            .on("mousemove", function(event) {
                var ttW = d3.select("#tooltip").node().offsetWidth;
                var ttH = d3.select("#tooltip").node().offsetHeight;
                var x = Math.min(event.pageX + 12, window.scrollX + window.innerWidth  - ttW - 8);
                var y = Math.min(event.pageY + 12, window.scrollY + window.innerHeight - ttH - 8);
                d3.select("#tooltip")
                    .style("left", x + "px")
                    .style("top", y + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .style("stroke", null)
                    .style("stroke-width", null);
                d3.selectAll(".county")
                    .style("stroke", null)
                    .style("stroke-width", null);
                d3.select("#tooltip")
                    .style("display", "none");
            });

        chart.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale));
        chart.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + chartHeight + ")")
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("font-size", "10px");

    } else if (var3 === "none") {

        // scatter plot
        var xScale = d3.scaleLinear()
            .domain([0, d3.max(csvData, d => d[var1])])
            .range([0, chartWidth]);

        var yScale = d3.scaleLinear()
            .domain([0, d3.max(csvData, d => d[var2])])
            .range([chartHeight, 0]);

        chart.selectAll(".chart-element")
            .data(csvData, d => d.iso_3166_2)
            .enter()
            .append("circle")
            .attr("class", "chart-element")
            .attr("id", d => "chart-element-" + (d.iso_3166_2 || "").trim())
            .attr("cx", d => xScale(d[var1]))
            .attr("cy", d => yScale(d[var2]))
            .attr("r", 8)
            .attr("fill", d => colorScale(d[var1]))
            .on("mouseover", function(event, d) {
                var key = (d.iso_3166_2 || "").trim();
                d3.select(this)
                    .style("stroke", "black")
                    .style("stroke-width", "2.5px");
                var countyNode = d3.select("#county-" + key);
                countyNode.raise();
                countyNode
                    .style("stroke", "black")
                    .style("stroke-width", "3px");
                d3.select("#tooltip")
                    .style("display", "block")
                    .text(d.county_name);
                var ttW = d3.select("#tooltip").node().offsetWidth;
                var ttH = d3.select("#tooltip").node().offsetHeight;
                var x = Math.min(event.pageX + 12, window.scrollX + window.innerWidth  - ttW - 8);
                var y = Math.min(event.pageY + 12, window.scrollY + window.innerHeight - ttH - 8);
                d3.select("#tooltip")
                    .style("left", x + "px")
                    .style("top", y + "px");
            })
            .on("mousemove", function(event) {
                var ttW = d3.select("#tooltip").node().offsetWidth;
                var ttH = d3.select("#tooltip").node().offsetHeight;
                var x = Math.min(event.pageX + 12, window.scrollX + window.innerWidth  - ttW - 8);
                var y = Math.min(event.pageY + 12, window.scrollY + window.innerHeight - ttH - 8);
                d3.select("#tooltip")
                    .style("left", x + "px")
                    .style("top", y + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .style("stroke", null)
                    .style("stroke-width", null);
                d3.selectAll(".county")
                    .style("stroke", null)
                    .style("stroke-width", null);
                d3.select("#tooltip")
                    .style("display", "none");
            });

        chart.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale));
        chart.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + chartHeight + ")")
            .call(d3.axisBottom(xScale));

    } else {

        // bubble chart
        var xScale = d3.scaleLinear()
            .domain([0, d3.max(csvData, d => d[var1])])
            .range([0, chartWidth]);

        var yScale = d3.scaleLinear()
            .domain([0, d3.max(csvData, d => d[var2])])
            .range([chartHeight, 0]);

        var sizeMin = d3.min(csvData, d => d[var3]);
        var sizeMax = d3.max(csvData, d => d[var3]);

        chart.selectAll(".chart-element")
            .data(csvData, d => d.iso_3166_2)
            .enter()
            .append("circle")
            .attr("class", "chart-element")
            .attr("id", d => "chart-element-" + (d.iso_3166_2 || "").trim())
            .attr("cx", d => xScale(d[var1]))
            .attr("cy", d => yScale(d[var2]))
            .attr("r", d => flanneryScale(d[var3], sizeMin, sizeMax))
            .attr("fill", d => colorScale(d[var1]))
            .attr("fill-opacity", 0.8)
            .on("mouseover", function(event, d) {
                var key = (d.iso_3166_2 || "").trim();
                d3.select(this)
                    .style("stroke", "black")
                    .style("stroke-width", "2.5px");
                var countyNode = d3.select("#county-" + key);
                countyNode.raise();
                countyNode.style("stroke", "black").style("stroke-width", "3px");
                d3.select("#tooltip")
                    .style("display", "block")
                    .text(d.county_name);
                var ttW = d3.select("#tooltip").node().offsetWidth;
                var ttH = d3.select("#tooltip").node().offsetHeight;
                var x = Math.min(event.pageX + 12, window.scrollX + window.innerWidth  - ttW - 8);
                var y = Math.min(event.pageY + 12, window.scrollY + window.innerHeight - ttH - 8);
                d3.select("#tooltip")
                    .style("left", x + "px")
                    .style("top", y + "px");
            })
            .on("mousemove", function(event) {
                var ttW = d3.select("#tooltip").node().offsetWidth;
                var ttH = d3.select("#tooltip").node().offsetHeight;
                var x = Math.min(event.pageX + 12, window.scrollX + window.innerWidth  - ttW - 8);
                var y = Math.min(event.pageY + 12, window.scrollY + window.innerHeight - ttH - 8);
                d3.select("#tooltip")
                    .style("left", x + "px")
                    .style("top", y + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .style("stroke", null)
                    .style("stroke-width", null);
                d3.selectAll(".county")
                    .style("stroke", null)
                    .style("stroke-width", null);
                d3.select("#tooltip")
                    .style("display", "none");
            });

        chart.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale));
        chart.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + chartHeight + ")")
            .call(d3.axisBottom(xScale));
    }
}

// This is the main JavaScript file copied from Activity 3. All other comments are new to Activity 9 
/*function initialize(){
	cities()
};

function cities(){
var cityPop = [
	{ 
		city: 'Madison',
		population: 233209
	},
	{
		city: 'Milwaukee',
		population: 594833
	},
	{
		city: 'Green Bay',
		population: 104057
	},
	{
		city: 'Superior',
		population: 27244
	}
];
var table = document.createElement("table");
var headerRow = document.createElement("tr");
table.appendChild(headerRow);
headerRow.insertAdjacentHTML('beforeend', '<th>City</th><th>Population</th>');
cityPop.forEach(function(cityObject){
	var rowHtml = '<tr><td>' + cityObject.city + '</td><td>' + cityObject.population + '</td></tr>';
	table.insertAdjacentHTML('beforeend', rowHtml);
});
document.querySelector("#myDiv").appendChild(table);

addColumns(cityPop)
addEvents()
// Calling Bubbles
createBubbles(cityPop)
};


function addColumns(cityPop){
    
    document.querySelectorAll("tr").forEach(function(row, i){

    	if (i == 0){
    		row.insertAdjacentHTML('beforeend', '<th>City Size</th>');
    	} else {

    		var citySize;

    		if (cityPop[i-1].population < 100000){
    			citySize = 'Small';

    		} else if (cityPop[i-1].population < 500000){
				citySize = 'Medium';

    		} else {
    			citySize = 'Large';
    		};
			row.insertAdjacentHTML('beforeend', '<td>' + citySize + '</td>');
    	};
    });
};

function addEvents(){

    var table = document.querySelector("table");
	table.addEventListener("mouseover", function(){
		
		var color = "rgb(";

		for (var i=0; i<3; i++){

			var random = Math.round(Math.random() * 255);
			color += random;

			if (i<2){
				color += ",";
			
			} else {
				color += ")";
		};
	    };
		table.style.color = color;
	});

	function clickme(){

		alert('Hey, you clicked me!');
	};
	table.addEventListener("click", clickme)
};

// Function for the bubbles
function createBubbles(cityPop){

    // SVG 
    var width = 1050;
    var height = 550;

	// Margins because the circles are still going off the chart
	var margin = {top: 50, right: 50, bottom: 50, left: 80};
    var innerWidth = width - margin.left - margin.right;
    var innerHeight = height - margin.top - margin.bottom;

    var svg = d3.select("#myDiv")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
		.attr("class", "container")
		.style("background-color", "rgba(0,0,0,0.2)");

	// Shifting the margins
	var container = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

 // Max & min pop
    var minPop = d3.min(cityPop, d => d.population);
    var maxPop = d3.max(cityPop, d => d.population);

 // XY scale
 // Had some axis overlap issues
	var x = d3.scaleLinear()
    .range([60, innerWidth - 60])
    .domain([0, cityPop.length - 1]);
	// circles were going off chart 	
	var y = d3.scaleLinear()
    .range([innerHeight, 0])  
    .domain([minPop, maxPop]);

    // Circles with color scale
    var color = d3.scaleLinear()
        .range(["#FDBE85", "#D94701"])
        .domain([minPop, maxPop]);
container.selectAll("circle")
        .data(cityPop)
        .enter()
        .append("circle")
        .attr("cx", (d, i) => x(i))
        .attr("cy", d => y(d.population))
        .attr("r", function(d){
            var area = d.population * 0.01;
            return Math.sqrt(area / Math.PI);
        })
        .style("fill", d => color(d.population))
        .style("stroke", "black");


    // Labels
    container.selectAll("text")
        .data(cityPop)
        .enter()
        .append("text")
        .attr("x", (d, i) => x(i))
        .attr("y", d => y(d.population))
        .attr("text-anchor", "middle")
		.attr("dy", "0.35em")
        .text(d => d.city);

    // Moving it around
    var yAxis = d3.axisLeft(y);
    container.append("g")
        .call(yAxis);
}

document.addEventListener('DOMContentLoaded', initialize);*/