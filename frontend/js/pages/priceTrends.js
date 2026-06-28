document.addEventListener('DOMContentLoaded', () => {
  const cropFilter = document.getElementById('trendCropFilter');

  async function refreshForecast() {
    const data = await getPriceForecast(cropFilter.value);
    if (!data) {
      console.log('Demo chart dikh raha hai, backend abhi connect nahi hai.');
      return;
    }

    const chartContainer = document.querySelector('.chart-bars');
    if (chartContainer) chartContainer.innerHTML = renderChartBars(data.forecast);
  }

  cropFilter.addEventListener('change', refreshForecast);
});