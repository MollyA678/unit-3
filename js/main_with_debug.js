// main_with_debug.js
// SVG
var width = 800;
var height = 600;
var svg = d3.select("#myDiv")
    .append("svg")
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto");
var countiesG = svg.append("g")
    .attr("id", "counties-layer");
var selectionG = svg.append("g")
    .attr("id", "selection-layer");
var legend = d3.select("#legend-container")
    .append("svg")
    .attr("width", "100%")
    .attr("height", 90)
    .attr("id", "legend")
    .style("overflow", "visible");
var colorScale;

window.selectedCounties = [];   
window.countyDataMap = {};      
 
// attribute table
var variableLabels = {
    fdi_huf_millions: "FDI (HUF, millions)",
    employment_rate: "Employment Rate (%)",
    unemployment_rate: "Unemployment Rate (%)",
    gross_avg_salary_huf: "Gross Avg Salary (HUF)",
    GDP_percapita_huf_thousands: "GDP per Capita (HUF, thousands)",
    highschool_graduate_rate: "HS Graduate Rate (%)"
};
window.variableLabels = variableLabels;

var breakTypes = {
    fdi_huf_millions:            "jenks",
    employment_rate:             "quantile",
    unemployment_rate:           "jenks",
    gross_avg_salary_huf:        "jenks",
    GDP_percapita_huf_thousands: "jenks",
    highschool_graduate_rate:    "stddev"
};


var allVars = Object.keys(variableLabels);
 
function getMenuValues() {
    return {
        var1: d3.select("#menu1").property("value"),
        var2: d3.select("#menu2").property("value"),
        var3: d3.select("#menu3").property("value")
    };
}
 
function formatValue(key, val) {
    if (val == null || isNaN(val)) return "—";
    if (key === "fdi_huf_millions" || key === "gross_avg_salary_huf") {
        return d3.format(",")(Math.round(val));
    }
    if (key === "GDP_percapita_huf_thousands") {
        return d3.format(",")(Math.round(val));
    }
    return (+val).toFixed(1);
}
 
function renderAttributeTable(slotId, countyKey) {
    var slot = document.getElementById(slotId);
    if (!countyKey) {
        slot.innerHTML = '<div class="table-slot-empty"><span class="empty-hint">' +
            (slotId === "table-slot-1" ? "Click a county to<br>view its data" : "Click a second county<br>to compare") +
            '</span></div>';
        slot.classList.remove("has-data");
        return;
    }
 
    var row = window.countyDataMap[countyKey];
    if (!row) return;
 
    var v = getMenuValues();
 
    slot.classList.add("has-data");
 
    var html = '<div class="attr-table-wrap">';
    html += '<div class="attr-table-header">';
    html += '<span class="attr-county-name">' + (row.county_name || countyKey) + '</span>';
    html += '<button class="attr-close-btn" onclick="deselectCounty(\'' + countyKey + '\')">&times;</button>';
    html += '</div>';
    html += '<table class="attr-table">';
 
    allVars.forEach(function(key) {
        var rowClass = "";
        if (key === v.var1) rowClass = "attr-row-red";
        else if (v.var2 !== "none" && key === v.var2) rowClass = "attr-row-orange";
        else if (v.var3 !== "none" && key === v.var3) rowClass = "attr-row-purple";
 
        html += '<tr class="' + rowClass + '">';
        html += '<td>' + variableLabels[key] + '</td>';
        html += '<td>' + formatValue(key, +row[key]) + '</td>';
        html += '</tr>';
    });
 
    html += '</table></div>';
    slot.innerHTML = html;
}
 
function refreshAttributeTables() {
    renderAttributeTable("table-slot-1", window.selectedCounties[0] || null);
    renderAttributeTable("table-slot-2", window.selectedCounties[1] || null);
}
 
window.deselectCounty = function(key) {
    var idx = window.selectedCounties.indexOf(key);
    if (idx === -1) return;
    window.selectedCounties.splice(idx, 1);
    window.applySelectionStyles();
    refreshAttributeTables();
};
 
function handleCountyClick(key) {
    var sel = window.selectedCounties;
    var idx = sel.indexOf(key);
 
    if (idx !== -1) {
        // deselect
        sel.splice(idx, 1);
    } else {
        if (sel.length < 2) {
            sel.push(key);
        } else {
            // Replace selection 1
            sel.shift();
            sel.push(key);
        }
    }
 
    window.applySelectionStyles();
    refreshAttributeTables();
}

// tooltip
 
function showTooltip(event, countyName) {
    d3.select("#tooltip")
        .style("display", "block")
        .text(countyName);
 
    // Position near cursor
    var ttW = d3.select("#tooltip").node().offsetWidth;
    var ttH = d3.select("#tooltip").node().offsetHeight;
    var x = Math.min(event.pageX + 12, window.scrollX + window.innerWidth  - ttW - 8);
    var y = Math.min(event.pageY + 12, window.scrollY + window.innerHeight - ttH - 8);
    d3.select("#tooltip")
        .style("left", x + "px")
        .style("top",  y + "px");
}
 
