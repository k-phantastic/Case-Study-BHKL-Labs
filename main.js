// Import d3 
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Import Scrollama
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

// Import TopoJSON
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";

// Derive dimensions from the rendered SVG so the map fills its container.
const svg = d3.select("#map");
const { width: initialWidth, height: initialHeight } = svg.node().getBoundingClientRect();
const width = initialWidth || 960;
const height = initialHeight || 600;

svg
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")

// State variables
let currentState = null;
let statesData = null;
let countiesData = null;
let vaccinationData = {};
let countyNames = {};
let selectedYear = null;
let availableYears = [];

const g = svg.append("g");

// Projection
const projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(Math.min(width, height) * 1.3);

const path = d3.geoPath().projection(projection);

// Color scale for choropleth
const colorScale = d3.scaleSequential()
    .domain([0, 100])
    .interpolator(d3.interpolateRgb("#d6e4ff", "#1d3fff"));

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

d3.select("#year-select").on("change", function () {
    selectedYear = this.value;
    if (currentState) {
        updateCountyColors();
        updateInfoPanel();
    }
});

// Load all data
console.log("Starting data load...");

// Helper function to load JSON with specific error handling
function loadData(url, name) {
    return d3.json(url).catch(err => {
        console.error(`Failed to load ${name} from ${url}:`, err);
        throw err;
    });
}

// Load files individually to pinpoint the error
Promise.all([
    loadData("./data/states-10m.json", "States"),
    loadData("./data/counties-10m.json", "Counties"),
    loadData("./data/vaccination_data.json", "Vaccination Data")
])
    .then(([states, counties, vaxData]) => {
        console.log("All data files loaded successfully.");

        if (!states || !counties || !vaxData) {
            throw new Error("One or more data files failed to load or are empty.");
        }

        try {
            statesData = topojson.feature(states, states.objects.states);
            countiesData = topojson.feature(counties, counties.objects.counties);
        } catch (e) {
            console.error("TopoJSON parsing error:", e);
            throw new Error("Failed to parse TopoJSON data.");
        }

        vaccinationData = vaxData;

        console.log("Data processed:", {
            states: statesData.features.length,
            counties: countiesData.features.length,
            years: vaccinationData.years
        });

        // Update available years
        if (vaccinationData.years && vaccinationData.years.length > 0) {
            availableYears = vaccinationData.years;
            selectedYear = availableYears[availableYears.length - 1].toString();
        } else {
            console.warn("No years found in vaccination data.");
            availableYears = [2022]; // Fallback
            selectedYear = "2022";
        }

        // Populate year selector
        const yearSelect = d3.select("#year-select");
        yearSelect.html(""); // Clear existing
        yearSelect.selectAll("option")
            .data(availableYears)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d)
            .property("selected", d => d.toString() === selectedYear);

        // Draw initial map
        drawStates();

        // Hide loading message
        d3.select(".loading").style("display", "none");
    })
    .catch(err => {
        console.error("CRITICAL ERROR: Failed to load map data.", err);
        d3.select(".loading").text(`Error loading data: ${err.message}`);
        d3.select(".loading").style("color", "red");
    });

