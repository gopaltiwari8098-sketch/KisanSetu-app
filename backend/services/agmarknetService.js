const pool = require('../config/db');
require('dotenv').config();

const API_KEY = process.env.AGMARKNET_API_KEY;

// Multiple resource IDs try karenge — Agmarknet ke alag alag datasets
const RESOURCE_IDS = [
  '9ef84268-d588-465a-a308-a864a43d0070', // Variety-wise daily prices
  '35985678-0d79-46b4-9ed6-6f13308a1d24', // Mandi prices alternate
];

const COMMODITY_MAP = {
  'wheat': 'Wheat', 'wheat(other)': 'Wheat', 'wheat(dara)': 'Wheat',
  'rice': 'Rice', 'paddy(dpr)': 'Rice', 'paddy': 'Rice',
  'rice (common)': 'Rice', 'rice(common)': 'Rice',
  'maize': 'Maize', 'bajra': 'Bajra', 'bajra(whole)': 'Bajra',
  'jowar(white)': 'Jowar', 'jowar': 'Jowar',
  'barley': 'Barley',
  'onion': 'Onion', 'onion(local)': 'Onion', 'onion(big)': 'Onion',
  'potato': 'Potato', 'potato(deshi)': 'Potato',
  'tomato': 'Tomato', 'tomato(deshi)': 'Tomato', 'tomato(hybrid)': 'Tomato',
  'brinjal': 'Brinjal',
  'cauliflower': 'Cauliflower',
  'cabbage': 'Cabbage',
  'bhindi(ladies finger)': 'Lady Finger', 'lady finger': 'Lady Finger',
  'okra': 'Lady Finger', 'bhindi': 'Lady Finger',
  'green chilli': 'Green Chilli', 'chilly green': 'Green Chilli',
  'chilli': 'Green Chilli',
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
  'gram': 'Gram', 'chana': 'Gram', 'bengal gram(whole)': 'Gram',
  'arhar (tur/red gram)(whole)': 'Arhar Dal',
  'arhar': 'Arhar Dal', 'tur': 'Arhar Dal', 'red gram': 'Arhar Dal',
  'moong (whole)': 'Moong Dal', 'moong': 'Moong Dal',
  'green gram': 'Moong Dal', 'moong(whole)': 'Moong Dal',
  'urad (whole)': 'Urad Dal', 'urad': 'Urad Dal',
  'black gram': 'Urad Dal', 'urad(whole)': 'Urad Dal',
  'masur (whole)': 'Masoor Dal', 'masoor': 'Masoor Dal',
  'lentil': 'Masoor Dal', 'masur': 'Masoor Dal',
  'cotton': 'Cotton', 'cotton(unginned)': 'Cotton', 'kapas': 'Cotton',
  'sugarcane': 'Sugarcane',
  'banana': 'Banana', 'banana - green': 'Banana', 'banana(raw)': 'Banana',
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

async function fetchFromAgmarknet(resourceId, state, limit = 1000) {
  if (!API_KEY) {
    console.error('AGMARKNET_API_KEY not set in environment');
    return [];
  }
  try {
    let url = `https://api.data.gov.in/resource/${resourceId}?api-key=${API_KEY}&format=json&limit=${limit}`;
    if (state) url += `&filters[State]=${encodeURIComponent(state)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.error(`Agmarknet API error: ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.records || [];
  } catch (err) {
    console.error(`Agmarknet fetch error (${resourceId}):`, err.message);
    return [];
  }
}

async function syncPricesToDB(records) {
  let synced = 0;
  let skipped = 0;
  for (const record of records) {
    try {
      // Try different field name combinations
      const commodityRaw = record.commodity || record.Commodity || record.COMMODITY || '';
      const marketRaw = record.market || record.Market || record.MARKET || '';
      const stateRaw = record.state || record.State || record.STATE || '';
      const districtRaw = record.district || record.District || record.DISTRICT || '';
      const priceRaw = record.modal_price || record.Modal_Price ||
        record.MODAL_PRICE || record.modalPrice || record.price || '0';

      const dbCropName = mapCommodityName(commodityRaw);
      if (!dbCropName) { skipped++; continue; }

      const modalPrice = parseFloat(priceRaw);
      if (!modalPrice || isNaN(modalPrice) || modalPrice <= 0) continue;

      const mandiName = `${marketRaw} Mandi`;

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
      console.error('Record sync error:', err.message);
    }
  }
  console.log(`Synced: ${synced}, Skipped: ${skipped}`);
  return synced;
}

async function runDailySync() {
  console.log('Agmarknet daily sync start...');
  const states = [
    'Uttar Pradesh', 'Punjab', 'Haryana', 'Rajasthan',
    'Madhya Pradesh', 'Maharashtra', 'Gujarat', 'Bihar',
    'West Bengal', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh'
  ];

  let totalSynced = 0;

  // Try each resource ID
  for (const resourceId of RESOURCE_IDS) {
    console.log(`Trying resource: ${resourceId}`);
    for (const state of states) {
      const records = await fetchFromAgmarknet(resourceId, state, 1000);
      if (records.length > 0) {
        console.log(`${state}: ${records.length} records found with resource ${resourceId}`);
        const synced = await syncPricesToDB(records);
        totalSynced += synced;
        await new Promise(r => setTimeout(r, 500));
      }
    }
    if (totalSynced > 0) {
      console.log(`Success with resource ${resourceId}: ${totalSynced} total synced`);
      break;
    }
  }

  if (totalSynced === 0) {
    console.log('Agmarknet sync failed — using seed refresh');
  }

  return totalSynced;
}

module.exports = { runDailySync, fetchFromAgmarknet, RESOURCE_IDS };