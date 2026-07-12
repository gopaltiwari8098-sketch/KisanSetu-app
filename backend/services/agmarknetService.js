const pool = require('../config/db');
require('dotenv').config();

const API_KEY = process.env.AGMARKNET_API_KEY;
const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';

const COMMODITY_MAP = {
  'wheat': 'Wheat', 'wheat(other)': 'Wheat', 'wheat(dara)': 'Wheat',
  'rice': 'Rice', 'paddy(dpr)': 'Rice', 'paddy': 'Rice', 'rice (common)': 'Rice',
  'maize': 'Maize', 'bajra': 'Bajra', 'jowar(white)': 'Jowar', 'jowar': 'Jowar',
  'barley': 'Barley',
  'onion': 'Onion', 'onion(local)': 'Onion', 'onion(big)': 'Onion',
  'potato': 'Potato', 'potato(deshi)': 'Potato', 'potato(jyoti)': 'Potato',
  'tomato': 'Tomato', 'tomato(deshi)': 'Tomato', 'tomato(hybrid)': 'Tomato',
  'brinjal': 'Brinjal',
  'cauliflower': 'Cauliflower',
  'cabbage': 'Cabbage',
  'bhindi(ladies finger)': 'Lady Finger', 'bhindi': 'Lady Finger',
  'lady finger': 'Lady Finger', 'okra': 'Lady Finger',
  'green chilli': 'Green Chilli', 'chilly green': 'Green Chilli', 'chilli': 'Green Chilli',
  'garlic': 'Garlic',
  'ginger': 'Ginger', 'ginger(dry)': 'Ginger',
  'carrot': 'Carrot',
  'peas wet': 'Peas', 'peas': 'Peas', 'peas(raw)': 'Peas',
  'cucumber(kheera)': 'Cucumber', 'cucumber': 'Cucumber',
  'pumpkin': 'Pumpkin',
  'bitter gourd': 'Bitter Gourd',
  'bottle gourd': 'Bottle Gourd',
  'coriander(leaves)': 'Green Coriander', 'coriander leaves': 'Green Coriander',
  'spinach': 'Spinach',
  'mustard': 'Mustard', 'mustard(sarson)': 'Mustard', 'rape seed': 'Mustard',
  'soyabean': 'Soybean', 'soybean': 'Soybean',
  'groundnut': 'Groundnut', 'groundnut (split)': 'Groundnut',
  'sunflower': 'Sunflower', 'sunflower seed': 'Sunflower',
  'sesamum(sesame/til)': 'Sesame', 'sesame': 'Sesame', 'til': 'Sesame',
  'gram': 'Gram', 'bengal gram(whole)': 'Gram', 'chana': 'Gram',
  'arhar (tur/red gram)(whole)': 'Arhar Dal', 'arhar': 'Arhar Dal',
  'tur': 'Arhar Dal', 'red gram': 'Arhar Dal',
  'moong (whole)': 'Moong Dal', 'moong': 'Moong Dal', 'green gram': 'Moong Dal',
  'urad (whole)': 'Urad Dal', 'urad': 'Urad Dal', 'black gram': 'Urad Dal',
  'masur (whole)': 'Masoor Dal', 'masoor': 'Masoor Dal', 'lentil': 'Masoor Dal',
  'cotton': 'Cotton', 'cotton(unginned)': 'Cotton', 'kapas': 'Cotton',
  'sugarcane': 'Sugarcane',
  'banana': 'Banana', 'banana - green': 'Banana',
  'mango (raw)': 'Mango', 'mango': 'Mango',
  'papaya (raw)': 'Papaya', 'papaya': 'Papaya',
  'guava': 'Guava',
  'pomegranate': 'Pomegranate',
  'lemon': 'Lemon',
  'orange': 'Orange',
  'grapes': 'Grapes',
  'watermelon': 'Watermelon',
  'turmeric': 'Turmeric',
  'black pepper': 'Black Pepper',
  'cumin(jeera)': 'Cumin', 'cumin': 'Cumin', 'jeera': 'Cumin',
  'coriander(seed)': 'Coriander Seeds', 'dhania': 'Coriander Seeds',
  'coriander seed': 'Coriander Seeds',
};

