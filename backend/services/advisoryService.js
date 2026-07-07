function generateAdvisory(cropName, basePrice, forecast) {
  const lastPrice = forecast[forecast.length - 1].value;
  const percentChange = parseFloat(((lastPrice - basePrice) / basePrice * 100).toFixed(2));

  const midIdx = Math.floor(forecast.length / 2);
  const midPrice = forecast[midIdx].value;

  let signal, advice, action;

  if (percentChange > 5) {
    signal = 'HOLD';
    action = 'Abhi mat becho';
    advice = `${cropName} ka price agle dinon mein +${percentChange}% badhne ka trend hai. ₹${Math.round(basePrice * percentChange / 100).toLocaleString('en-IN')} zyada milenge — wait karo.`;
  } else if (percentChange > 2) {
    signal = 'HOLD';
    action = 'Thoda wait karo';
    advice = `${cropName} ka price thoda badhne wala hai (+${percentChange}%). 2-3 din wait karna behtar hoga.`;
  } else if (percentChange < -5) {
    signal = 'SELL';
    action = 'Jaldi becho';
    advice = `${cropName} ka price girne wala hai (${percentChange}%). Jitna jaldi ho sake becho — ruko mat.`;
  } else if (percentChange < -2) {
    signal = 'SELL';
    action = 'Bechne ka sahi waqt';
    advice = `${cropName} ka price thoda girne wala hai (${percentChange}%). Abhi bechna behtar hoga.`;
  } else {
    signal = 'STABLE';
    action = 'Apni zaroorat dekho';
    advice = `${cropName} ka price stable rahega (${percentChange > 0 ? '+' : ''}${percentChange}%). Apni storage aur market demand ke hisaab se decide karo.`;
  }

  return { signal, action, advice, percentChange };
}

module.exports = { generateAdvisory };