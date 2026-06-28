document.addEventListener('DOMContentLoaded', async () => {
  const cropFilter = document.getElementById('cropFilter');
  const sortFilter = document.getElementById('sortFilter');
  const grid = document.getElementById('mandiGrid');
  const skeleton = document.getElementById('mandiSkeleton');

  await delay(3000);
  skeleton.style.display = 'none';
  grid.style.display = '';

  async function refreshMandis() {
    const data = await getMandiPrices(cropFilter.value);
    if (!data || !data.length) {
      console.log('Demo cards dikh rahe hain, backend abhi connect nahi hai.');
      return;
    }
    const sorted = [...data].sort((a, b) =>
      sortFilter.value === 'distance' ? a.distance - b.distance : b.price - a.price
    );
    grid.innerHTML = sorted.map((m, i) => renderMandiCard(m, i === 0)).join('');
  }

  cropFilter.addEventListener('change', refreshMandis);
  sortFilter.addEventListener('change', refreshMandis);
});