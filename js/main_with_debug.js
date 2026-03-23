// This is the main JavaScript file copied from Activity 3. All other comments are new 
function initialize(){
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
    var width = 950;
    var height = 550;

    var svg = d3.select("#myDiv")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
		.attr("class", "container")
		.style("background-color", "rgba(0,0,0,0.2)");

 // XY scale
    var x = d3.scaleLinear()
        .range([90, 810])
        .domain([0, cityPop.length - 1]);
	var y = d3.scaleLinear()
        .range([440, 95])
        .domain([minPop, maxPop]);

    // Max & min pop
    var minPop = d3.min(cityPop, d => d.population);
    var maxPop = d3.max(cityPop, d => d.population);

    // Circles with color scale
    var color = d3.scaleLinear()
        .range(["#FDBE85", "#D94701"])
        .domain([minPop, maxPop]);
    var circles = svg.selectAll(".circles")
        .data(cityPop)
        .enter()
        .append("circle")
        .attr("class", "circles")
        .attr("id", d => d.city)
        .attr("r", function(d){
            var area = d.population * 0.01;
            return Math.sqrt(area / Math.PI);
        })
        .attr("cx", (d, i) => x(i))
        .attr("cy", d => y(d.population))
        .style("fill", d => color(d.population))
        .style("stroke", "black");

    // Labels
    svg.selectAll("text")
        .data(cityPop)
        .enter()
        .append("text")
        .attr("x", (d, i) => x(i))
        .attr("y", d => y(d.population))
        .attr("text-anchor", "middle")
        .text(d => d.city);

    // Moving it around
    var yAxis = d3.axisLeft(y);
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(50, 0)")
        .call(yAxis);
}

document.addEventListener('DOMContentLoaded', initialize);