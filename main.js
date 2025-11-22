// Configuration
const width = 960;
const height = 600;

// State variables (simplified)
let currentState = null;
let statesData = null;
let countiesData = null;
let vaccinationData = {};
let countyNames = {};
let selectedYear = null;
let availableYears = [];

// Create SVG
const svg = d3.select("#map");
const g = svg.append("g");

// Projection
const projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(1000);

const path = d3.geoPath().projection(projection);

// Color scale for choropleth
const colorScale = d3.scaleSequential()
    .domain([0, 100])
    .interpolator(d3.interpolateBlues);

// Create gradient for legend
const legendGradient = d3.select("#legend-gradient");
for (let i = 0; i <= 100; i++) {
    legendGradient.append("div")
        .style("width", "2px")
        .style("height", "20px")
        .style("background-color", colorScale(i))
        .style("display", "inline-block");
}

// Tooltip
const tooltip = d3.select("#tooltip");

// Event listeners
d3.select("#reset-btn").on("click", resetMap);

d3.select("#year-select").on("change", function() {
    selectedYear = this.value;
    if (currentState) {
        updateCountyColors();
        updateInfoPanel();
    }
});

// Load all data
<<<<<<< Updated upstream

    
    // Set available years
    availableYears = summary.years_available;
    selectedYear = availableYears[availableYears.length - 1].toString(); // Most recent year
    
    // Populate year selector
    const yearSelect = d3.select("#year-select");
    yearSelect.selectAll("option")
        .data(availableYears)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d)
        .property("selected", d => d.toString() === selectedYear);
    
    // Hide loading message
    d3.select(".loading").style("display", "none");
    
    // Draw initial map
    drawStates();
    
}).catch(error => {
    console.error("Error loading data:", error);
    d3.select(".loading")
        .html(`<div class="error-message">Error loading data. Please ensure all data files are in the same directory.</div>`);
});
=======
Promise.all([
    d3.json("./data/states-10m.json"),
    d3.json("./data/counties-10m.json")
])
    .then(([states, counties]) => {
        statesData = topojson.feature(states, states.objects.states);
        countiesData = topojson.feature(counties, counties.objects.counties);

        console.log("TopoJSON loaded:", statesData, countiesData);

        drawStates();
    })
    .catch(err => console.error("Failed to load map files", err));

// // Set available years
availableYears = summary.years_available;
selectedYear = availableYears[availableYears.length - 1].toString(); // Most recent year


// Populate year selector
const yearSelect = d3.select("#year-select");
yearSelect.selectAll("option")
    .data(availableYears)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d)
    .property("selected", d => d.toString() === selectedYear);


// normalize county format
function getCountyFIPS(county) {
    return county.properties.STATEFP + county.properties.COUNTYFP;
}

// Hide loading message
d3.select(".loading").style("display", "none");

>>>>>>> Stashed changes

