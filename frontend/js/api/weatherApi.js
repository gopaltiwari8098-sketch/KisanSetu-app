async function getWeatherByLocation(lat, lon) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/weather/current?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('Weather fetch fail hua');
    return await res.json();
  } catch (err) {
    console.warn('weatherApi.getWeatherByLocation:', err.message);
    return null;
  }
}

async function getWeatherByCity(city) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/weather/current?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('Weather fetch fail hua');
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

    if (loc.lat && loc.lon) {
      return await getWeatherByLocation(loc.lat, loc.lon);
    } else if (loc.city) {
      return await getWeatherByCity(loc.city);
    }
    return null;
  } catch (err) {
    console.warn('weatherApi.getWeatherByIP:', err.message);
    return null;
  }
}

// Smart weather — GPS → IP → Delhi fallback
async function getSmartWeather() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      const timeout = setTimeout(async () => {
        const w = await getWeatherByIP() || await getWeatherByCity('Delhi');
        resolve(w);
      }, 5000); // 5 sec GPS timeout

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          clearTimeout(timeout);
          const w = await getWeatherByLocation(pos.coords.latitude, pos.coords.longitude);
          resolve(w);
        },
        async () => {
          clearTimeout(timeout);
          const w = await getWeatherByIP() || await getWeatherByCity('Delhi');
          resolve(w);
        },
        { timeout: 4000 }
      );
    } else {
      getWeatherByIP().then(w => resolve(w || getWeatherByCity('Delhi')));
    }
  });
}