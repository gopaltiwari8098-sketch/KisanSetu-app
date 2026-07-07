const express = require('express');
const router = express.Router();

router.get('/current', async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ message: 'Weather API key configure nahi hai' });
    }

    let url;
    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=hi`;
    } else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&appid=${apiKey}&units=metric&lang=hi`;
    } else {
      return res.status(400).json({ message: 'lat/lon ya city zaroori hai' });
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    const data = await response.json();

    res.json({
      city: data.name,
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind?.speed,
      farmingTip: getFarmingTip(data.weather[0].main, data.main.temp, data.main.humidity)
    });
  } catch (err) {
    res.status(500).json({ message: 'Weather fetch mein error: ' + err.message });
  }
});

// IP se city detect karne ka endpoint
router.get('/detect-location', async (req, res) => {
  try {
    // User ka IP se location detect karo
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || '';

    // Local/private IP check
    const isLocalIP = ip.startsWith('192.168') || ip.startsWith('10.') ||
      ip.startsWith('127.') || ip === '::1' || ip === '';

    if (isLocalIP) {
      return res.json({ city: null, message: 'Local IP, GPS use karo' });
    }

    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,lat,lon,status`);
    const geoData = await geoRes.json();

    if (geoData.status === 'success') {
      res.json({ city: geoData.city, region: geoData.regionName, lat: geoData.lat, lon: geoData.lon });
    } else {
      res.json({ city: null, message: 'Location detect nahi hua' });
    }
  } catch (err) {
    res.json({ city: null, message: err.message });
  }
});

function getFarmingTip(condition, temp, humidity) {
  if (condition === 'Rain') return '🌧️ Aaj barish — drainage check karo, khetoon mein kaam band rakho';
  if (condition === 'Thunderstorm') return '⚠️ Toofan — khetoon se door raho, fasal dhakne ki koshish karo';
  if (temp > 42) return '🔥 Bahut tej garmi — dopahar mein kaam mat karo, subah ya shaam ko karo';
  if (temp > 38) return '🌡️ Garmi zyada — subah ya shaam ko hi khet mein kaam karo, paani zyada do';
  if (temp < 5) return '❄️ Bahut thand — paal girne ka khatra, fasal ko cover karo';
  if (temp < 12) return '🥶 Thand — sensitive fasalein cover karo, irrigation avoid karo raat ko';
  if (humidity > 88) return '💧 Humidity bahut zyada — fungal disease ka khatra, spray schedule check karo';
  if (humidity > 75) return '🌫️ Humidity thodi zyada — fasal mein hawa aane do, pani kam do';
  if (condition === 'Clear' && temp >= 18 && temp <= 35) return '✅ Khet ke kaam ke liye acha din hai — normal karo';
  return '🌤️ Mausam theek hai — normal kaam kar sakte ho';
}

module.exports = router;