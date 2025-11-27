import pandas as pd
import json
import numpy as np

# Load the dataset
file_path = "COVID-19_Vaccinations_in_the_United_States,County_20251119.csv"
df = pd.read_csv(file_path)

# Convert Date to datetime and extract Year
df['Date'] = pd.to_datetime(df['Date'])
df['Year'] = df['Date'].dt.year

# Clean and convert columns to numeric
cols_to_clean = ['Series_Complete_Pop_Pct', 'Series_Complete_Yes', 'Census2019', 'Completeness_pct']
for col in cols_to_clean:
    df[col] = pd.to_numeric(df[col].astype(str).str.replace(',', ''), errors='coerce')

# Ensure FIPS is 5-digit string
df['FIPS'] = df['FIPS'].astype(str).str.split('.').str[0].str.zfill(5)

# Filter for relevant years if needed (e.g., 2020-2023)
# df = df[df['Year'].isin([2020, 2021, 2022, 2023])]

# Aggregate County Data: Take the max value for each year (assuming cumulative or best representation)
county_vax_by_year = df.groupby(['FIPS', 'Recip_State', 'Recip_County', 'Year'])[['Series_Complete_Pop_Pct', 'Completeness_pct']].max().reset_index()

# Aggregate State Data: Calculate weighted average
state_agg = df.groupby(['Recip_State', 'Year']).apply(
    lambda x: (x['Series_Complete_Yes'].sum() / x['Census2019'].sum()) * 100 if x['Census2019'].sum() > 0 else 0
).reset_index(name='Series_Complete_Pop_Pct')

# State Abbreviation to FIPS mapping (including PR)
state_abbr_to_fips = {
    'AL': '01', 'AK': '02', 'AZ': '04', 'AR': '05', 'CA': '06', 'CO': '08', 'CT': '09', 'DE': '10', 'FL': '12', 'GA': '13',
    'HI': '15', 'ID': '16', 'IL': '17', 'IN': '18', 'IA': '19', 'KS': '20', 'KY': '21', 'LA': '22', 'ME': '23', 'MD': '24',
    'MA': '25', 'MI': '26', 'MN': '27', 'MS': '28', 'MO': '29', 'MT': '30', 'NE': '31', 'NV': '32', 'NH': '33', 'NJ': '34',
    'NM': '35', 'NY': '36', 'NC': '37', 'ND': '38', 'OH': '39', 'OK': '40', 'OR': '41', 'PA': '42', 'RI': '44', 'SC': '45',
    'SD': '46', 'TN': '47', 'TX': '48', 'UT': '49', 'VT': '50', 'VA': '51', 'WA': '53', 'WV': '54', 'WI': '55', 'WY': '56',
    'PR': '72', 'DC': '11'
}

# Add FIPS to state data
state_agg['FIPS'] = state_agg['Recip_State'].map(state_abbr_to_fips)
state_agg = state_agg.dropna(subset=['FIPS']) # Drop states without FIPS mapping (e.g. US, VI, GU if any)
# state_agg['FIPS'] = state_agg['FIPS'].astype(int) # REMOVED to preserve leading zeros (e.g. '06')

# Prepare JSON structure
output_data = {
    "years": sorted(df['Year'].unique().tolist()),
    "counties": {},
    "states": {}
}

# Populate Counties
for _, row in county_vax_by_year.iterrows():
    fips = row['FIPS']
    year = str(row['Year'])
    if fips not in output_data["counties"]:
        output_data["counties"][fips] = {}
    
    rate = row['Series_Complete_Pop_Pct']
    if pd.isna(rate):
        rate = None
        
    completeness = row['Completeness_pct']
    if pd.isna(completeness):
        completeness = None

    output_data["counties"][fips][year] = {
        "rate": rate,
        "completeness": completeness,
        "name": row['Recip_County'],
        "state": row['Recip_State']
    }

# Populate States
for _, row in state_agg.iterrows():
    fips = str(row['FIPS'])
    year = str(row['Year'])
    if fips not in output_data["states"]:
        output_data["states"][fips] = {}
        
    rate = row['Series_Complete_Pop_Pct']
    if pd.isna(rate):
        rate = None

    output_data["states"][fips][year] = {
        "rate": rate,
        "abbr": row['Recip_State']
    }

# Save to JSON file
with open('vaccination_data.json', 'w') as f:
    json.dump(output_data, f)

print("Data exported to vaccination_data.json")
