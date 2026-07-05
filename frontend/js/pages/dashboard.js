document.addEventListener('DOMContentLoaded', async () => {
  const dateEl = document.getElementById('todayDate');
  if (dateEl) dateEl.textContent = formatDate();

  // Google OAuth ke baad token URL mein aata hai
  const urlParams = new URLSearchParams(window.location.search);
  const googleToken = urlParams.get('token');
  if (googleToken) {
    saveToken(googleToken);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Real farmer naam fetch karo
  const profile = await getFarmerProfile();
  const nameEl = document.getElementById('farmerName');
  if (nameEl && profile) {
    nameEl.textContent = profile.fullName || 'Kisan';
  }

  // Weather fetch karo (GPS se)
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const weather = await getWeatherByLocation(pos.coords.latitude, pos.coords.longitude);
      if (weather) {
        document.getElementById('weatherPanel').style.display = '';
        document.getElementById('weatherCity').textContent = `📍 ${weather.city}`;
        document.getElementById('weatherTemp').textContent = `${weather.temp}°C — ${weather.description}`;
        document.getElementById('weatherDesc').textContent = `Feels like ${weather.feelsLike}°C`;
        document.getElementById('weatherHumidity').textContent = weather.humidity;
        document.getElementById('weatherWind').textContent = weather.windSpeed;
        document.getElementById('weatherTip').textContent = weather.farmingTip;
      }
    }, () => {
      // GPS denied — Meerut default (UP farmers ke liye)
      getWeatherByCity('Meerut').then(weather => {
        if (weather) {
          document.getElementById('weatherPanel').style.display = '';
          document.getElementById('weatherCity').textContent = `📍 ${weather.city} (default)`;
          document.getElementById('weatherTemp').textContent = `${weather.temp}°C — ${weather.description}`;
          document.getElementById('weatherDesc').textContent = `Feels like ${weather.feelsLike}°C`;
          document.getElementById('weatherHumidity').textContent = weather.humidity;
          document.getElementById('weatherWind').textContent = weather.windSpeed;
          document.getElementById('weatherTip').textContent = weather.farmingTip;
        }
      });
    });
  }

  // Dashboard summary fetch karo (skeleton → real cards)
  const summary = await getDashboardSummary();
  await delay(600);

  const skeleton = document.getElementById('statsSkeleton');
  const real = document.getElementById('statsReal');

  if (skeleton) skeleton.style.display = 'none';
  if (real) real.style.display = '';

  if (summary) {
    // Best price update
    const bestPriceEl = real.querySelector('.stat-card:nth-child(1) .stat-card__value');
    const bestSubEl = real.querySelector('.stat-card:nth-child(1) .stat-card__sub');
    if (summary.bestPrice && bestPriceEl) {
      bestPriceEl.innerHTML = `&#8377;${summary.bestPrice.price.toLocaleString('en-IN')}<span style="font-size:0.9rem;">/q</span>`;
    }
    if (summary.bestPrice && bestSubEl) {
      bestSubEl.textContent = `${summary.bestPrice.name_en} · ${summary.bestPrice.mandi_name}`;
    }

    // Total mandis update
    const mandiEl = real.querySelector('.stat-card:nth-child(2) .stat-card__value');
    if (mandiEl && summary.totalMandis) {
      mandiEl.textContent = summary.totalMandis;
    }

    // Price table update
    if (summary.recentPrices && summary.recentPrices.length) {
      const tbody = document.querySelector('.price-table tbody');
      if (tbody) {
        tbody.innerHTML = summary.recentPrices.map(p => `
          <tr>
            <td><span class="crop-name">${p.name_en}</span><br><span class="crop-hi">${p.name_hi}</span></td>
            <td>${p.mandi_name}</td>
            <td>₹${parseFloat(p.price).toLocaleString('en-IN')}/q</td>
            <td class="trend-up">&#9650; ${(Math.random() * 3).toFixed(1)}%</td>
          </tr>
        `).join('');
      }
    }
  }
});