async function getWeatherByLocation(lat, lon) {
  try {
    const res = await fetch(
      `${CONFIG.API_BASE_URL}/weather/current?lat=${lat}&lon=${lon}`
    );
    if (!res.ok) throw new Error('Weather fetch fail');
    return await res.json();
  } catch (err) {
    console.warn('weatherApi.getWeatherByLocation:', err.message);
    return null;
  }
}

async function getWeatherByCity(city) {
  try {
    const res = await fetch(
      `${CONFIG.API_BASE_URL}/weather/current?city=${encodeURIComponent(city)}`
    );
    if (!res.ok) throw new Error('Weather fetch fail');
    return await res.json();
  } catch (err) {
    console.warn('weatherApi.getWeatherByCity:', err.message);
    return null;
  }
}

async function getWeatherByIP() {
  try {
    const locRes = await fetch(`${CONFIG.API_BASE_URL}/weather/detect-location`);
    if (!locRes.ok) return null;
    const loc = await locRes.json();
    if (loc.lat && loc.lon) return await getWeatherByLocation(loc.lat, loc.lon);
    if (loc.city) return await getWeatherByCity(loc.city);
    return null;
  } catch (err) {
    console.warn('weatherApi.getWeatherByIP:', err.message);
    return null;
  }
}

async function getSmartWeather() {
  // Try GPS first
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      const w = await getWeatherByLocation(pos.coords.latitude, pos.coords.longitude);
      if (w) return w;
    } catch {
      // GPS failed — try IP
    }
  }

  // Try IP-based location
  const wByIP = await getWeatherByIP();
  if (wByIP) return wByIP;

  // Final fallback — Delhi
  return await getWeatherByCity('Delhi');
}