// Draw US states
function drawStates() {
    g.selectAll("path")
        .data(statesData.features)
        .enter()
        .append("path")
        .attr("class", "state")
        .attr("d", path)
        .attr("fill", "#4CAF50")
        .on("click", handleStateClick)
        .on("mouseover", showStateTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
}

// Handle state click - zoom and show counties
function handleStateClick(event, d) {
    event.stopPropagation();
    currentState = d;
    
    // Calculate zoom parameters
    const bounds = path.bounds(d);
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    const x = (bounds[0][0] + bounds[1][0]) / 2;
    const y = (bounds[0][1] + bounds[1][1]) / 2;
    const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
    const translate = [width / 2 - scale * x, height / 2 - scale * y];
    
    // Smooth transition: hide states
    g.selectAll(".state")
        .transition()
        .duration(750)
        .style("opacity", 0)
        .on("end", function() {
            d3.select(this).style("display", "none");
        });
    
    // Filter counties for this state
    const stateFIPS = d.id;
<<<<<<< Updated upstream
    const stateCounties = countiesData.features.filter(county => 
        Math.floor(county.id / 1000) === stateFIPS
=======
    const stateCounties = countiesData.features.filter(county =>
        county.id.slice(0, 2) === stateFIPS
>>>>>>> Stashed changes
    );
    
    // Draw counties with smooth entrance
    g.selectAll(".county")
        .data(stateCounties)
        .enter()
        .append("path")
        .attr("class", "county")
        .attr("d", path)
        .attr("fill", d => getCountyColor(d))
        .style("opacity", 0)
        .on("click", handleCountyClick)
        .on("mouseover", showCountyTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip)
        .transition()
        .duration(500)
        .delay(750)
        .style("opacity", 1);
    
    // Zoom transition
    g.transition()
        .duration(750)
        .attr("transform", `translate(${translate}) scale(${scale})`);
    
    // Show reset button
    d3.select("#reset-btn")
        .style("display", "block")
        .style("opacity", 0)
        .transition()
        .duration(300)
        .delay(750)
        .style("opacity", 1);
    
    // Update info panel
    updateInfoPanel({ type: "state", data: d });
}

// Handle county click - show details
function handleCountyClick(event, d) {
    event.stopPropagation();
    
    // Remove previous selection
    g.selectAll(".county").classed("selected", false);
    
    // Highlight selected county
    d3.select(event.currentTarget).classed("selected", true);
    
    // Display county details
    // displayCountyDetails(d);
    updateInfoPanel({ type: "county", data: d });
}

// Get county name from FIPS
function getCountyName(fips) {
    if (countyNames[fips]) {
        return `${countyNames[fips].county}, ${countyNames[fips].state}`;
    }
    return `County ${fips}`;
}

// Get state name from FIPS
function getStateName(id) {
    const stateNames = {
        1: "Alabama", 2: "Alaska", 4: "Arizona", 5: "Arkansas",
        6: "California", 8: "Colorado", 9: "Connecticut", 10: "Delaware",
        12: "Florida", 13: "Georgia", 15: "Hawaii", 16: "Idaho",
        17: "Illinois", 18: "Indiana", 19: "Iowa", 20: "Kansas",
        21: "Kentucky", 22: "Louisiana", 23: "Maine", 24: "Maryland",
        25: "Massachusetts", 26: "Michigan", 27: "Minnesota", 28: "Mississippi",
        29: "Missouri", 30: "Montana", 31: "Nebraska", 32: "Nevada",
        33: "New Hampshire", 34: "New Jersey", 35: "New Mexico", 36: "New York",
        37: "North Carolina", 38: "North Dakota", 39: "Ohio", 40: "Oklahoma",
        41: "Oregon", 42: "Pennsylvania", 44: "Rhode Island", 45: "South Carolina",
        46: "South Dakota", 47: "Tennessee", 48: "Texas", 49: "Utah",
        50: "Vermont", 51: "Virginia", 53: "Washington", 54: "West Virginia",
        55: "Wisconsin", 56: "Wyoming"
    };
    return stateNames[id] || "Unknown State";
}

<<<<<<< Updated upstream
// Update info panel when state is selected
function updateInfoPanel() {
    if (!currentState) return;
    
    const stateName = getStateName(currentState.id);
    
    const html = `
        <div class="county-details">
            <h3>${stateName}</h3>
            <p class="intro-text">
                Showing vaccination rates for ${selectedYear}.
                Click on any county to view detailed data.
            </p>
        </div>
    `;
    
    d3.select("#county-details-container").html(html);
=======
function updateInfoPanel(view) {
    // Ig not select, clear sidebar
    if (!view) {
        d3.select("#county-details-container").html("");
        return;
    }

    // === State View ===
    if (view.type === "state") {
        const stateName = getStateName(view.data.id);

        const html = `
            <div class="state-details">
                <h3>${stateName}</h3>
                <p class="intro-text">
                    Showing counties for ${selectedYear}.<br>
                    Click a county to view details.
                </p>
            </div>
        `;

        d3.select("#county-details-container").html(html);
    }

    // === County View ===
    if (view.type === "county") {
        const county = view.data;
        const fips = county.id;
        const countyName = getCountyName(fips);
        const value = getVaccinationValue(fips, selectedYear);

        const html = `
            <div class="county-details">
                <h3>${countyName}</h3>
                <p><strong>${selectedYear} Fully Vaccinated:</strong></p>
                <div class="metric-value">${value !== null ? value.toFixed(1) + '%' : 'No Data'}</div>
            </div>
        `;

        d3.select("#county-details-container").html(html);
    }
>>>>>>> Stashed changes
}


// // Update info panel when state is selected
// function updateInfoPanel() {
//     if (!currentState) return;

//     const stateName = getStateName(currentState.id);

//     const html = `
//         <div class="county-details">
//             <h3>${stateName}</h3>
//             <p class="intro-text">
//                 Showing vaccination rates for ${selectedYear}.
//                 Click on any county to view detailed data.
//             </p>
//         </div>
//     `;

//     d3.select("#county-details-container").html(html);
// }

// Reset to full US map
function resetMap() {
    currentState = null;
    
    // Remove counties with smooth fade
    g.selectAll(".county")
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();
    
    // Show states
    g.selectAll(".state")
        .style("display", "block")
        .transition()
        .duration(500)
        .delay(500)
        .style("opacity", 1);
    
    // Reset zoom
    g.transition()
        .duration(750)
        .attr("transform", "");
    
    // Hide reset button
    d3.select("#reset-btn")
        .transition()
        .duration(300)
        .style("opacity", 0)
        .on("end", function() {
            d3.select(this).style("display", "none");
        });
    
    // Reset info panel
    updateInfoPanel(null);
}

// Tooltip functions
function showStateTooltip(event, d) {
    const name = getStateName(d.id);
    tooltip
        .style("display", "block")
        .html(`<strong>${name}</strong><br>Click to explore counties`);
}

function moveTooltip(event) {
    tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
}

function hideTooltip() {
    tooltip.style("display", "none");
}

// Get vaccination value for specific county, year (simplified for single metric)
function getVaccinationValue(fips, year) {
    const key = `${fips}_${year}`;
    
    if (vaccinationData[key] && vaccinationData[key].rate !== undefined) {
        return vaccinationData[key].rate;
    }
    
    return null;
}

// Get completeness percentage
function getCompletenessValue(fips, year) {
    const key = `${fips}_${year}`;
    
    if (vaccinationData[key] && vaccinationData[key].completeness !== undefined) {
        return vaccinationData[key].completeness;
    }
    
    return null;
}

// Get color for county based on vaccination rate
function getCountyColor(county) {
    const fips = getCountyFIPS(county);
    const value = getVaccinationValue(fips, selectedYear);
    
    if (value === null || value === 0) {
        return "#e0e0e0"; // Gray for missing data
    }
    
    return colorScale(value);
}

// Update county colors when year changes
function updateCountyColors() {
    g.selectAll(".county")
        .transition()
        .duration(500)
        .attr("fill", d => getCountyColor(d));
}

// Display county details in panel
function displayCountyDetails(county) {
    const fips = getCountyFIPS(county);
    const countyName = getCountyName(fips);
    const currentValue = getVaccinationValue(fips, selectedYear);
    const completeness = getCompletenessValue(fips, selectedYear);
    
    let html = `
        <div class="county-details">
            <h3>${countyName}</h3>
            
            <div class="metric">
                <div class="metric-label">${selectedYear} - Fully Vaccinated Population</div>
                <div class="metric-value">${currentValue !== null ? currentValue.toFixed(1) + '%' : 'No Data'}</div>
                ${completeness !== null ? `<div class="metric-subtext">Data completeness: ${completeness.toFixed(1)}%</div>` : ''}
            </div>
    `;
    
    // Show all years
    if (availableYears.length > 1) {
        html += `<div class="year-comparison"><h4>Historical Vaccination Rates</h4>`;
        
        availableYears.forEach(year => {
            const value = getVaccinationValue(fips, year.toString());
            html += `
                <div class="year-row">
                    <span class="year-label">${year}</span>
                    <span class="year-value">${value !== null ? value.toFixed(1) + '%' : 'No Data'}</span>
                </div>
            `;
        });
        
        html += `</div>`;
    }
    
    html += `</div>`;
    
    d3.select("#county-details-container").html(html);
}

// Show county tooltip (simplified)
function showCountyTooltip(event, d) {
    const name = getCountyName(d.id);
    const value = getVaccinationValue(d.id, selectedYear);
    
    tooltip
        .style("display", "block")
        .html(`
            <strong>${name}</strong><br>
            Fully Vaccinated: ${value !== null ? value.toFixed(1) + '%' : 'No Data'}
        `);
}

