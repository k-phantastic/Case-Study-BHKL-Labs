import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

export async function initPoliticalAnalysis(containerId) {
    // Load the political analysis data
    const data = await d3.json('political_vax_analysis.json');
    
    // Container setup
    const container = d3.select(`#${containerId}`);
    container.selectAll('*').remove(); // Clear existing content
    
    // Layout configuration
    const width = 1000;
    const height = 600;
    const margin = { top: 60, right: 120, bottom: 60, left: 80 };
    
    // Create main visualization container
    const vizContainer = container.append('div')
        .attr('class', 'political-viz-container')
        .style('background', 'white')
        .style('border-radius', '12px')
        .style('padding', '30px')
        .style('box-shadow', '0 4px 20px rgba(0,0,0,0.1)');
    

    // Summary Statistics
    const summaryDiv = vizContainer.append('div')
        .attr('class', 'summary-stats')
        .style('margin-bottom', '30px')
        .style('display', 'flex')
        .style('justify-content', 'space-around')
        .style('gap', '20px');
    
    // Blue states stat card
    summaryDiv.append('div')
        .attr('class', 'stat-card blue-card')
        .style('flex', '1')
        .style('background', 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)')
        .style('color', 'white')
        .style('padding', '25px')
        .style('border-radius', '10px')
        .style('text-align', 'center')
        .html(`
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">BLUE STATES</div>
            <div style="font-size: 48px; font-weight: bold;">${data.summary_stats.blue_states_avg}%</div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 8px;">Average Vaccination Rate</div>
        `);
    
    // Red states stat card
    summaryDiv.append('div')
        .attr('class', 'stat-card red-card')
        .style('flex', '1')
        .style('background', 'linear-gradient(135deg, #f44336 0%, #c62828 100%)')
        .style('color', 'white')
        .style('padding', '25px')
        .style('border-radius', '10px')
        .style('text-align', 'center')
        .html(`
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">RED STATES</div>
            <div style="font-size: 48px; font-weight: bold;">${data.summary_stats.red_states_avg}%</div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 8px;">Average Vaccination Rate</div>
        `);
    
    // Gap stat card
    summaryDiv.append('div')
        .attr('class', 'stat-card gap-card')
        .style('flex', '1')
        .style('background', 'linear-gradient(135deg, #9E9E9E 0%, #616161 100%)')
        .style('color', 'white')
        .style('padding', '25px')
        .style('border-radius', '10px')
        .style('text-align', 'center')
        .html(`
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">PARTISAN GAP</div>
            <div style="font-size: 48px; font-weight: bold;">${data.summary_stats.gap.toFixed(1)}%</div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 8px;">Percentage Point Difference</div>
        `);
    

    // Time Series Chart - Red vs Blue Over Time
    const timeSeriesDiv = vizContainer.append('div')
        .attr('class', 'time-series-chart')
        .style('margin-bottom', '40px');
    
    timeSeriesDiv.append('h3')
        .style('text-align', 'center')
        .style('margin-bottom', '20px')
        .style('color', '#333')
        .text('Vaccination Rates Over Time: Red vs Blue States');
    
    const timeSeriesSvg = timeSeriesDiv.append('svg')
        .attr('width', width)
        .attr('height', 350);
    
    const timeSeriesG = timeSeriesSvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = 350 - margin.top - margin.bottom;
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data.time_series, d => d.year))
        .range([0, chartWidth]);
    
    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([chartHeight, 0]);
    
    // Line generators
    const redLine = d3.line()
        .defined(d => d.red_states_avg !== null)
        .x(d => xScale(d.year))
        .y(d => yScale(d.red_states_avg))
        .curve(d3.curveMonotoneX);
    
    const blueLine = d3.line()
        .defined(d => d.blue_states_avg !== null)
        .x(d => xScale(d.year))
        .y(d => yScale(d.blue_states_avg))
        .curve(d3.curveMonotoneX);
    
    // Grid lines
    timeSeriesG.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScale)
            .tickSize(-chartWidth)
            .tickFormat(''));
    
    // X axis
    timeSeriesG.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
        .style('font-size', '12px');
    
    // Y axis
    timeSeriesG.append('g')
        .call(d3.axisLeft(yScale).tickFormat(d => d + '%'))
        .style('font-size', '12px');
    
    // Y axis label
    timeSeriesG.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -60)
        .attr('x', -chartHeight / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#666')
        .text('Vaccination Rate (%)');
    
    // Draw red line
    timeSeriesG.append('path')
        .datum(data.time_series)
        .attr('fill', 'none')
        .attr('stroke', '#f44336')
        .attr('stroke-width', 3)
        .attr('d', redLine);
    
    // Draw blue line
    timeSeriesG.append('path')
        .datum(data.time_series)
        .attr('fill', 'none')
        .attr('stroke', '#2196F3')
        .attr('stroke-width', 3)
        .attr('d', blueLine);
    
    // Add circles for data points
    timeSeriesG.selectAll('.red-circle')
        .data(data.time_series.filter(d => d.red_states_avg !== null))
        .enter().append('circle')
        .attr('class', 'red-circle')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.red_states_avg))
        .attr('r', 5)
        .attr('fill', '#f44336')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    
    timeSeriesG.selectAll('.blue-circle')
        .data(data.time_series.filter(d => d.blue_states_avg !== null))
        .enter().append('circle')
        .attr('class', 'blue-circle')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.blue_states_avg))
        .attr('r', 5)
        .attr('fill', '#2196F3')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    
    // Legend
    const legend = timeSeriesG.append('g')
        .attr('transform', `translate(${chartWidth - 150}, 20)`);
    
    legend.append('line')
        .attr('x1', 0).attr('x2', 40)
        .attr('y1', 0).attr('y2', 0)
        .attr('stroke', '#f44336')
        .attr('stroke-width', 3);
    
    legend.append('text')
        .attr('x', 50).attr('y', 5)
        .style('font-size', '14px')
        .text('Red States');
    
    legend.append('line')
        .attr('x1', 0).attr('x2', 40)
        .attr('y1', 30).attr('y2', 30)
        .attr('stroke', '#2196F3')
        .attr('stroke-width', 3);
    
    legend.append('text')
        .attr('x', 50).attr('y', 35)
        .style('font-size', '14px')
        .text('Blue States');
    

    // Urban/Rural Breakdown
    const urbanRuralDiv = vizContainer.append('div')
        .attr('class', 'urban-rural-chart')
        .style('margin-bottom', '40px');
    
    urbanRuralDiv.append('h3')
        .style('text-align', 'center')
        .style('margin-bottom', '20px')
        .style('color', '#333')
        .text('Urban vs Rural: Vaccination Rates by Political Lean');
    
    const urbanRuralSvg = urbanRuralDiv.append('svg')
        .attr('width', width)
        .attr('height', 350);
    
    const urbanRuralG = urbanRuralSvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Group data by urban/rural classification
    const urbanClasses = ['Urban', 'Mixed', 'Rural'];
    
    // X scale for urban/rural categories
    const xUrbanScale = d3.scaleBand()
        .domain(urbanClasses)
        .range([0, chartWidth])
        .padding(0.3);
    
    // X scale for grouped bars (red/blue within each category)
    const xSubScale = d3.scaleBand()
        .domain(['Red', 'Blue'])
        .range([0, xUrbanScale.bandwidth()])
        .padding(0.1);
    
    // Y scale
    const yUrbanScale = d3.scaleLinear()
        .domain([0, 100])
        .range([chartHeight, 0]);
    
    // Grid lines
    urbanRuralG.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yUrbanScale)
            .tickSize(-chartWidth)
            .tickFormat(''));
    
    // X axis
    urbanRuralG.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xUrbanScale))
        .style('font-size', '12px');
    
    // Y axis
    urbanRuralG.append('g')
        .call(d3.axisLeft(yUrbanScale).tickFormat(d => d + '%'))
        .style('font-size', '12px');
    
    // Y axis label
    urbanRuralG.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -60)
        .attr('x', -chartHeight / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#666')
        .text('Vaccination Rate (%)');
    
    // Color scale
    const colorScale = d3.scaleOrdinal()
        .domain(['Red', 'Blue'])
        .range(['#f44336', '#2196F3']);
    
    // Draw bars
    urbanClasses.forEach(urbanClass => {
        const urbanData = data.urban_rural_breakdown.filter(d => d.urban_rural_class === urbanClass);
        
        urbanRuralG.selectAll(`.bar-${urbanClass}`)
            .data(urbanData)
            .enter().append('rect')
            .attr('class', d => `bar-${urbanClass}`)
            .attr('x', d => xUrbanScale(urbanClass) + xSubScale(d.political_lean))
            .attr('y', d => yUrbanScale(d.avg_vax_rate))
            .attr('width', xSubScale.bandwidth())
            .attr('height', d => chartHeight - yUrbanScale(d.avg_vax_rate))
            .attr('fill', d => colorScale(d.political_lean))
            .attr('opacity', 0.8)
            .on('mouseover', function(event, d) {
                d3.select(this).attr('opacity', 1);
                // Show tooltip
                const tooltip = d3.select('body').append('div')
                    .attr('class', 'bar-tooltip')
                    .style('position', 'absolute')
                    .style('background', 'rgba(0,0,0,0.8)')
                    .style('color', 'white')
                    .style('padding', '10px')
                    .style('border-radius', '5px')
                    .style('font-size', '12px')
                    .style('pointer-events', 'none')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 20) + 'px')
                    .html(`
                        <strong>${d.political_lean} States - ${d.urban_rural_class}</strong><br/>
                        Vaccination Rate: ${d.avg_vax_rate}%<br/>
                        Number of States: ${d.count}
                    `);
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 0.8);
                d3.selectAll('.bar-tooltip').remove();
            });
        
        // Add value labels on bars
        urbanRuralG.selectAll(`.label-${urbanClass}`)
            .data(urbanData)
            .enter().append('text')
            .attr('class', `label-${urbanClass}`)
            .attr('x', d => xUrbanScale(urbanClass) + xSubScale(d.political_lean) + xSubScale.bandwidth() / 2)
            .attr('y', d => yUrbanScale(d.avg_vax_rate) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(d => `${d.avg_vax_rate}%`);
    });
    
    // Scatter Plot - Political Margin vs Vaccination Rate
    const scatterDiv = vizContainer.append('div')
        .attr('class', 'scatter-chart');
    
    scatterDiv.append('h3')
        .style('text-align', 'center')
        .style('margin-bottom', '20px')
        .style('color', '#333')
        .text('Political Margin vs Vaccination Rate (Latest Year)');
    
    const scatterSvg = scatterDiv.append('svg')
        .attr('width', width)
        .attr('height', 400);
    
    const scatterG = scatterSvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const scatterHeight = 400 - margin.top - margin.bottom;
    
    // Filter out states without vaccination data
    const statesWithData = data.states.filter(d => d.vax_rate !== null);
    
    // X scale: Political margin (negative = blue win, positive = red win)
    const xScatterScale = d3.scaleLinear()
        .domain([-50, 50])
        .range([0, chartWidth]);
    
    // Y scale: Vaccination rate
    const yScatterScale = d3.scaleLinear()
        .domain([0, 100])
        .range([scatterHeight, 0]);
    
    // Grid lines
    scatterG.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScatterScale)
            .tickSize(-chartWidth)
            .tickFormat(''));
    
    // Vertical line at x=0 (swing line)
    scatterG.append('line')
        .attr('x1', xScatterScale(0))
        .attr('x2', xScatterScale(0))
        .attr('y1', 0)
        .attr('y2', scatterHeight)
        .attr('stroke', '#999')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
    
    // X axis
    scatterG.append('g')
        .attr('transform', `translate(0,${scatterHeight})`)
        .call(d3.axisBottom(xScatterScale).tickFormat(d => {
            if (d < 0) return `Biden +${Math.abs(d)}`;
            if (d > 0) return `Trump +${d}`;
            return 'Even';
        }))
        .style('font-size', '11px');
    
    // Y axis
    scatterG.append('g')
        .call(d3.axisLeft(yScatterScale).tickFormat(d => d + '%'))
        .style('font-size', '12px');
    
    // X axis label
    scatterG.append('text')
        .attr('x', chartWidth / 2)
        .attr('y', scatterHeight + 50)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#666')
        .text('Political Margin (2020 Election)');
    
    // Y axis label
    scatterG.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -60)
        .attr('x', -scatterHeight / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#666')
        .text('Vaccination Rate (%)');
    
    // Draw scatter points
    scatterG.selectAll('.scatter-point')
        .data(statesWithData)
        .enter().append('circle')
        .attr('class', 'scatter-point')
        .attr('cx', d => {
            // Negative margin = Biden won (blue), Positive = Trump won (red)
            const margin = d.political_lean === 'Blue' ? -d.margin : d.margin;
            return xScatterScale(margin);
        })
        .attr('cy', d => yScatterScale(d.vax_rate))
        .attr('r', 6)
        .attr('fill', d => d.political_lean === 'Blue' ? '#2196F3' : '#f44336')
        .attr('opacity', 0.7)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('r', 9)
                .attr('opacity', 1);
            
            const tooltip = d3.select('body').append('div')
                .attr('class', 'scatter-tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0,0,0,0.9)')
                .style('color', 'white')
                .style('padding', '12px')
                .style('border-radius', '6px')
                .style('font-size', '13px')
                .style('pointer-events', 'none')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 20) + 'px')
                .html(`
                    <strong>${d.state}</strong><br/>
                    Vaccination Rate: ${d.vax_rate}%<br/>
                    ${d.political_lean === 'Blue' ? 'Biden' : 'Trump'} +${d.margin.toFixed(1)}%<br/>
                    Urban: ${d.urban_pct}% | ${d.urban_rural_class}
                `);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('r', 6)
                .attr('opacity', 0.7);
            d3.selectAll('.scatter-tooltip').remove();
        });
    
    // Add state labels for outliers or interesting cases
    const labeledStates = ['CA', 'TX', 'FL', 'NY', 'WY', 'VT', 'DC'];
    scatterG.selectAll('.state-label')
        .data(statesWithData.filter(d => labeledStates.includes(d.state)))
        .enter().append('text')
        .attr('class', 'state-label')
        .attr('x', d => {
            const margin = d.political_lean === 'Blue' ? -d.margin : d.margin;
            return xScatterScale(margin) + 10;
        })
        .attr('y', d => yScatterScale(d.vax_rate) + 5)
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .text(d => d.state);
    
    // Add correlation annotation
    scatterG.append('text')
        .attr('x', chartWidth - 20)
        .attr('y', 20)
        .attr('text-anchor', 'end')
        .style('font-size', '12px')
        .style('fill', '#666')
        .html(`Correlation: ${data.summary_stats.correlation_biden_vax.toFixed(3)}`);
}


// Clean up tooltips on slide change
export function cleanupPoliticalAnalysis() {
    d3.selectAll('.bar-tooltip').remove();
    d3.selectAll('.scatter-tooltip').remove();
}
