# COVID-19 Vaccination Explorer

An interactive, scrolling D3.js site that traces how COVID-19 spread and how vaccination rolled out across the United States, from national trends down to individual counties. The story ends by looking at how political lean related to vaccination rates, and how that gap may have shaped the course of the pandemic.

**Live site:** [khanhphan.com/Case-Study-BHKL-Labs](https://khanhphan.com/Case-Study-BHKL-Labs/)<br>
**Team (BHKL Labs):** Bokyoung Son, Hangyi Zhao, Khanh Phan, Layth Marabeh<br>
**Course:** DSC 209R, Data Visualization, UC San Diego

## Question
How did COVID-19 cases, deaths, and vaccination rates change across U.S. states and counties, and how did vaccine uptake differ by political lean?

## Data
- **[CDC COVID-19 Vaccinations in the United States, Jurisdiction](https://data.cdc.gov/Vaccinations/COVID-19-Vaccinations-in-the-United-States-Jurisdi/unsk-b7fc/about_data)**: state-level vaccination rates, 2020 to 2023
- **[CDC COVID-19 Vaccinations in the United States, County](https://data.cdc.gov/Vaccinations/COVID-19-Vaccinations-in-the-United-States-County/8xkx-amqh/about_data)**: county-level vaccination rates for the drill-down map (pulled in `data/generate_data.py`)
- **[Corona Virus Report (Kaggle)](https://www.kaggle.com/datasets/imdevskp/corona-virus-report)**: U.S. county-level cases and deaths
- **2020 presidential election results** by state, used to classify political lean _[add source link]_
- **Census urban/rural classification** by state
- U.S. TopoJSON boundaries for states and counties

## Method
The site moves through four sections:
1. **Before vaccines (January to July 2020):** animated case and death counts for the five largest counties in each state
2. **Vaccination explorer (2020 to 2023):** a state-to-county drill-down map with controls for year, dose type (first dose, fully vaccinated, booster), and county search
3. **Timeline:** vaccination uptake alongside key political milestones
4. **Political lean and vaccination:** red vs. blue state trends over time, an urban/rural breakdown, and a scatter plot of 2020 election margin against vaccination rate

We cleaned and reshaped the data in Python and pandas, exported it to JSON, and rendered it with D3.js.

## Results
- By 2023, states that voted for Biden in 2020 averaged a **72.4%** vaccination rate, compared with **60.5%** in states that voted for Trump, an **11.9-point gap**.
- The gap grew over time, from 6.8 points in 2021 to 10.6 points in 2022 and 11.9 points in 2023.
- The gap held even among urban states: urban blue states averaged 71.4%, while urban red states averaged 62.9%.
- Across states, vote share and vaccination rate were moderately correlated (r = 0.48).

These are state-level associations. They do not show that politics caused the differences in vaccination, or that lower vaccination caused more spread, but they point to where public health outreach faced the most resistance.

## Built with
`D3.js` `TopoJSON` `Scrollama` `Plotly` `Python` `pandas` `HTML` `CSS`