function mapCommodityName(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  if (COMMODITY_MAP[lower]) return COMMODITY_MAP[lower];
  for (const [key, val] of Object.entries(COMMODITY_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return null;
}

async function fetchFromAgmarknet(state, limit = 1000) {
  if (!API_KEY) {
    console.error('AGMARKNET_API_KEY not set');
    return [];
  }
  try {
    // Aaj ki date filter karo (DD/MM/YYYY format)
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayStr = `${dd}/${mm}/${yyyy}`;

    const url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=${limit}&filters[State]=${encodeURIComponent(state)}&filters[arrival_date]=${encodeURIComponent(todayStr)}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.error(`API error: ${res.status} for ${state}`);
      return [];
    }
    const data = await res.json();
    const records = data.records || [];
    console.log(`${state}: ${records.length} records (today filter)`);

    // Agar aaj ka data nahi mila, bina date filter ke try karo
    if (records.length === 0) {
      const urlNoDate = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=${limit}&filters[State]=${encodeURIComponent(state)}`;
      const res2 = await fetch(urlNoDate, { signal: AbortSignal.timeout(15000) });
      if (!res2.ok) return [];
      const data2 = await res2.json();
      const records2 = data2.records || [];
      console.log(`${state}: ${records2.length} records (no date filter)`);
      return records2;
    }

    return records;
  } catch (err) {
    console.error(`Fetch error (${state}):`, err.message);
    return [];
  }
}

async function syncPricesToDB(records) {
  let synced = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      // Resource 1 exact field names (lowercase)
      const commodityRaw = record.commodity || '';
      const marketRaw = record.market || '';
      const stateRaw = record.state || '';
      const districtRaw = record.district || '';
      const modalPrice = parseFloat(record.modal_price || 0);

      if (!commodityRaw || !marketRaw || !stateRaw || modalPrice <= 0) continue;

      const dbCropName = mapCommodityName(commodityRaw);
      if (!dbCropName) { skipped++; continue; }

      const mandiName = `${marketRaw} Mandi`;

      // Mandi dhundo ya banao
      let mandiResult = await pool.query(
        'SELECT id FROM mandis WHERE LOWER(name) = LOWER($1) AND LOWER(state) = LOWER($2)',
        [mandiName, stateRaw]
      );

      let mandiId;
      if (mandiResult.rows.length === 0) {
        const newMandi = await pool.query(
          `INSERT INTO mandis (name, state, district)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING RETURNING id`,
          [mandiName, stateRaw, districtRaw]
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

      await pool.query(
        `INSERT INTO prices (mandi_id, crop_id, price, recorded_date)
         VALUES ($1, $2, $3, CURRENT_DATE)
         ON CONFLICT (mandi_id, crop_id, recorded_date)
         DO UPDATE SET price = EXCLUDED.price`,
        [mandiId, cropResult.rows[0].id, modalPrice]
      );
      synced++;
    } catch (err) {
      // Silent continue
    }
  }

  console.log(`Batch complete — Synced: ${synced}, Skipped: ${skipped}`);
  return synced;
}

async function runDailySync() {
  console.log('=== Agmarknet Daily Sync Start ===');

  const states = [
    'Uttar Pradesh', 'Punjab', 'Haryana', 'Rajasthan',
    'Madhya Pradesh', 'Maharashtra', 'Gujarat', 'Bihar',
    'West Bengal', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh',
    'Telangana', 'Odisha', 'Chhattisgarh', 'Uttarakhand',
    'Himachal Pradesh', 'Assam', 'Jharkhand', 'Kerala'
  ];

  let totalSynced = 0;

  for (const state of states) {
    const records = await fetchFromAgmarknet(state, 1000);
    if (records.length > 0) {
      const synced = await syncPricesToDB(records);
      totalSynced += synced;
    }
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`=== Sync Complete: ${totalSynced} real prices inserted ===`);
  return totalSynced;
}

module.exports = { runDailySync, fetchFromAgmarknet };