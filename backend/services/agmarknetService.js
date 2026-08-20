const pool = require('../config/db');
require('dotenv').config();

// Direct Agmarknet API — fresher data
const AGMARKNET_BASE = 'https://agmarknet.gov.in';
// data.gov.in fallback
const DATAGOV_KEY = process.env.AGMARKNET_API_KEY;
const DATAGOV_RESOURCE = '9ef84268-d588-465a-a308-a864a43d0070';

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
  'sugarcane': 'Sugarcane', 'banana': 'Banana', 'banana - green': 'Banana',
  'mango (raw)': 'Mango', 'mango': 'Mango',
  'papaya (raw)': 'Papaya', 'papaya': 'Papaya',
  'guava': 'Guava', 'pomegranate': 'Pomegranate', 'lemon': 'Lemon',
  'orange': 'Orange', 'grapes': 'Grapes', 'watermelon': 'Watermelon',
  'turmeric': 'Turmeric', 'black pepper': 'Black Pepper',
  'cumin(jeera)': 'Cumin', 'cumin': 'Cumin', 'jeera': 'Cumin',
  'coriander(seed)': 'Coriander Seeds', 'dhania': 'Coriander Seeds',
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
  } catch { }
  return new Date().toISOString().split('T')[0];
}

function formatDateForAgmarknet(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Method 1: data.gov.in API (existing, 3-7 day lag)
async function fetchFromDataGov(state, limit = 1000) {
  if (!DATAGOV_KEY) return [];
  try {
    const url = `https://api.data.gov.in/resource/${DATAGOV_RESOURCE}?api-key=${DATAGOV_KEY}&format=json&limit=${limit}&filters[State]=${encodeURIComponent(state)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const data = await res.json();
    const records = data.records || [];
    if (records.length > 0) {
      const dates = [...new Set(records.map(r => r.arrival_date))].slice(0, 2);
      console.log(`[DATAGOV] ${state}: ${records.length} records | ${dates.join(', ')}`);
    }
    return records;
  } catch (err) {
    console.error(`[DATAGOV] ${state}: ${err.message}`);
    return [];
  }
}

// Method 2: Agmarknet direct search API (fresher data)
async function fetchFromAgmarknetDirect(fromDate, toDate) {
  try {
    const url = `https://agmarknet.gov.in/AgriDicQly/HmPageSearch.aspx?Tx_Commodity=0&Tx_State=0&Tx_District=0&Tx_Market=0&DateFrom=${fromDate}&DateTo=${toDate}&Fr_Date=${fromDate}&To_Date=${toDate}&Tx_Trend=0&Tx_CommodityHead=ALL&Tx_StateHead=--Select--&Tx_DistrictHead=--Select--&Tx_MarketHead=--Select--`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Referer': 'https://agmarknet.gov.in/'
      }
    });
    if (!res.ok) {
      console.log(`[AGMARKNET-DIRECT] HTTP ${res.status}`);
      return [];
    }
    const html = await res.text();
    return parseAgmarknetHTML(html, fromDate);
  } catch (err) {
    console.error(`[AGMARKNET-DIRECT] Error: ${err.message}`);
    return [];
  }
}

function parseAgmarknetHTML(html, arrivalDate) {
  const records = [];
  try {
    // Table rows extract karo
    const rowRegex = /<tr[^>]*>\s*(<td[^>]*>.*?<\/td>\s*)+<\/tr>/gi;
    const tdRegex = /<td[^>]*>(.*?)<\/td>/gi;
    const rows = html.match(rowRegex) || [];

    for (const row of rows) {
      const cells = [];
      let m;
      const tdRe = /<td[^>]*>(.*?)<\/td>/gi;
      while ((m = tdRe.exec(row)) !== null) {
        const text = m[1].replace(/<[^>]+>/g, '').trim();
        cells.push(text);
      }

      // Agmarknet table: State, District, Market, Commodity, Variety, Grade, Min, Max, Modal, Date
      if (cells.length >= 9) {
        const modalPrice = parseFloat(cells[8]?.replace(/,/g, '') || '0');
        if (modalPrice > 0 && cells[3] && cells[2]) {
          records.push({
            state: cells[0] || '',
            district: cells[1] || '',
            market: cells[2] || '',
            commodity: cells[3] || '',
            variety: cells[4] || '',
            min_price: cells[6] || '0',
            max_price: cells[7] || '0',
            modal_price: modalPrice.toString(),
            arrival_date: cells[9] || arrivalDate
          });
        }
      }
    }
  } catch (err) {
    console.error('[PARSE] HTML parse error:', err.message);
  }
  return records;
}

async function syncPricesToDB(records, sourceName = '') {
  let synced = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      const commodityRaw = record.commodity || '';
      const marketRaw = record.market || '';
      const stateRaw = record.state || '';
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

  if (synced > 0) console.log(`[SYNC${sourceName}] Synced=${synced}, Skipped=${skipped}`);
  return synced;
}

async function runDailySync() {
  console.log('[SYNC] === Daily Sync Start ===');
  let totalSynced = 0;

  // Method 1: Direct Agmarknet (last 7 days)
  try {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const toDate = formatDateForAgmarknet(today);
    const fromDate = formatDateForAgmarknet(weekAgo);

    console.log(`[SYNC] Trying direct Agmarknet: ${fromDate} to ${toDate}`);
    const directRecords = await fetchFromAgmarknetDirect(fromDate, toDate);

    if (directRecords.length > 0) {
      console.log(`[SYNC] Direct Agmarknet: ${directRecords.length} records found!`);
      const synced = await syncPricesToDB(directRecords, '-DIRECT');
      totalSynced += synced;
    } else {
      console.log('[SYNC] Direct Agmarknet: 0 records — trying data.gov.in fallback');
    }
  } catch (err) {
    console.error('[SYNC] Direct fetch error:', err.message);
  }

  // Method 2: data.gov.in fallback (3 parallel batches)
  const states = [
    'Andhra Pradesh', 'Uttar Pradesh', 'Punjab', 'Haryana',
    'Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Gujarat',
    'Bihar', 'West Bengal', 'Karnataka', 'Tamil Nadu',
    'Telangana', 'Odisha', 'Chhattisgarh', 'Uttarakhand',
    'Himachal Pradesh', 'Assam', 'Jharkhand', 'Kerala'
  ];

  for (let i = 0; i < states.length; i += 4) {
    const batch = states.slice(i, i + 4);
    const results = await Promise.all(
      batch.map(async (state) => {
        try {
          const records = await fetchFromDataGov(state, 1000);
          if (records.length > 0) return await syncPricesToDB(records, `-${state.split(' ')[0]}`);
          return 0;
        } catch { return 0; }
      })
    );
    totalSynced += results.reduce((a, b) => a + b, 0);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`[SYNC] === Complete: ${totalSynced} total prices ===`);
  return totalSynced;
}

module.exports = { runDailySync, fetchFromAgmarknet: fetchFromDataGov };