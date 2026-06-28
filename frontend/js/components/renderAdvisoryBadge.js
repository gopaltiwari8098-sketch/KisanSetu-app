function renderAdvisoryBadge(cropEn, cropHi, percentChange, days = 7) {
  const isUp = percentChange >= 0;
  const badgeClass = isUp ? 'forecast-badge--up' : 'forecast-badge--down';

  return `
    <div class="forecast-item">
      <div>
        <p class="forecast-item__crop">${cropEn} <span class="forecast-item__hi">${cropHi}</span></p>
      </div>
      <span class="forecast-badge ${badgeClass}">${formatPercent(percentChange)} in ${days} din</span>
    </div>`;
}