function hideTooltip() {
    d3.select("#tooltip").style("display", "none");
}

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

    csvData.forEach(function(d) {
        window.countyDataMap[d.iso_3166_2.trim()] = d;
    });

    makeMap(topoData, csvData);

}).catch(function(error){
    console.log(error);
});

// Map rendering
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

    window.path = d3.geoPath().projection(projection);
    var path = window.path;

    // selection handling
function applySelectionStyles() {
    var sel = window.selectedCounties;

    // reset county strokes
    countiesG.selectAll("path.county")
        .classed("county-selected-1", false)
        .classed("county-selected-2", false)
        .style("stroke", null)
        .style("stroke-width", null);

    // clear overlay
    selectionG.selectAll("*").remove();

    // For each selected county, draw a ghost path in the overlay layer to avoid clip
    [sel[0], sel[1]].forEach(function(key, idx) {
        if (!key) return;
        var colorClass = idx === 0 ? "county-selected-1" : "county-selected-2";
        var strokeColor = idx === 0 ? "#6d6d6d" : "#6d6d6d";

        // find OG feature
        var originalPath = countiesG.select("#county-" + key);
        if (originalPath.empty()) return;
        var datum = originalPath.datum();

        selectionG.append("path")
            .datum(datum)
            .attr("d", path)          
            .attr("class", "county county-overlay " + colorClass)
            .attr("id", "overlay-county-" + key)
            .style("fill", originalPath.style("fill") || colorScale(window.countyDataMap[key] ? +window.countyDataMap[key][getMenuValues().var1] : 0))
            .style("stroke", strokeColor)
            .style("stroke-width", "3.5px")
            .style("pointer-events", "none"); 
    });

    // chart elements
    d3.selectAll(".chart-element")
        .classed("chart-selected-1", false)
        .classed("chart-selected-2", false);

    if (sel[0]) {
        d3.selectAll(".chart-element")
            .filter(function(d) { return d && (d.iso_3166_2 || "").trim() === sel[0]; })
            .classed("chart-selected-1", true);
    }
    if (sel[1]) {
        d3.selectAll(".chart-element")
            .filter(function(d) { return d && (d.iso_3166_2 || "").trim() === sel[1]; })
            .classed("chart-selected-2", true);
    }
}

