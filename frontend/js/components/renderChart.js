function renderChartBars(forecastData) {
  const maxValue = Math.max(...forecastData.map((d) => d.value));

  return forecastData
    .map((d) => {
      const heightPercent = Math.round((d.value / maxValue) * 100);
      return `
        <div class="chart-bar">
          <span class="chart-bar__value">${d.value}</span>
          <div class="chart-bar__fill" style="height: ${heightPercent}%;"></div>
          <span class="chart-bar__label">${d.label}</span>
        </div>`;
    })
    .join('');
}