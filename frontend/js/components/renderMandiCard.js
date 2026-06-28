function renderMandiCard(mandi, isBest = false) {
  const trendClass = mandi.trend >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
  const trendArrow = mandi.trend >= 0 ? '&#9650;' : '&#9660;';

  return `
    <div class="mandi-card ${isBest ? 'mandi-card--best' : ''}">
      ${isBest ? '<span class="mandi-card__badge">Best price</span>' : ''}
      <p class="mandi-card__name">${mandi.name}</p>
      <p class="mandi-card__distance">${mandi.distance} km door</p>
      <p class="mandi-card__price">${formatPriceWithUnit(mandi.price)}</p>
      <p class="mandi-card__trend" style="color: ${trendClass};">${trendArrow} ${Math.abs(mandi.trend)}% aaj</p>
    </div>`;
}