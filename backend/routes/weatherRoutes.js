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
    if (!response.ok) throw new Error('Weather fetch fail hua');
    const data = await response.json();

    res.json({
      city: data.name,
      state: data.sys?.country,
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

function getFarmingTip(condition, temp, humidity) {
  if (condition === 'Rain') return 'Aaj barish hai — khetoon mein kaam band rakho, drainage check karo';
  if (condition === 'Thunderstorm') return '⚠️ Toofan — khetoon se door raho, fasal dhakne ki koshish karo';
  if (temp > 40) return '🌡️ Bahut garmi — subah ya shaam ko hi paani do, dopahar mein kaam mat karo';
  if (temp < 10) return '❄️ Thand — paal girne ka khatra, fasal ko cover karo';
  if (humidity > 85) return '💧 Humidity zyada — fungal disease ka khatra, spray schedule check karo';
  if (condition === 'Clear' && temp >= 20 && temp <= 35) return '✅ Khet ke kaam ke liye acha din hai';
  return '🌤️ Mausam theek hai — normal kaam kar sakte ho';
}

module.exports = router;