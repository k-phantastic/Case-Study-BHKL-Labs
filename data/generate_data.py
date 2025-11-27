import pandas as pd
import json
import numpy as np

# Load the dataset
# file_path = "COVID-19_Vaccinations_in_the_United_States,County_20251119.csv"
# df = pd.read_csv(file_path)
file_path = (
    "https://data.cdc.gov/resource/8xkx-amqh.csv?"
    "$select=fips,recip_state,recip_county,date,"
    "series_complete_pop_pct,administered_dose1_pop_pct,"
    "booster_doses_vax_pct,completeness_pct,"
    "series_complete_yes,census2019"
    "&$limit=2000000"
)
df = pd.read_csv(file_path)
df.columns = df.columns.str.lower()

# Convert Date to datetime and extract Year
df['date'] = pd.to_datetime(df['date'])
df['year'] = df['date'].dt.year

# Clean and convert columns to numeric
# cols_to_clean = ['Series_Complete_Pop_Pct',
#                  'Series_Complete_Yes', 'Census2019', 'Completeness_pct']
# for col in cols_to_clean:
#     df[col] = pd.to_numeric(df[col].astype(
#         str).str.replace(',', ''), errors='coerce')
cols_to_clean = [
    'series_complete_pop_pct',
    'administered_dose1_pop_pct',
    'booster_doses_vax_pct',
    'completeness_pct',
    'series_complete_yes',
    'census2019'
]

for col in cols_to_clean:
    df[col] = (
        df[col]
        .astype(str)
        .str.replace(',', '')
        .str.replace('%', '')
        .replace({"Suppressed": None, "": None})
    )
    df[col] = pd.to_numeric(df[col], errors="coerce")


# Ensure FIPS is 5-digit string
df['fips'] = df['fips'].astype(str).str.split('.').str[0].str.zfill(5)

# Filter for relevant years if needed (e.g., 2020-2023)
# df = df[df['Year'].isin([2020, 2021, 2022, 2023])]

# Aggregate County Data: Take the max value for each year (assuming cumulative or best representation)
county_vax_by_year = df.groupby(['fips', 'recip_state', 'recip_county', 'year'])[
    ['series_complete_pop_pct', 'administered_dose1_pop_pct', 'booster_doses_vax_pct', 'completeness_pct']].max().reset_index()

# Aggregate State Data: Calculate weighted average
state_agg = df.groupby(['recip_state', 'year']).apply(
    lambda x: (x['series_complete_yes'].sum() / x['census2019'].sum()
               ) * 100 if x['census2019'].sum() > 0 else 0
).reset_index(name='series_complete_pop_pct')

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
state_agg['fips'] = state_agg['recip_state'].map(state_abbr_to_fips)
# Drop states without FIPS mapping (e.g. US, VI, GU if any)
state_agg = state_agg.dropna(subset=['fips'])
# state_agg['FIPS'] = state_agg['FIPS'].astype(int) # REMOVED to preserve leading zeros (e.g. '06')

# Prepare JSON structure
output_data = {
    "years": sorted(df['year'].unique().tolist()),
    "counties": {},
    "states": {}
}

# Populate Counties
for _, row in county_vax_by_year.iterrows():
    fips = row['fips']
    year = str(row['year'])
    if fips not in output_data["counties"]:
        output_data["counties"][fips] = {}

    fully = row['series_complete_pop_pct']
    if pd.isna(fully):
        fully = None

    dose1 = row['administered_dose1_pop_pct']
    if pd.isna(dose1):
        dose1 = None

    booster = row['booster_doses_vax_pct']
    if pd.isna(booster):
        booster = None

    completeness = row['completeness_pct']
    if pd.isna(completeness):
        completeness = None

    output_data["counties"][fips][year] = {
        "fully_rate": fully,
        "dose1_rate": dose1,
        "booster_rate": booster,
        "completeness": completeness,
        "name": row['recip_county'],
        "state": row['recip_state']
    }

# Populate States
for _, row in state_agg.iterrows():
    fips = str(row['fips'])
    year = str(row['year'])
    if fips not in output_data["states"]:
        output_data["states"][fips] = {}

    rate = row['series_complete_pop_pct']
    if pd.isna(rate):
        rate = None

    output_data["states"][fips][year] = {
        "rate": rate,
        "abbr": row['recip_state']
    }

# Save to JSON file
with open('vaccination_data.json', 'w') as f:
    json.dump(output_data, f)

print("Data exported to vaccination_data.json")
