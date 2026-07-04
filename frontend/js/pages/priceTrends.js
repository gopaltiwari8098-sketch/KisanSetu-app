document.addEventListener('DOMContentLoaded', async () => {
  const cropFilter = document.getElementById('trendCropFilter');
  const daysFilter = document.getElementById('trendDaysFilter');
  const chartBars = document.getElementById('chartBars');
  const forecastTitle = document.getElementById('forecastTitle');
  const forecastHint = document.getElementById('forecastHint');
  const insightPanel = document.getElementById('insightPanel');
  const insightText = document.getElementById('insightText');
  const insightBadge = document.getElementById('insightBadge');
  const insightSuggestion = document.getElementById('insightSuggestion');
  const chartMin = document.getElementById('chartMin');
  const chartMax = document.getElementById('chartMax');

  // Saari crops load karo
  const crops = await getCropsList();
  if (crops && crops.length) {
    cropFilter.innerHTML = `<option value="">Fasal chunein...</option>` +
      crops.map(c => `<option value="${c.name_en}">${c.name_en} / ${c.name_hi}</option>`).join('');
  }

  function getDayLabels(days) {
    const labels = [];
    const dayNames = ['Ravi', 'Som', 'Mangl', 'Budh', 'Brihsp', 'Shukr', 'Shani'];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = dayNames[d.getDay()];
      const date = d.getDate();
      const month = d.getMonth() + 1;
      labels.push(i === 0 ? 'Aaj' : `${dayName} ${date}/${month}`);
    }
    return labels;
  }

  async function loadForecast() {
    const crop = cropFilter.value;
    const days = parseInt(daysFilter.value);

    if (!crop) return;

    chartBars.innerHTML = `<div style="margin:auto;"><div class="skeleton" style="width:300px;height:150px;border-radius:8px;"></div></div>`;

    const data = await getPriceForecast(crop, days);

    if (!data || !data.forecast) {
      chartBars.innerHTML = `<p style="color:var(--color-text-muted);margin:auto;">Data nahi mila</p>`;
      return;
    }

    const selectedCrop = crops.find(c => c.name_en === crop);
    const cropHi = selectedCrop ? selectedCrop.name_hi : crop;

    forecastTitle.textContent = `${crop} / ${cropHi} — ${days} din ka forecast`;

    const values = data.forecast.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    const labels = getDayLabels(days);

    chartMin.textContent = `Min: ₹${minVal.toLocaleString('en-IN')}`;
    chartMax.textContent = `Max: ₹${maxVal.toLocaleString('en-IN')}`;

    forecastHint.textContent = `Base price: ₹${data.basePrice.toLocaleString('en-IN')}/q | Forecast Prophet ML model se generate hota hai | Confidence: ~78%`;

    // Variable heights — price ke hisaab se
    chartBars.innerHTML = data.forecast.map((d, i) => {
      const heightPct = Math.round(20 + ((d.value - minVal) / range) * 75);
      return `
        <div class="chart-bar">
          <span class="chart-bar__value">₹${d.value.toLocaleString('en-IN')}</span>
          <div class="chart-bar__fill" style="height:${heightPct}%;"></div>
          <span class="chart-bar__label">${labels[i]}</span>
        </div>`;
    }).join('');

    // Insight panel
    insightPanel.style.display = '';
    const isUp = data.percentChange > 0;
    insightText.innerHTML = `Agle ${days} dinon mein <strong>${crop} / ${cropHi}</strong> ka price trend`;
    insightBadge.textContent = `${isUp ? '+' : ''}${data.percentChange}%`;
    insightBadge.className = `forecast-badge ${isUp ? 'forecast-badge--up' : 'forecast-badge--down'}`;
    insightSuggestion.textContent = data.suggestion;
  }

  cropFilter.addEventListener('change', loadForecast);
  daysFilter.addEventListener('change', loadForecast);
});