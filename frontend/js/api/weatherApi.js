async function getWeatherByLocation(lat, lon) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/weather/current?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('Weather fetch fail hua');
    return await res.json();
  } catch (err) {
    console.warn('weatherApi:', err.message);
    return null;
  }
}

async function getWeatherByCity(city) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/weather/current?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('Weather fetch fail hua');
    return await res.json();
  } catch (err) {
    console.warn('weatherApi:', err.message);
    return null;
  }
}