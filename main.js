// Import d3 
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Import Scrollama
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

// Import TopoJSON
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";

// // Derive dimensions from the rendered SVG so the map fills its container.
// const svg = d3.select("#map");
// const { width: initialWidth, height: initialHeight } = svg.node().getBoundingClientRect();
// const width = initialWidth || 960;
// const height = initialHeight || 600;

// svg
//     .attr("viewBox", `0 0 ${width} ${height}`)
//     .attr("preserveAspectRatio", "xMidYMid meet");

// // State variables (simplified)
// let currentState = null;
// let statesData = null;
// let countiesData = null;
// let vaccinationData = {};
// let countyNames = {};
// let selectedYear = null;
// let availableYears = [];

// const g = svg.append("g");

// // Projection
// const projection = d3.geoAlbersUsa()
//     .translate([width / 2, height / 2])
//     .scale(Math.min(width, height) * 1.3);

// const path = d3.geoPath().projection(projection);

// // Color scale for choropleth
// const colorScale = d3.scaleSequential()
//     .domain([0, 100])
//     .interpolator(d3.interpolateBlues);

// // Create gradient for legend
// const legendGradient = d3.select("#legend-gradient");
// for (let i = 0; i <= 100; i++) {
//     legendGradient.append("div")
//         .style("width", "2px")
//         .style("height", "20px")
//         .style("background-color", colorScale(i))
//         .style("display", "inline-block");
// }

// // Tooltip
// const tooltip = d3.select("#tooltip");

// // Event listeners
// d3.select("#reset-btn").on("click", resetMap);

// d3.select("#year-select").on("change", function () {
//     selectedYear = this.value;
//     if (currentState) {
//         updateCountyColors();
//         updateInfoPanel();
//     }
// });

// // Load all data
// Promise.all([
//     d3.json("./data/states-10m.json"),
//     d3.json("./data/counties-10m.json")
// ])
//     .then(([states, counties]) => {
//         statesData = topojson.feature(states, states.objects.states);
//         countiesData = topojson.feature(counties, counties.objects.counties);

//         console.log("TopoJSON loaded:", statesData, countiesData);

//         drawStates();
//     })
//     .catch(err => console.error("Failed to load map files", err));

// // Set available years
// availableYears = summary.years_available; // This line needs attention, maybe AI generated..?
// selectedYear = availableYears[availableYears.length - 1].toString(); // Most recent year

// // Populate year selector
// const yearSelect = d3.select("#year-select");
// yearSelect.selectAll("option")
//     .data(availableYears)
//     .enter()
//     .append("option")
//     .attr("value", d => d)
//     .text(d => d)
//     .property("selected", d => d.toString() === selectedYear);

// // Hide loading message
// d3.select(".loading").style("display", "none");

// // Draw initial map
// drawStates();


// // Draw US states
// function drawStates() {
//     g.selectAll("path")
//         .data(statesData.features)
//         .enter()
//         .append("path")
//         .attr("class", "state")
//         .attr("d", path)
//         .attr("fill", "#4CAF50")
//         .on("click", handleStateClick)
//         .on("mouseover", showStateTooltip)
//         .on("mousemove", moveTooltip)
//         .on("mouseout", hideTooltip);
// }

// // Handle state click - zoom and show counties
// function handleStateClick(event, d) {
//     event.stopPropagation();
//     currentState = d;

//     // Calculate zoom parameters
//     const bounds = path.bounds(d);
//     const dx = bounds[1][0] - bounds[0][0];
//     const dy = bounds[1][1] - bounds[0][1];
//     const x = (bounds[0][0] + bounds[1][0]) / 2;
//     const y = (bounds[0][1] + bounds[1][1]) / 2;
//     const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
//     const translate = [width / 2 - scale * x, height / 2 - scale * y];

//     // Smooth transition: hide states
//     g.selectAll(".state")
//         .transition()
//         .duration(750)
//         .style("opacity", 0)
//         .on("end", function () {
//             d3.select(this).style("display", "none");
//         });

//     // Filter counties for this state
//     const stateFIPS = d.id;
//     const stateCounties = countiesData.features.filter(county =>
//         Math.floor(county.id / 1000) === stateFIPS
//     );

//     // Draw counties with smooth entrance
//     g.selectAll(".county")
//         .data(stateCounties)
//         .enter()
//         .append("path")
//         .attr("class", "county")
//         .attr("d", path)
//         .attr("fill", d => getCountyColor(d))
//         .style("opacity", 0)
//         .on("click", handleCountyClick)
//         .on("mouseover", showCountyTooltip)
//         .on("mousemove", moveTooltip)
//         .on("mouseout", hideTooltip)
//         .transition()
//         .duration(500)
//         .delay(750)
//         .style("opacity", 1);

//     // Zoom transition
//     g.transition()
//         .duration(750)
//         .attr("transform", `translate(${translate}) scale(${scale})`);

