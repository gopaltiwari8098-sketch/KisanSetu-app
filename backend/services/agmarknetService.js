const pool = require('../config/db');
require('dotenv').config();

const AGMARKNET_API_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const API_KEY = process.env.AGMARKNET_API_KEY;

// Agmarknet ke commodity names -> hamare DB ke names
const COMMODITY_MAP = {
  'wheat': 'Wheat', 'wheat(other)': 'Wheat',
  'rice': 'Rice', 'paddy(dpr)': 'Rice', 'paddy': 'Rice', 'rice (common)': 'Rice',
  'maize': 'Maize', 'bajra': 'Bajra', 'jowar(white)': 'Jowar', 'jowar': 'Jowar',
  'barley': 'Barley',
  'onion': 'Onion', 'onion(local)': 'Onion', 'onion(big)': 'Onion',
  'potato': 'Potato', 'potato(deshi)': 'Potato', 'potato(jyoti)': 'Potato',
  'tomato': 'Tomato', 'tomato(deshi)': 'Tomato', 'tomato(hybrid)': 'Tomato',
  'brinjal': 'Brinjal', 'cauliflower': 'Cauliflower', 'cabbage': 'Cabbage',
  'bhindi(ladies finger)': 'Lady Finger', 'lady finger': 'Lady Finger', 'okra': 'Lady Finger',
  'green chilli': 'Green Chilli', 'chilly green': 'Green Chilli',
  'garlic': 'Garlic', 'ginger': 'Ginger', 'carrot': 'Carrot',
  'peas wet': 'Peas', 'peas': 'Peas',
  'cucumber(kheera)': 'Cucumber', 'cucumber': 'Cucumber',
  'pumpkin': 'Pumpkin', 'bitter gourd': 'Bitter Gourd', 'bottle gourd': 'Bottle Gourd',
  'coriander(leaves)': 'Green Coriander', 'spinach': 'Spinach',
  'mustard': 'Mustard', 'mustard(sarson)': 'Mustard', 'rape seed': 'Mustard',
  'soyabean': 'Soybean', 'soybean': 'Soybean',
  'groundnut': 'Groundnut', 'groundnut (split)': 'Groundnut',
  'sunflower': 'Sunflower', 'sunflower seed': 'Sunflower',
  'sesamum(sesame/til)': 'Sesame', 'sesame': 'Sesame', 'til': 'Sesame',
  'gram': 'Gram', 'chana': 'Gram', 'gram (split)': 'Gram',
  'arhar (tur/red gram)(whole)': 'Arhar Dal', 'arhar': 'Arhar Dal', 'tur': 'Arhar Dal',
  'moong (whole)': 'Moong Dal', 'moong': 'Moong Dal', 'green gram': 'Moong Dal',
  'urad (whole)': 'Urad Dal', 'urad': 'Urad Dal', 'black gram': 'Urad Dal',
  'masur (whole)': 'Masoor Dal', 'masoor': 'Masoor Dal', 'lentil': 'Masoor Dal',
  'cotton': 'Cotton', 'cotton(unginned)': 'Cotton', 'kapas': 'Cotton',
  'sugarcane': 'Sugarcane', 'banana': 'Banana', 'banana - green': 'Banana',
  'mango (raw)': 'Mango', 'mango': 'Mango', 'papaya (raw)': 'Papaya', 'papaya': 'Papaya',
  'guava': 'Guava', 'pomegranate': 'Pomegranate', 'lemon': 'Lemon',
  'orange': 'Orange', 'grapes': 'Grapes', 'watermelon': 'Watermelon',
  'turmeric': 'Turmeric', 'black pepper': 'Black Pepper',
  'cumin(jeera)': 'Cumin', 'cumin': 'Cumin', 'jeera': 'Cumin',
  'coriander(seed)': 'Coriander Seeds', 'dhania': 'Coriander Seeds',
};

function mapCommodityName(agmarknetName) {
  const lower = agmarknetName.toLowerCase().trim();
  if (COMMODITY_MAP[lower]) return COMMODITY_MAP[lower];
  // Partial match try karo
  for (const [key, val] of Object.entries(COMMODITY_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return null;
}

async function fetchFromAgmarknet(state, limit = 500) {
  try {
    const url = `${AGMARKNET_API_URL}?api-key=${API_KEY}&format=json&limit=${limit}&filters[State]=${encodeURIComponent(state)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Agmarknet API error: ${res.status}`);
    const data = await res.json();
    return data.records || [];
  } catch (err) {
    console.error('Agmarknet fetch error:', err.message);
    return [];
  }
}

async function syncPricesToDB(records) {
  let synced = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      const dbCropName = mapCommodityName(record.commodity || '');
      if (!dbCropName) { skipped++; continue; }

      const modalPrice = parseFloat(record.modal_price);
      if (!modalPrice || isNaN(modalPrice) || modalPrice <= 0) continue;

      const mandiName = `${record.market} Mandi`;
      const stateName = record.state;
      const district = record.district;

      // Mandi dhundo ya banao
      let mandiResult = await pool.query(
        'SELECT id FROM mandis WHERE LOWER(name) = LOWER($1) AND LOWER(state) = LOWER($2)',
        [mandiName, stateName]
      );

      let mandiId;
      if (mandiResult.rows.length === 0) {
        const newMandi = await pool.query(
          `INSERT INTO mandis (name, state, district)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING RETURNING id`,
          [mandiName, stateName, district]
        );
        if (!newMandi.rows.length) continue;
        mandiId = newMandi.rows[0].id;
      } else {
        mandiId = mandiResult.rows[0].id;
      }

      // Crop dhundo
      const cropResult = await pool.query(
        'SELECT id FROM crops WHERE name_en = $1',
        [dbCropName]
      );
      if (!cropResult.rows.length) continue;
      const cropId = cropResult.rows[0].id;

      await pool.query(
        `INSERT INTO prices (mandi_id, crop_id, price, recorded_date)
         VALUES ($1, $2, $3, CURRENT_DATE)
         ON CONFLICT (mandi_id, crop_id, recorded_date)
         DO UPDATE SET price = EXCLUDED.price`,
        [mandiId, cropId, modalPrice]
      );
      synced++;
    } catch (err) {
      console.error('Record sync error:', err.message);
    }
  }

  console.log(`Synced: ${synced}, Skipped (no mapping): ${skipped}`);
  return synced;
}

async function runDailySync() {
  console.log('Agmarknet daily sync shuru...');
  const states = [
    'Uttar Pradesh', 'Punjab', 'Haryana', 'Rajasthan',
    'Madhya Pradesh', 'Maharashtra', 'Gujarat', 'Bihar',
    'West Bengal', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh',
    'Telangana', 'Odisha', 'Chhattisgarh', 'Uttarakhand'
  ];

  let totalSynced = 0;
  for (const state of states) {
    console.log(`Fetching ${state}...`);
    const records = await fetchFromAgmarknet(state, 1000);
    const synced = await syncPricesToDB(records);
    totalSynced += synced;
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`Daily sync complete. Total: ${totalSynced} records`);
  return totalSynced;
}

module.exports = { runDailySync, fetchFromAgmarknet };