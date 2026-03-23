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

    // Create SVG container
    var width = 600;
    var height = 300;

    var svg = d3.select("#myDiv")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Scale size and create
    var radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(cityPop, d => d.population)])
        .range([10, 50]);

    var circles = svg.selectAll("circle")
        .data(cityPop)
        .enter()
        .append("circle")
        .attr("cx", (d, i) => (i * 120) + 80)
        .attr("cy", height / 2)
        .attr("r", d => radiusScale(d.population))

    // Labels
    var labels = svg.selectAll("text")
        .data(cityPop)
        .enter()
        .append("text")
        .attr("x", (d, i) => (i * 120) + 80)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text(d => d.city);
}

document.addEventListener('DOMContentLoaded', initialize);