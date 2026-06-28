async function getMandiPrices(crop) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/price/mandi?crop=${crop}`);
    if (!res.ok) throw new Error('Mandi prices fetch fail hua');
    return await res.json();
  } catch (err) {
    console.warn('priceApi.getMandiPrices:', err.message);
    return null;
  }
}

async function getPriceForecast(crop, days = 7) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/price/forecast?crop=${crop}&days=${days}`);
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