// Draw US states
function drawStates() {
    g.selectAll("path")
        .data(statesData.features)
        .enter()
        .append("path")
        .attr("class", "state")
        .attr("d", path)
        .attr("fill", d => getStateColor(d)) // Use data-driven color
        .on("click", handleStateClick)
        .on("mouseover", showStateTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
}

// Get color for state based on vaccination rate
function getStateColor(d) {
    const value = getVaccinationValue(d.id, selectedYear);
    if (value === null || value === 0) {
        return "#8DBCF4"; // Default blue if no data
    }
    return colorScale(value);
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
        .on("end", function () {
            d3.select(this).style("display", "none");
        });

    // Filter counties for this state
    const stateFIPS = d.id;
    const stateCounties = countiesData.features.filter(county =>
        county.id.slice(0, 2) === stateFIPS
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
    updateInfoPanel();
}

// Handle county click - show details
function handleCountyClick(event, d) {
    event.stopPropagation();

    // Remove previous selection
    g.selectAll(".county").classed("selected", false);

    // Highlight selected county
    d3.select(event.currentTarget).classed("selected", true);

    // Display county details
    displayCountyDetails(d);
}

// Get county name from FIPS
function getCountyName(fips) {
    // Try to get name from our data first
    const fipsStr = String(fips);
    if (vaccinationData.counties && vaccinationData.counties[fipsStr]) {
        // Get any year's data to find the name
        const years = Object.keys(vaccinationData.counties[fipsStr]);
        if (years.length > 0) {
            const data = vaccinationData.counties[fipsStr][years[0]];
            return `${data.name}, ${data.state}`;
        }
    }

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
        55: "Wisconsin", 56: "Wyoming", 72: "Puerto Rico"
    };
    return stateNames[parseInt(id)] || "Unknown State";
}

// Update info panel when state is selected
function updateInfoPanel() {
    if (!currentState) return;

    const stateName = getStateName(currentState.id);
    const stateRate = getVaccinationValue(currentState.id, selectedYear);

    const html = `
        <div class="county-details">
            <h3>${stateName}</h3>
            <div class="metric">
                <div class="metric-label">${selectedYear} - State Vaccination Rate</div>
                <div class="metric-value">${stateRate !== null ? stateRate.toFixed(1) + '%' : 'No Data'}</div>
            </div>
            <p class="intro-text">
                Click on any county to view detailed data.
            </p>
        </div>
    `;

    d3.select("#county-details-container").html(html);
}

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
        .on("end", function () {
            d3.select(this).style("display", "none");
        });

    // Reset info panel
    d3.select("#county-details-container").html("");
}

// Tooltip functions
function showStateTooltip(event, d) {
    const name = getStateName(d.id);
    const value = getVaccinationValue(d.id, selectedYear);

    tooltip
        .style("display", "block")
        .html(`
            <strong>${name}</strong><br>
            Fully Vaccinated: ${value !== null ? value.toFixed(1) + '%' : 'No Data'}<br>
            <span style="font-size: 11px; color: #ccc">Click to explore counties</span>
        `);
}

function moveTooltip(event) {
    tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
}

function hideTooltip() {
    tooltip.style("display", "none");
}

// Get vaccination value for specific county/state, year
function getVaccinationValue(fips, year) {
    const fipsStr = String(fips);

    // Check counties
    if (vaccinationData.counties && vaccinationData.counties[fipsStr] && vaccinationData.counties[fipsStr][year]) {
        return vaccinationData.counties[fipsStr][year].rate;
    }

    // Check states
    if (vaccinationData.states && vaccinationData.states[fipsStr] && vaccinationData.states[fipsStr][year]) {
        return vaccinationData.states[fipsStr][year].rate;
    }

    return null;
}

// Get completeness percentage
function getCompletenessValue(fips, year) {
    const fipsStr = String(fips);
    if (vaccinationData.counties && vaccinationData.counties[fipsStr] && vaccinationData.counties[fipsStr][year]) {
        return vaccinationData.counties[fipsStr][year].completeness;
    }
    return null;
}

