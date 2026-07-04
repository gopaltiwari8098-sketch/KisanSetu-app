async function getCropsList() {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/price/crops`);
    if (!res.ok) throw new Error('Crops list fetch fail hua');
    return await res.json();
  } catch (err) {
    console.warn('priceApi.getCropsList:', err.message);
    return null;
  }
}

async function getMandiPrices(crop, state = 'all') {
  try {
    let url = `${CONFIG.API_BASE_URL}/price/mandi?crop=${encodeURIComponent(crop)}`;
    if (state && state !== 'all') url += `&state=${encodeURIComponent(state)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Mandi prices fetch fail hua');
    return await res.json();
  } catch (err) {
    console.warn('priceApi.getMandiPrices:', err.message);
    return null;
  }
}

async function getPriceForecast(crop, days = 7) {
  try {
    const res = await fetch(
      `${CONFIG.API_BASE_URL}/price/forecast?crop=${encodeURIComponent(crop)}&days=${days}`
    );
    if (!res.ok) throw new Error('Forecast fetch fail hua');
    return await res.json();
  } catch (err) {
    console.warn('priceApi.getPriceForecast:', err.message);
    return null;
  }
}

async function getDashboardSummary() {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/price/dashboard-summary`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error('Dashboard summary fetch fail hua');
    return await res.json();
  } catch (err) {
    console.warn('priceApi.getDashboardSummary:', err.message);
    return null;
  }
}