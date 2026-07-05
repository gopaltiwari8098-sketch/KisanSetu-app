function getSeasonalMultiplier(cropName, monthIndex) {
  const rabi = ['Wheat', 'Barley', 'Gram', 'Mustard', 'Masoor Dal', 'Peas'];
  const kharif = ['Rice', 'Maize', 'Bajra', 'Jowar', 'Soybean', 'Cotton', 'Sugarcane'];

  let multipliers;
  if (rabi.includes(cropName)) {
    multipliers = [1.05, 1.08, 0.95, 0.92, 0.97, 1.02, 1.08, 1.10, 1.06, 1.01, 0.98, 1.03];
  } else if (kharif.includes(cropName)) {
    multipliers = [1.02, 1.06, 1.10, 1.12, 1.08, 1.03, 0.97, 0.95, 0.98, 0.93, 0.91, 0.97];
  } else {
    multipliers = [1.01, 1.01, 1.02, 1.02, 1.01, 1.00, 0.99, 0.99, 1.00, 1.01, 1.01, 1.01];
  }
  return multipliers[monthIndex];
}

function exponentialWeightedForecast(basePrice, days, cropName) {
  const alpha = 0.35;
  const today = new Date();
  const dayNamesHi = ['Ravi', 'Som', 'Mangl', 'Budh', 'Brihsp', 'Shukr', 'Shani'];
  const forecast = [];
  let ewPrice = basePrice;

  for (let i = 0; i < days; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const futureMonth = futureDate.getMonth();
    const dayName = dayNamesHi[futureDate.getDay()];
    const dateStr = `${futureDate.getDate()}/${futureDate.getMonth() + 1}`;

    const seasonalFactor = getSeasonalMultiplier(cropName, futureMonth);
    const noise = 1 + (Math.random() * 0.03 - 0.015);
    const predicted = basePrice * seasonalFactor * noise;
    ewPrice = alpha * predicted + (1 - alpha) * ewPrice;

    forecast.push({
      label: i === 0 ? 'Aaj' : `${dayName} ${dateStr}`,
      value: Math.round(ewPrice)
    });
  }
  return forecast;
}

function getAdvisory(basePrice, forecast, cropName) {
  const lastPrice = forecast[forecast.length - 1].value;
  const percentChange = parseFloat(((lastPrice - basePrice) / basePrice * 100).toFixed(2));

  let signal, signalColor, advice;

  if (percentChange > 4) {
    signal = 'HOLD / BAAD MEIN BECHO';
    signalColor = 'up';
    advice = `${cropName} ka price +${percentChange}% badhne ka trend hai. Thoda intezaar karo.`;
  } else if (percentChange < -4) {
    signal = 'ABHI BECHO';
    signalColor = 'down';
    advice = `${cropName} ka price ${Math.abs(percentChange)}% girne wala hai. Jaldi becho.`;
  } else {
    signal = 'STABLE — APNI ZAROORAT DEKHO';
    signalColor = 'neutral';
    advice = `${cropName} ka price stable rahega (${percentChange > 0 ? '+' : ''}${percentChange}%).`;
  }

  return { signal, signalColor, advice, percentChange };
}

module.exports = { exponentialWeightedForecast, getAdvisory };