window.applySelectionStyles = applySelectionStyles;

    var nameMap = {};
    csvData.forEach(function(d) {
        nameMap[d.iso_3166_2.trim()] = d.county_name;
    });

    // Map uses only menu1
    function updateMap(variable) {

        // build data map
        var dataMap = {};
        csvData.forEach(function(d) {
        d[variable] = +d[variable];
        dataMap[d.iso_3166_2.trim()] = d[variable];
       });

        // values
        var values = csvData
            .map(d => d[variable])
            .filter(v => !isNaN(v));

        // ckmeans clustering with apt break types and colors
        var domain;
        var type = breakTypes[variable] || "jenks";

        if (type === "jenks") {
            var clusters = ss.ckmeans(values, 5);
            var breaks = clusters.map(cluster => d3.min(cluster));
            domain = breaks.slice(1);

        } else if (type === "quantile") {
            colorScale = d3.scaleQuantile()
                .domain(values)
                .range(["#ffffcc","#a1dab4","#41b6c4","#2c7fb8","#253494"]);
            domain = null; // scaleQuantile doesn't use scaleThreshold

        } else if (type === "stddev") {
            var mean = ss.mean(values);
            var std  = ss.standardDeviation(values);
            domain = [mean - std, mean - std * 0.25, mean + std * 0.25, mean + std];
        }

        if (domain !== null) {
            colorScale = d3.scaleThreshold()
                .domain(domain)
                .range(["#ffffcc","#a1dab4","#41b6c4","#2c7fb8","#253494"]);
        }
             
        // legend
        legend.selectAll("*").remove();

        var legendWidth = document.getElementById("legend-container").getBoundingClientRect().width || 700;
        legendWidth = Math.max(legendWidth - 40, 400);        var legendHeight = 10;
        legend.append("text")
            .attr("x", 0)
            .attr("y", 10)
            .text(variableLabels[variable])
            .style("font-size", "13px")
            .style("font-weight", "600")
            .style("fill", "white")
            .style("font-family", "DM Sans, sans-serif");

        // combine min + breaks for labels
        var legendValues = [d3.min(values)].concat(breaks);

        var colors = colorScale.range();

        // groups
        var legendGroup = legend.selectAll("g")
            .data(colors)
            .enter()
            .append("g")
            .attr("transform", function(d, i) {
                return "translate(" + (i * (legendWidth / colors.length)) + ",20)";
            });

        // rectangles
        legendGroup.append("rect")
            .attr("width", legendWidth / colors.length)
            .attr("height", legendHeight)
            .attr("fill", d => d);

        // labels
        var slotW = legendWidth / colors.length;
        // measure space and determine font size
        var maxChars = colors.length === 5 ? 14 : 12; // "1,669,100–3,159,100" ~ 19 chars worst case
        var fontSize = Math.max(7, Math.min(12, Math.floor(slotW / maxChars * 1.4)));

        legendGroup.append("text")
            .attr("x", slotW / 2)
            .attr("y", 28)
            .attr("text-anchor", "middle")
            .style("font-size", fontSize + "px")
            .style("fill", "white")
            .style("font-family", "DM Sans, sans-serif")
            .text(function(d, i) {
                if (type === "quantile") {
                    var q = colorScale.quantiles();
                    var start = i === 0 ? d3.min(values) : q[i - 1];
                    var end = q[i];
                    return end !== undefined
                        ? d3.format(",")(Math.round(start)) + "–" + d3.format(",")(Math.round(end))
                        : d3.format(",")(Math.round(start)) + "+";
                }
                var start = legendValues[i];
                var end = legendValues[i + 1];
                return end !== undefined
                    ? d3.format(",")(Math.round(start)) + "–" + d3.format(",")(Math.round(end))
                    : d3.format(",")(Math.round(start)) + "+";
            });   

        // County transition    
        countiesG.selectAll("path.county")
            .transition()
            .duration(500)
            .style("fill", function(d) {

                var key = (d.properties.iso_3166_2 || "").trim();
                var value = dataMap[key];

        selectionG.selectAll("path.county-overlay")
            .each(function(d) {
                var key = (d.properties.iso_3166_2 || "").trim();
                var val = +window.countyDataMap[key][variable];
                d3.select(this).style("fill", colorScale(val));
            });

            // debug?
                if (value == null) {
                    console.log("Missing value for:", key);
                }

                return value != null ? colorScale(value) : "#ccc";
            });
        refreshAttributeTables();
    }

    // draw path
    countiesG.selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "county")
    .attr("id", function(d) { 
        return "county-" + (d.properties.iso_3166_2 || "").trim();
    })

    // select
    .on("click", function(event, d) {
            var key = (d.properties.iso_3166_2 || "").trim();
            handleCountyClick(key);
    })
    // coordinated highlight
    .on("mouseover", function(event, d) {
        var key = (d.properties.iso_3166_2 || "").trim();
        var name = nameMap[key] || key;

        // Only apply hover stroke if not already selected
            if (!window.selectedCounties.includes(key)) {
                d3.select(this)
                    .raise()
                    .style("stroke", "black")
                    .style("stroke-width", "3px");
            }
 
            d3.selectAll(".chart-element")
                .filter(function(cd) {
                    return cd && (cd.iso_3166_2 || "").trim() === key;
                })
                .filter(function() {
                    return !this.classList.contains("chart-selected-1") &&
                           !this.classList.contains("chart-selected-2");
                })
                .style("stroke", "black")
                .style("stroke-width", "2.5px");
 
            showTooltip(event, name);
        })
        
    .on("mousemove", function(event) {
        // tooltip follow
        var ttW = d3.select("#tooltip").node().offsetWidth;
        var ttH = d3.select("#tooltip").node().offsetHeight;
        var x = Math.min(event.pageX + 12, window.scrollX + window.innerWidth  - ttW - 8);
        var y = Math.min(event.pageY + 12, window.scrollY + window.innerHeight - ttH - 8);
        d3.select("#tooltip").style("left", x + "px").style("top", y + "px");
    })

    .on("mouseout", function(event, d) {
            var key = (d.properties.iso_3166_2 || "").trim();
 
            if (!window.selectedCounties.includes(key)) {
                d3.select(this)
                    .style("stroke", null)
                    .style("stroke-width", null);
            }
 
            d3.selectAll(".chart-element")
                .filter(function() {
                    return !this.classList.contains("chart-selected-1") &&
                           !this.classList.contains("chart-selected-2");
                })
                .style("stroke", null)
                .style("stroke-width", null);
 
            hideTooltip();
        });
    
    // Menu render
        var init = getMenuValues();

    // map render
    updateMap(init.var1);
	
    // bar chart render
    updateChart(csvData, init.var1, init.var2, init.var3);

    // dropdown interactions
   d3.selectAll("#menu1, #menu2, #menu3").on("change", function() {
        var v = getMenuValues();
        updateMap(v.var1);
        updateChart(csvData, v.var1, v.var2, v.var3);
    });

    function syncMenu3State() {
        var val = d3.select("#menu2").property("value");
        var menu3 = document.getElementById("menu3");
        if (val === "none") {
            menu3.disabled = true;
            menu3.value = "none";
        } else {
            menu3.disabled = false;
        }
    }

    syncMenu3State();
    d3.select("#menu2").on("change.sync", syncMenu3State);

	// Graticule
	//var graticule = d3.geoGraticule();

	//svg.append("path")
    //	.datum(graticule())
    //	.attr("class", "graticule")
    //	.attr("d", path);//

    window._updateMap = updateMap;

}