//     // Show reset button
//     d3.select("#reset-btn")
//         .style("display", "block")
//         .style("opacity", 0)
//         .transition()
//         .duration(300)
//         .delay(750)
//         .style("opacity", 1);

//     // Update info panel
//     updateInfoPanel();
// }

// // Handle county click - show details
// function handleCountyClick(event, d) {
//     event.stopPropagation();

//     // Remove previous selection
//     g.selectAll(".county").classed("selected", false);

//     // Highlight selected county
//     d3.select(event.currentTarget).classed("selected", true);

//     // Display county details
//     displayCountyDetails(d);
// }

// // Get county name from FIPS
// function getCountyName(fips) {
//     if (countyNames[fips]) {
//         return `${countyNames[fips].county}, ${countyNames[fips].state}`;
//     }
//     return `County ${fips}`;
// }

// // Get state name from FIPS
// function getStateName(id) {
//     const stateNames = {
//         1: "Alabama", 2: "Alaska", 4: "Arizona", 5: "Arkansas",
//         6: "California", 8: "Colorado", 9: "Connecticut", 10: "Delaware",
//         12: "Florida", 13: "Georgia", 15: "Hawaii", 16: "Idaho",
//         17: "Illinois", 18: "Indiana", 19: "Iowa", 20: "Kansas",
//         21: "Kentucky", 22: "Louisiana", 23: "Maine", 24: "Maryland",
//         25: "Massachusetts", 26: "Michigan", 27: "Minnesota", 28: "Mississippi",
//         29: "Missouri", 30: "Montana", 31: "Nebraska", 32: "Nevada",
//         33: "New Hampshire", 34: "New Jersey", 35: "New Mexico", 36: "New York",
//         37: "North Carolina", 38: "North Dakota", 39: "Ohio", 40: "Oklahoma",
//         41: "Oregon", 42: "Pennsylvania", 44: "Rhode Island", 45: "South Carolina",
//         46: "South Dakota", 47: "Tennessee", 48: "Texas", 49: "Utah",
//         50: "Vermont", 51: "Virginia", 53: "Washington", 54: "West Virginia",
//         55: "Wisconsin", 56: "Wyoming"
//     };
//     return stateNames[id] || "Unknown State";
// }

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

// // Reset to full US map
// function resetMap() {
//     currentState = null;

//     // Remove counties with smooth fade
//     g.selectAll(".county")
//         .transition()
//         .duration(500)
//         .style("opacity", 0)
//         .remove();

//     // Show states
//     g.selectAll(".state")
//         .style("display", "block")
//         .transition()
//         .duration(500)
//         .delay(500)
//         .style("opacity", 1);

//     // Reset zoom
//     g.transition()
//         .duration(750)
//         .attr("transform", "");

//     // Hide reset button
//     d3.select("#reset-btn")
//         .transition()
//         .duration(300)
//         .style("opacity", 0)
//         .on("end", function () {
//             d3.select(this).style("display", "none");
//         });

//     // Reset info panel
//     d3.select("#county-details-container").html("");
// }

// // Tooltip functions
// function showStateTooltip(event, d) {
//     const name = getStateName(d.id);
//     tooltip
//         .style("display", "block")
//         .html(`<strong>${name}</strong><br>Click to explore counties`);
// }

// function moveTooltip(event) {
//     tooltip
//         .style("left", (event.pageX + 10) + "px")
//         .style("top", (event.pageY - 20) + "px");
// }

// function hideTooltip() {
//     tooltip.style("display", "none");
// }

// // Get vaccination value for specific county, year (simplified for single metric)
// function getVaccinationValue(fips, year) {
//     const key = `${fips}_${year}`;

//     if (vaccinationData[key] && vaccinationData[key].rate !== undefined) {
//         return vaccinationData[key].rate;
//     }

//     return null;
// }

// // Get completeness percentage
// function getCompletenessValue(fips, year) {
//     const key = `${fips}_${year}`;

//     if (vaccinationData[key] && vaccinationData[key].completeness !== undefined) {
//         return vaccinationData[key].completeness;
//     }

//     return null;
// }

// // Get color for county based on vaccination rate
// function getCountyColor(county) {
//     const fips = county.id;
//     const value = getVaccinationValue(fips, selectedYear);

//     if (value === null || value === 0) {
//         return "#e0e0e0"; // Gray for missing data
//     }

//     return colorScale(value);
// }

// // Update county colors when year changes
// function updateCountyColors() {
//     g.selectAll(".county")
//         .transition()
//         .duration(500)
//         .attr("fill", d => getCountyColor(d));
// }

// // Display county details in panel
// function displayCountyDetails(county) {
//     const fips = county.id;
//     const countyName = getCountyName(fips);
//     const currentValue = getVaccinationValue(fips, selectedYear);
//     const completeness = getCompletenessValue(fips, selectedYear);

