function formatPrice(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function formatPriceWithUnit(value, unit = 'quintal') {
  const unitShort = unit === 'quintal' ? 'q' : unit;
  return `${formatPrice(value)}/${unitShort}`;
}

function formatPercent(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}