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
  'brinjal': 'Brinjal', 'cauliflower': 'Cauliflower', 'cabbage': 'Cabbage',
  'bhindi(ladies finger)': 'Lady Finger', 'bhindi': 'Lady Finger',
  'lady finger': 'Lady Finger', 'okra': 'Lady Finger',
  'green chilli': 'Green Chilli', 'chilly green': 'Green Chilli', 'chilli': 'Green Chilli',
  'garlic': 'Garlic', 'ginger': 'Ginger', 'ginger(dry)': 'Ginger',
  'carrot': 'Carrot', 'peas wet': 'Peas', 'peas': 'Peas', 'peas(raw)': 'Peas',
  'cucumber(kheera)': 'Cucumber', 'cucumber': 'Cucumber',
  'pumpkin': 'Pumpkin', 'bitter gourd': 'Bitter Gourd', 'bottle gourd': 'Bottle Gourd',
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
  'guava': 'Guava', 'pomegranate': 'Pomegranate', 'lemon': 'Lemon',
  'orange': 'Orange', 'grapes': 'Grapes', 'watermelon': 'Watermelon',
  'turmeric': 'Turmeric', 'black pepper': 'Black Pepper',
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

function parseArrivalDate(raw) {
  try {
    if (!raw) return new Date().toISOString().split('T')[0];
    const parts = raw.trim().split('/');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      const d = new Date(`${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
  } catch { /* ignore */ }
  return new Date().toISOString().split('T')[0];
}

async function fetchFromAgmarknet(state, limit = 1000) {
  if (!API_KEY) {
    console.error('[AGMARKNET] API_KEY not set');
    return [];
  }
  try {
    const url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=${limit}&filters[State]=${encodeURIComponent(state)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const data = await res.json();
    const records = data.records || [];
    if (records.length > 0) {
      const dates = [...new Set(records.map(r => r.arrival_date))].slice(0, 2);
      console.log(`[AGMARKNET] ${state}: ${records.length} records | dates: ${dates.join(', ')}`);
    }
    return records;
  } catch (err) {
    console.error(`[AGMARKNET] ${state}: ${err.message}`);
    return [];
  }
}

async function syncPricesToDB(records, stateName) {
  let synced = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      const commodityRaw = record.commodity || '';
      const marketRaw = record.market || '';
      const stateRaw = record.state || stateName || '';
      const districtRaw = record.district || '';
      const modalPrice = parseFloat(record.modal_price || 0);

      if (modalPrice <= 0 || !commodityRaw || !marketRaw) { skipped++; continue; }

      const dbCropName = mapCommodityName(commodityRaw);
      if (!dbCropName) { skipped++; continue; }

      const recordedDate = parseArrivalDate(record.arrival_date);
      const mandiName = `${marketRaw} Mandi`;

      let mandiId;
      const existingMandi = await pool.query(
        'SELECT id FROM mandis WHERE LOWER(name) = LOWER($1) AND LOWER(state) = LOWER($2)',
        [mandiName, stateRaw]
      );

      if (existingMandi.rows.length > 0) {
        mandiId = existingMandi.rows[0].id;
      } else {
        const newMandi = await pool.query(
          `INSERT INTO mandis (name, state, district)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id`,
          [mandiName, stateRaw, districtRaw]
        );
        if (newMandi.rows.length > 0) {
          mandiId = newMandi.rows[0].id;
        } else {
          const retry = await pool.query(
            'SELECT id FROM mandis WHERE LOWER(name) = LOWER($1) AND LOWER(state) = LOWER($2)',
            [mandiName, stateRaw]
          );
          if (!retry.rows.length) { skipped++; continue; }
          mandiId = retry.rows[0].id;
        }
      }

      const cropResult = await pool.query(
        'SELECT id FROM crops WHERE name_en = $1', [dbCropName]
      );
      if (!cropResult.rows.length) { skipped++; continue; }

      await pool.query(
        `INSERT INTO prices (mandi_id, crop_id, price, recorded_date)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (mandi_id, crop_id, recorded_date)
         DO UPDATE SET price = EXCLUDED.price`,
        [mandiId, cropResult.rows[0].id, modalPrice, recordedDate]
      );
      synced++;
    } catch { skipped++; }
  }

  if (synced > 0) console.log(`[AGMARKNET] ${stateName}: Synced=${synced}, Skipped=${skipped}`);
  return synced;
}

// ✅ States ko parallel fetch karo — 3 at a time
async function runDailySync() {
  console.log('[AGMARKNET] === Sync Start ===');

  const states = [
    'Andhra Pradesh', 'Uttar Pradesh', 'Punjab', 'Haryana',
    'Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Gujarat',
    'Bihar', 'West Bengal', 'Karnataka', 'Tamil Nadu',
    'Telangana', 'Odisha', 'Chhattisgarh', 'Uttarakhand',
    'Himachal Pradesh', 'Assam', 'Jharkhand', 'Kerala'
  ];

  let totalSynced = 0;

  // 3 states at a time — faster but not overwhelming API
  for (let i = 0; i < states.length; i += 3) {
    const batch = states.slice(i, i + 3);
    const results = await Promise.all(
      batch.map(async (state) => {
        try {
          const records = await fetchFromAgmarknet(state, 1000);
          if (records.length > 0) return await syncPricesToDB(records, state);
          return 0;
        } catch (err) {
          console.error(`[AGMARKNET] ${state} failed: ${err.message}`);
          return 0;
        }
      })
    );
    totalSynced += results.reduce((a, b) => a + b, 0);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[AGMARKNET] === Complete: ${totalSynced} prices ===`);
  return totalSynced;
}

module.exports = { runDailySync, fetchFromAgmarknet };