//     let html = `
//         <div class="county-details">
//             <h3>${countyName}</h3>
            
//             <div class="metric">
//                 <div class="metric-label">${selectedYear} - Fully Vaccinated Population</div>
//                 <div class="metric-value">${currentValue !== null ? currentValue.toFixed(1) + '%' : 'No Data'}</div>
//                 ${completeness !== null ? `<div class="metric-subtext">Data completeness: ${completeness.toFixed(1)}%</div>` : ''}
//             </div>
//     `;

//     // Show all years
//     if (availableYears.length > 1) {
//         html += `<div class="year-comparison"><h4>Historical Vaccination Rates</h4>`;

//         availableYears.forEach(year => {
//             const value = getVaccinationValue(fips, year.toString());
//             html += `
//                 <div class="year-row">
//                     <span class="year-label">${year}</span>
//                     <span class="year-value">${value !== null ? value.toFixed(1) + '%' : 'No Data'}</span>
//                 </div>
//             `;
//         });

//         html += `</div>`;
//     }

//     html += `</div>`;

//     d3.select("#county-details-container").html(html);
// }

// // Show county tooltip (simplified)
// function showCountyTooltip(event, d) {
//     const name = getCountyName(d.id);
//     const value = getVaccinationValue(d.id, selectedYear);

//     tooltip
//         .style("display", "block")
//         .html(`
//             <strong>${name}</strong><br>
//             Fully Vaccinated: ${value !== null ? value.toFixed(1) + '%' : 'No Data'}
//         `);
// }


// ========================= KP Bar Plot Race Animation =========================
async function loadKaggleData() {
    const parseDate = d3.timeParse("%m/%d/%Y"); // Adjust date format as needed, e.g., "1/22/2020"
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
            output.push({...r, running_total_confirmed: cumConfirmed, running_total_deaths: cumDeaths});
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

let data = await loadKaggleData();

data = filterByState(data, "California");
data = runningTotals(data);
const top5 = getTop5Counties(data);
data = filterTop5(data, top5);
const byDate = groupByDate(data);
const dates = Array.from(byDate.keys()).sort(d3.ascending);

async function renderBarRace(containerId) {
    const container = document.getElementById(containerId);
    // Dimensions
    const margin = {top: 20, right: 20, bottom: 80, left: 250};
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleBand().range([0, height]).padding(0.2);

    // Axes
    // svg.append("g")
    //     .attr("class", "x-axis")
    //     .attr("transform", `translate(0, ${height})`);

    // svg.append("text")
    //     .attr("class", "x-axis-label")
    //     .attr("x", width / 2)
    //     .attr("y", height + 45)
    //     .attr("text-anchor", "middle")
    //     .text("Running Total");
        
    // Color scale
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // Initial date/frame
    let frameIndex = 0;
    let isRunning = false;
    function updateFrame(dateKey) {
        const frameData = byDate.get(dateKey);

        frameData.sort((a,b) => d3.descending(a.running_total_deaths, b.running_total_deaths));

        x.domain([0, d3.max(frameData, d => d.running_total_deaths)]);
        svg.select(".x-axis")
            .transition()
            .duration(200)
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
            .duration(100)   // adjust animation speed
            .attr("width", d => x(d.running_total_deaths));
        bars.exit().remove();

        // Labels
        const labels = svg.selectAll("text")
            .data(frameData, d => d.Combined_Key);

        labels.enter()
            .append("text")
            .attr("y", d => y(d.Combined_Key) + y.bandwidth()/2)
            .attr("x", -10)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(d => d.Combined_Key)
            .merge(labels)
            .transition()
            .duration(200)
            .attr("y", d => y(d.Combined_Key) + y.bandwidth()/2);

        labels.exit().remove();
    }

    // Animate through dates like Plotly's animation_frame
    let timer = null;

    function animate() {
        if (!isRunning) return;

        updateFrame(dates[frameIndex]);

        frameIndex++;
        if (frameIndex < dates.length) {
            timer = setTimeout(animate, 200);
        } else {
            isRunning = false;
        }
    }
    document.getElementById("startRace").onclick = () => {
        if (!isRunning) {
            isRunning = true;
            frameIndex = 0;
            animate();
        }
    };

    document.getElementById("stopRace").onclick = () => {
        isRunning = false;
        clearTimeout(timer);
    };

    animate();
}



// Scrollytelling 
const scroller = scrollama();
const chartsInitialized = {};
let currentSlideStep = 0;

// Initialize chart for current step
function initializeStepChart(stepIndex) {
    if (chartsInitialized[stepIndex]) return;
    
    switch(stepIndex) {
        case 1:
            renderBarRace('chart1');
            chartsInitialized[1] = true;
            break;
        case 2:
            // chartFunction2('chart2');
            chartsInitialized[2] = true;
            break;
        case 3:
            //   chartFunction3('chart3');
            chartsInitialized[3] = true;
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