// Get color for county based on vaccination rate
function getCountyColor(county) {
    const fips = county.id;
    const value = getVaccinationValue(fips, selectedYear);

    if (value === null || value === 0) {
        return "#eef3ff"; // light blue and gray for missing data
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
    const fips = county.id;
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


// ========================= KP Bar Plot Race Animation =========================
async function loadKaggleData() {
    const parseDate = d3.timeParse("%m/%d/%y"); // Adjust date format as needed, e.g., "1/22/2020"
    const data = await d3.csv('data/kaggle_usa_county_wise.csv', (row) => ({
        ...row,
        lat: +row['Lat'],
        long: +row['Long'],
        date: parseDate(row['Date']),
        confirmed: +row['Confirmed'],
        deaths: +row['Deaths'],
    }));
    return data;
}

// Filter by State
function filterByState(data, stateName) {
    return data
        .filter(d => d.iso3 == "USA")
        .filter(d => d.Province_State == stateName);
}

// Compute running total for animation (python cumsum equivalent?) for both confirmed and deaths from COVID
function runningTotals(data) {
    const byCounty = d3.group(data, d => d.Combined_Key);
    const output = [];

    for (const [county, rows] of byCounty) {
        rows.sort((a, b) => d3.ascending(a.date, b.date));
        let cumConfirmed = 0;
        let cumDeaths = 0;
        rows.forEach(r => {
            cumConfirmed += r.confirmed;
            cumDeaths += r.deaths;
            output.push({ ...r, running_total_confirmed: cumConfirmed, running_total_deaths: cumDeaths });
        });
    }
    return output;
}

function getTop5Counties(data) {
    const byCounty = d3.rollups(
        data,
        v => d3.max(v, d => d.running_total_confirmed),
        d => d.Combined_Key
    );

    // Sort descending by max total deaths
    byCounty.sort((a, b) => d3.descending(a[1], b[1]));

    // Extract the top 5 county names
    return byCounty.slice(0, 5).map(d => d[0]);
}

function filterTop5(data, top5) {
    return data.filter(d => top5.includes(d.Combined_Key));
}

function groupByDate(data) {
    return d3.group(data, d => +d.date);  // numeric date key
}

// Global variables for race chart
let raceData = null;
let raceDates = null;
let raceByDate = null;

async function prepareRaceData() {
    try {
        let data = await loadKaggleData();
        data = filterByState(data, "California");
        data = runningTotals(data);
        const top5 = getTop5Counties(data);
        data = filterTop5(data, top5);
        raceByDate = groupByDate(data);
        raceDates = Array.from(raceByDate.keys()).sort(d3.ascending);
        console.log("Race chart data prepared");
    } catch (err) {
        console.error("Failed to prepare race data:", err);
    }
}

// Start loading race data in background
prepareRaceData();

async function renderBarRace(containerId) {
    // Wait for data if not ready
    if (!raceByDate) {
        console.log("Waiting for race data...");
        // Simple polling wait
        while (!raceByDate) {
            await new Promise(r => setTimeout(r, 100));
        }
    }

    const container = document.getElementById(containerId);
    // Dimensions
    const margin = { top: 50, right: 80, bottom: 80, left: 250 };
    const width = 900 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X-axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`);

    // X-axis label
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#333")
        .text("Total COVID-19 Deaths");
    
    // Scales
    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleBand().range([0, height]).padding(0.2);

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // Initial date/frame
    let frameIndex = 0;
    let isRunning = false;
    const animationSpeed = 100; // milliseconds
    function updateFrame(dateKey) {
        const frameData = raceByDate.get(dateKey);

        frameData.sort((a, b) => d3.descending(a.running_total_deaths, b.running_total_deaths));

        x.domain([0, d3.max(frameData, d => d.running_total_deaths)]);

        svg.select(".x-axis")
            .transition()
            .duration(animationSpeed)
            .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0));

        y.domain(frameData.map(d => d.Combined_Key));

        const bars = svg.selectAll("rect")
            .data(frameData, d => d.Combined_Key);

        bars.enter()
            .append("rect")
            .attr("y", d => y(d.Combined_Key))
            .attr("height", y.bandwidth())
            .attr("x", 0)
            .attr("width", d => x(d.running_total_deaths))
            .attr("fill", d => color(d.Combined_Key))
            .merge(bars)
            .transition()
            .duration(animationSpeed)   // Adjust duration for smoother animation
            .attr("y", d => y(d.Combined_Key))
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.running_total_deaths));
        bars.exit().remove();

        // Labels
        const labels = svg.selectAll("text.bar-label")
            .data(frameData, d => d.Combined_Key);

        labels.enter()
            .append("text")
            .attr("class", "bar-label")
            .attr("y", d => y(d.Combined_Key) + y.bandwidth() / 2)
            .attr("x", -10)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(d => d.Combined_Key)
            .merge(labels)
            .transition()
            .duration(animationSpeed)
            .attr("y", d => y(d.Combined_Key) + y.bandwidth() / 2);

        labels.exit().remove();
    
        const valueLabels = svg.selectAll("text.value-label")
            .data(frameData, d => d.Combined_Key);

        valueLabels.enter()
            .append("text")
            .attr("class", "value-label")
            .attr("y", d => y(d.Combined_Key) + y.bandwidth() / 2)
            .attr("x", d => x(d.running_total_deaths) + 5)
            .attr("dy", "0.35em")
            .attr("text-anchor", "start")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#333")
            .text(d => d3.format(",")(d.running_total_deaths))
            .merge(valueLabels)
            .transition()
            .duration(animationSpeed)
            .attr("y", d => y(d.Combined_Key) + y.bandwidth() / 2)
            .attr("x", d => x(d.running_total_deaths) + 5)
            .text(d => d3.format(",")(d.running_total_deaths));

        valueLabels.exit().remove();

        const dateFormat = d3.timeFormat("%B %d, %Y");
        const displayDate = dateFormat(new Date(dateKey));
        svg.selectAll(".date-label").remove();
        svg.append("text")
            .attr("class", "date-label")
            .attr("x", width)
            .attr("y", height - 10)
            .attr("text-anchor", "end")
            .style("font-size", "24px")
            .style("fill", "#999")
            .text(displayDate);

    }
    updateFrame(raceDates[0]);

    // Animate through dates like Plotly's animation_frame
    let timer = null;

    function animate() {
        if (!isRunning) return;

        updateFrame(raceDates[frameIndex]);

        frameIndex++;
        if (frameIndex < raceDates.length) {
            timer = setTimeout(animate, animationSpeed);
        } else {
            isRunning = false;
        }
    }
    document.getElementById("barChartStartRace").onclick = () => {
        if (!isRunning) {
            isRunning = true;
            // frameIndex = 0;
            animate();
        }
    };

    document.getElementById("barChartStopRace").onclick = () => {
        isRunning = false;
        clearTimeout(timer);
    };

    document.getElementById("barChartResetRace")?.addEventListener("click", () => {
        isRunning = false;
        clearTimeout(timer);
        frameIndex = 0;
        updateFrame(raceDates[0]);
    });

    animate();
}



// Scrollytelling 
const scroller = scrollama();
const chartsInitialized = {};
let currentSlideStep = 0;

// Initialize chart for current step
function initializeStepChart(stepIndex) {
    if (chartsInitialized[stepIndex]) return;

    switch (stepIndex) {
        case 0:
            // Title slide - no chart
            chartsInitialized[0] = true;
            break;
        case 1:
            // Map slide - already initialized
            chartsInitialized[1] = true;
            break;
        case 2:
            renderBarRace('chart1');
            chartsInitialized[2] = true;
            break;
        case 3:
            // Placeholder
            chartsInitialized[3] = true;
            break;
        case 4:
            // Placeholder
            chartsInitialized[4] = true;
            break;
        case 5:
            // Placeholder
            chartsInitialized[5] = true;
            break;
    }
}

// Update progress indicator
function updateProgressIndicator(stepIndex) {
    const dots = document.querySelectorAll('.progress-dot');
    dots.forEach((dot, index) => {
        if (index === stepIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

scroller
    .setup({
        step: '.step',
        offset: 0.5,
        debug: false
    })
    .onStepEnter(response => {
        const { element, index } = response;

        // Add active class to current step
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        element.classList.add('active');

        currentSlideStep = index;

        // Update progress indicator
        updateProgressIndicator(index);

        // Initialize chart for this step
        initializeStepChart(index);
    });

// Setup resize
window.addEventListener('resize', scroller.resize);

// Progress dot click handlers
document.querySelectorAll('.progress-dot').forEach((dot, index) => {
    dot.addEventListener('click', () => {
        const steps = document.querySelectorAll('.step');
        steps[index].scrollIntoView({ behavior: 'smooth' });
        console.log(`Scrolled to step ${index}`); // Debug log
    });
});
