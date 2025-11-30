import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

export async function initPoliticalAnalysis(containerId) {
    // Load the political analysis data
    const data = await d3.json('data/political_vax_analysis.json');
    
    // Container setup
    const container = d3.select(`#${containerId}`);
    container.selectAll('*').remove();
    
    // Layout configuration
    const width = 650;
    const height = 200;  
    const margin = { top: 20, right: 50, bottom: 40, left: 55 };
    
    // Create main visualization container
    const vizContainer = container.append('div')
        .attr('class', 'political-viz-container')
        .style('background', 'white')
        .style('border-radius', '12px')
        .style('padding', '20px')
        .style('box-shadow', '0 4px 20px rgba(0,0,0,0.1)');
    
    // Summary Statistics
    const summaryDiv = vizContainer.append('div')
        .attr('class', 'summary-stats')
        .style('margin-bottom', '10px')
        .style('display', 'flex')
        .style('justify-content', 'space-around')
        .style('gap', '10px');
    
    // Blue states stat card
    summaryDiv.append('div')
        .attr('class', 'stat-card blue-card')
        .style('flex', '1')
        .style('background', 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)')
        .style('color', 'white')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('text-align', 'center')
        .html(`
            <div style="font-size: 11px; opacity: 0.9; margin-bottom: 5px;">BLUE STATES</div>
            <div style="font-size: 32px; font-weight: bold;">${data.summary_stats.blue_states_avg}%</div>
            <div style="font-size: 10px; opacity: 0.8; margin-top: 5px;">Average Vaccination Rate</div>
        `);
    
    // Red states stat card
    summaryDiv.append('div')
        .attr('class', 'stat-card red-card')
        .style('flex', '1')
        .style('background', 'linear-gradient(135deg, #f44336 0%, #c62828 100%)')
        .style('color', 'white')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('text-align', 'center')
        .html(`
            <div style="font-size: 11px; opacity: 0.9; margin-bottom: 5px;">RED STATES</div>
            <div style="font-size: 32px; font-weight: bold;">${data.summary_stats.red_states_avg}%</div>
            <div style="font-size: 10px; opacity: 0.8; margin-top: 5px;">Average Vaccination Rate</div>
        `);
    
    // Gap stat card
    summaryDiv.append('div')
        .attr('class', 'stat-card gap-card')
        .style('flex', '1')
        .style('background', 'linear-gradient(135deg, #9E9E9E 0%, #616161 100%)')
        .style('color', 'white')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('text-align', 'center')
        .html(`
            <div style="font-size: 11px; opacity: 0.9; margin-bottom: 5px;">PARTISAN GAP</div>
            <div style="font-size: 32px; font-weight: bold;">${data.summary_stats.gap.toFixed(1)}%</div>
            <div style="font-size: 10px; opacity: 0.8; margin-top: 5px;">Percentage Point Difference</div>
        `);
    
    // Calculate chart dimensions ONCE
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Time Series Chart
    const timeSeriesDiv = vizContainer.append('div')
        .attr('class', 'time-series-chart')
        .style('margin-bottom', '20px');
    
    timeSeriesDiv.append('h3')
        .style('text-align', 'center')
        .style('margin-bottom', '15px')
        .style('color', '#333')
        .style('font-size', '16px')
        .text('Vaccination Rates Over Time: Red vs Blue States');
    
    const timeSeriesSvg = timeSeriesDiv.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const timeSeriesG = timeSeriesSvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data.time_series, d => d.year))
        .range([0, chartWidth]);
    
    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([chartHeight, 0]);
    
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
    
    timeSeriesG.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScale).tickSize(-chartWidth).tickFormat(''));
    
    timeSeriesG.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
        .style('font-size', '11px');
    
    timeSeriesG.append('g')
        .call(d3.axisLeft(yScale).tickFormat(d => d + '%'))
        .style('font-size', '11px');
    
    timeSeriesG.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -45)
        .attr('x', -chartHeight / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#666')
        .text('Vaccination Rate (%)');
    
    timeSeriesG.append('path')
        .datum(data.time_series)
        .attr('fill', 'none')
        .attr('stroke', '#f44336')
        .attr('stroke-width', 2.5)
        .attr('d', redLine);
    
    timeSeriesG.append('path')
        .datum(data.time_series)
        .attr('fill', 'none')
        .attr('stroke', '#2196F3')
        .attr('stroke-width', 2.5)
        .attr('d', blueLine);
    
    timeSeriesG.selectAll('.red-circle')
        .data(data.time_series.filter(d => d.red_states_avg !== null))
        .enter().append('circle')
        .attr('class', 'red-circle')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.red_states_avg))
        .attr('r', 4)
        .attr('fill', '#f44336')
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5);
    
    timeSeriesG.selectAll('.blue-circle')
        .data(data.time_series.filter(d => d.blue_states_avg !== null))
        .enter().append('circle')
        .attr('class', 'blue-circle')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.blue_states_avg))
        .attr('r', 4)
        .attr('fill', '#2196F3')
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5);
    
    const legend = timeSeriesG.append('g')
        .attr('transform', `translate(${chartWidth - 120}, 10)`);
    
    legend.append('line')
        .attr('x1', 0).attr('x2', 30)
        .attr('y1', 0).attr('y2', 0)
        .attr('stroke', '#f44336')
        .attr('stroke-width', 2.5);
    
    legend.append('text')
        .attr('x', 35).attr('y', 4)
        .style('font-size', '12px')
        .text('Red States');
    
    legend.append('line')
        .attr('x1', 0).attr('x2', 30)
        .attr('y1', 20).attr('y2', 20)
        .attr('stroke', '#2196F3')
        .attr('stroke-width', 2.5);
    
    legend.append('text')
        .attr('x', 35).attr('y', 24)
        .style('font-size', '12px')
        .text('Blue States');
    
    // Urban/Rural Breakdown
    const urbanRuralDiv = vizContainer.append('div')
        .attr('class', 'urban-rural-chart')
        .style('margin-bottom', '20px');
    
    urbanRuralDiv.append('h3')
        .style('text-align', 'center')
        .style('margin-bottom', '15px')
        .style('color', '#333')
        .style('font-size', '16px')
        .text('Urban vs Rural: Vaccination Rates by Political Lean');
    
    const urbanRuralSvg = urbanRuralDiv.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const urbanRuralG = urbanRuralSvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const urbanClasses = ['Urban', 'Mixed', 'Rural'];
    
    const xUrbanScale = d3.scaleBand()
        .domain(urbanClasses)
        .range([0, chartWidth])
        .padding(0.3);
    
    const xSubScale = d3.scaleBand()
        .domain(['Red', 'Blue'])
        .range([0, xUrbanScale.bandwidth()])
        .padding(0.1);
    
    const yUrbanScale = d3.scaleLinear()
        .domain([0, 100])
        .range([chartHeight, 0]);
    
    urbanRuralG.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yUrbanScale).tickSize(-chartWidth).tickFormat(''));
    
    urbanRuralG.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xUrbanScale))
        .style('font-size', '11px');
    
    urbanRuralG.append('g')
        .call(d3.axisLeft(yUrbanScale).tickFormat(d => d + '%'))
        .style('font-size', '11px');
    
    urbanRuralG.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -45)
        .attr('x', -chartHeight / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#666')
        .text('Vaccination Rate (%)');
    
    const colorScale = d3.scaleOrdinal()
        .domain(['Red', 'Blue'])
        .range(['#f44336', '#2196F3']);
    
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
                const tooltip = d3.select('body').append('div')
                    .attr('class', 'bar-tooltip')
                    .style('position', 'absolute')
                    .style('background', 'rgba(0,0,0,0.8)')
                    .style('color', 'white')
                    .style('padding', '8px')
                    .style('border-radius', '4px')
                    .style('font-size', '11px')
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
        
        urbanRuralG.selectAll(`.label-${urbanClass}`)
            .data(urbanData)
            .enter().append('text')
            .attr('class', `label-${urbanClass}`)
            .attr('x', d => xUrbanScale(urbanClass) + xSubScale(d.political_lean) + xSubScale.bandwidth() / 2)
            .attr('y', d => yUrbanScale(d.avg_vax_rate) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(d => `${d.avg_vax_rate}%`);
    });
    
    // Scatter Plot
    const scatterDiv = vizContainer.append('div')
        .attr('class', 'scatter-chart');
    
    scatterDiv.append('h3')
        .style('text-align', 'center')
        .style('margin-bottom', '15px')
        .style('color', '#333')
        .style('font-size', '16px')
        .text('Political Margin vs Vaccination Rate (Latest Year)');
    
    const scatterSvg = scatterDiv.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const scatterG = scatterSvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const statesWithData = data.states.filter(d => d.vax_rate !== null);
    
    const xScatterScale = d3.scaleLinear()
        .domain([-50, 50])
        .range([0, chartWidth]);
    
    const yScatterScale = d3.scaleLinear()
        .domain([0, 100])
        .range([chartHeight, 0]);
    
    scatterG.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScatterScale).tickSize(-chartWidth).tickFormat(''));
    
    scatterG.append('line')
        .attr('x1', xScatterScale(0))
        .attr('x2', xScatterScale(0))
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', '#999')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4');
    
    scatterG.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScatterScale).tickFormat(d => {
            if (d < 0) return `Biden +${Math.abs(d)}`;
            if (d > 0) return `Trump +${d}`;
            return 'Even';
        }))
        .style('font-size', '10px');
    
    scatterG.append('g')
        .call(d3.axisLeft(yScatterScale).tickFormat(d => d + '%'))
        .style('font-size', '11px');
    
    scatterG.append('text')
        .attr('x', chartWidth / 2)
        .attr('y', chartHeight + 40)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#666')
        .text('Political Margin (2020 Election)');
    
    scatterG.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -45)
        .attr('x', -chartHeight / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#666')
        .text('Vaccination Rate (%)');
    
    scatterG.selectAll('.scatter-point')
        .data(statesWithData)
        .enter().append('circle')
        .attr('class', 'scatter-point')
        .attr('cx', d => {
            const margin = d.political_lean === 'Blue' ? -d.margin : d.margin;
            return xScatterScale(margin);
        })
        .attr('cy', d => yScatterScale(d.vax_rate))
        .attr('r', 5)
        .attr('fill', d => d.political_lean === 'Blue' ? '#2196F3' : '#f44336')
        .attr('opacity', 0.7)
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('r', 7).attr('opacity', 1);
            const tooltip = d3.select('body').append('div')
                .attr('class', 'scatter-tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0,0,0,0.9)')
                .style('color', 'white')
                .style('padding', '10px')
                .style('border-radius', '5px')
                .style('font-size', '12px')
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
            d3.select(this).attr('r', 5).attr('opacity', 0.7);
            d3.selectAll('.scatter-tooltip').remove();
        });
    
    const labeledStates = ['CA', 'TX', 'FL', 'NY', 'WY', 'VT', 'DC'];
    scatterG.selectAll('.state-label')
        .data(statesWithData.filter(d => labeledStates.includes(d.state)))
        .enter().append('text')
        .attr('class', 'state-label')
        .attr('x', d => {
            const margin = d.political_lean === 'Blue' ? -d.margin : d.margin;
            return xScatterScale(margin) + 8;
        })
        .attr('y', d => yScatterScale(d.vax_rate) + 4)
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .text(d => d.state);
    
    scatterG.append('text')
        .attr('x', chartWidth - 15)
        .attr('y', 15)
        .attr('text-anchor', 'end')
        .style('font-size', '11px')
        .style('fill', '#666')
        .text(`Correlation: ${data.summary_stats.correlation_biden_vax.toFixed(3)}`);
}

export function cleanupPoliticalAnalysis() {
    d3.selectAll('.bar-tooltip').remove();
    d3.selectAll('.scatter-tooltip').remove();
}
