const pool = require('../config/db');
require('dotenv').config();

const AGMARKNET_API_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const API_KEY = process.env.AGMARKNET_API_KEY;

async function fetchFromAgmarknet(state, commodity, limit = 500) {
  try {
    let url = `${AGMARKNET_API_URL}?api-key=${API_KEY}&format=json&limit=${limit}`;
    if (state) url += `&filters[State]=${encodeURIComponent(state)}`;
    if (commodity) url += `&filters[Commodity]=${encodeURIComponent(commodity)}`;

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
  for (const record of records) {
    try {
      const mandiName = `${record.market} Mandi`;
      const stateName = record.state;
      const cropNameEn = record.commodity;
      const modalPrice = parseFloat(record.modal_price);
      const district = record.district;

      if (!modalPrice || isNaN(modalPrice)) continue;

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
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [mandiName, stateName, district]
        );
        if (!newMandi.rows.length) continue;
        mandiId = newMandi.rows[0].id;
      } else {
        mandiId = mandiResult.rows[0].id;
      }

      // Crop dhundo
      const cropResult = await pool.query(
        'SELECT id FROM crops WHERE LOWER(name_en) = LOWER($1)',
        [cropNameEn]
      );
      if (!cropResult.rows.length) continue;
      const cropId = cropResult.rows[0].id;

      // Price upsert karo
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
  return synced;
}

async function runDailySync() {
  console.log('Agmarknet daily sync shuru ho rahi hai...');
  const states = [
    'Uttar Pradesh', 'Punjab', 'Haryana', 'Rajasthan',
    'Madhya Pradesh', 'Maharashtra', 'Gujarat', 'Bihar',
    'West Bengal', 'Karnataka'
  ];

  let totalSynced = 0;
  for (const state of states) {
    const records = await fetchFromAgmarknet(state, null, 500);
    const synced = await syncPricesToDB(records);
    totalSynced += synced;
    console.log(`${state}: ${synced} prices sync hui`);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`Daily sync complete. Total: ${totalSynced} records`);
  return totalSynced;
}

module.exports = { runDailySync, fetchFromAgmarknet };