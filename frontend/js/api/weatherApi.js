const WEATHER_GPS_KEY = 'kisansetu_gps_weather';
const WEATHER_GPS_TIME_KEY = 'kisansetu_gps_time';
const GPS_CACHE_MINUTES = 30; // 30 minute tak GPS result cache rahega

async function getWeatherByLocation(lat, lon) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/weather/current?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('Weather fetch fail');
    const data = await res.json();
    // GPS result cache karo sessionStorage mein
    sessionStorage.setItem(WEATHER_GPS_KEY, JSON.stringify(data));
    sessionStorage.setItem(WEATHER_GPS_TIME_KEY, Date.now().toString());
    return data;
  } catch (err) {
    console.warn('weatherApi.getWeatherByLocation:', err.message);
    return null;
  }
}

async function getWeatherByCity(city) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/weather/current?city=${encodeURIComponent(city)}`);
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
    if (loc.lat && loc.lon) {
      // IP result ko GPS cache se alag track karo — sessionStorage mein save MAT karo
      const res = await fetch(`${CONFIG.API_BASE_URL}/weather/current?lat=${loc.lat}&lon=${loc.lon}`);
      if (!res.ok) return null;
      return await res.json();
    }
    if (loc.city) return await getWeatherByCity(loc.city);
    return null;
  } catch (err) {
    console.warn('weatherApi.getWeatherByIP:', err.message);
    return null;
  }
}

async function getSmartWeather() {
  // Pehle check karo: GPS result cache mein hai aur fresh hai?
  const cachedWeather = sessionStorage.getItem(WEATHER_GPS_KEY);
  const cachedTime = sessionStorage.getItem(WEATHER_GPS_TIME_KEY);

  if (cachedWeather && cachedTime) {
    const minutesAgo = (Date.now() - parseInt(cachedTime)) / 60000;
    if (minutesAgo < GPS_CACHE_MINUTES) {
      // Fresh GPS result hai — iska use karo
      return JSON.parse(cachedWeather);
    }
  }

  // GPS try karo
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 6000,
          enableHighAccuracy: false
        });
      });
      const w = await getWeatherByLocation(pos.coords.latitude, pos.coords.longitude);
      if (w) return w; // GPS success — cache bhi ho gaya
    } catch {
      // GPS failed ya denied — aage badho
    }
  }

  // GPS nahi mila — IP se try karo
  const wByIP = await getWeatherByIP();
  if (wByIP) return wByIP;

  // Final fallback — Delhi (Meerut nahi)
  return await getWeatherByCity('Delhi');
}