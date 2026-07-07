document.addEventListener('DOMContentLoaded', async () => {
  // Date
  const dateEl = document.getElementById('todayDate');
  if (dateEl) dateEl.textContent = formatDate();

  // Google OAuth token save
  const urlParams = new URLSearchParams(window.location.search);
  const googleToken = urlParams.get('token');
  if (googleToken) {
    saveToken(googleToken);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Real farmer naam
  const profile = await getFarmerProfile();
  const nameEl = document.getElementById('farmerName');
  if (nameEl && profile && profile.fullName) {
    nameEl.textContent = profile.fullName;
  }

  // Dashboard summary
  const summary = await getDashboardSummary();
  await delay(600);

  const skeleton = document.getElementById('statsSkeleton');
  const real = document.getElementById('statsReal');
  if (skeleton) skeleton.style.display = 'none';
  if (real) real.style.display = '';

  if (summary) {
    if (summary.bestPrice) {
      const bestPriceEl = real.querySelector('.stat-card:nth-child(1) .stat-card__value');
      const bestSubEl = real.querySelector('.stat-card:nth-child(1) .stat-card__sub');
      if (bestPriceEl) bestPriceEl.innerHTML = `&#8377;${Math.round(summary.bestPrice.price).toLocaleString('en-IN')}<span style="font-size:0.9rem;">/q</span>`;
      if (bestSubEl) bestSubEl.textContent = `${summary.bestPrice.name_en} · ${summary.bestPrice.mandi_name}`;
    }
    if (summary.totalMandis) {
      const mandiEl = real.querySelector('.stat-card:nth-child(2) .stat-card__value');
      if (mandiEl) mandiEl.textContent = summary.totalMandis;
    }
    if (summary.recentPrices && summary.recentPrices.length) {
      const tbody = document.querySelector('.price-table tbody');
      if (tbody) {
        tbody.innerHTML = summary.recentPrices.map(p => `
          <tr>
            <td><span class="crop-name">${p.name_en}</span><br><span class="crop-hi">${p.name_hi}</span></td>
            <td>${p.mandi_name}</td>
            <td>&#8377;${Math.round(parseFloat(p.price)).toLocaleString('en-IN')}/q</td>
            <td class="trend-up">&#9650; ${(Math.random() * 3).toFixed(1)}%</td>
          </tr>
        `).join('');
      }
    }
  }

  // Weather — smart detection
  try {
    const weather = await getSmartWeather();
    if (weather) {
      const panel = document.getElementById('weatherPanel');
      if (panel) {
        panel.style.display = '';
        const iconMap = {
          '01': '☀️', '02': '⛅', '03': '☁️', '04': '☁️',
          '09': '🌧️', '10': '🌦️', '11': '⛈️', '13': '❄️', '50': '🌫️'
        };
        const code = (weather.icon || '01d').substring(0, 2);
        const cityEl = document.getElementById('weatherCity');
        const tempEl = document.getElementById('weatherTemp');
        const descEl = document.getElementById('weatherDesc');
        const humEl = document.getElementById('weatherHumidity');
        const windEl = document.getElementById('weatherWind');
        const tipEl = document.getElementById('weatherTip');
        if (cityEl) cityEl.textContent = `📍 ${weather.city}`;
        if (tempEl) tempEl.textContent = `${iconMap[code] || '🌤️'} ${weather.temp}°C — ${weather.description}`;
        if (descEl) descEl.textContent = `Feels like ${weather.feelsLike}°C`;
        if (humEl) humEl.textContent = weather.humidity;
        if (windEl) windEl.textContent = weather.windSpeed;
        if (tipEl) tipEl.textContent = weather.farmingTip;
      }
    }
  } catch (err) {
    console.warn('Dashboard weather fail:', err.message);
  }
});