document.addEventListener('DOMContentLoaded', async () => {
  const cropFilter = document.getElementById('cropFilter');
  const stateFilter = document.getElementById('stateFilter');
  const sortFilter = document.getElementById('sortFilter');
  const grid = document.getElementById('mandiGrid');
  const skeleton = document.getElementById('mandiSkeleton');
  const resultsCount = document.getElementById('resultsCount');
  const modal = document.getElementById('mandiModal');
  const modalClose = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalMeta = document.getElementById('modalMeta');
  const modalPrice = document.getElementById('modalPrice');
  const modalTrend = document.getElementById('modalTrend');

  // Saari crops load karo
  const crops = await getCropsList();
  if (crops && crops.length) {
    cropFilter.innerHTML = crops.map(c =>
      `<option value="${c.name_en}">${c.name_en} / ${c.name_hi}</option>`
    ).join('');
  }

  function openModal(mandi) {
    modalTitle.textContent = mandi.name;
    modalMeta.textContent = `${mandi.district}, ${mandi.state}`;
    modalPrice.innerHTML = `&#8377;${mandi.price.toLocaleString('en-IN')}/q`;
    const isUp = mandi.trend >= 0;
    modalTrend.innerHTML = `
      <span style="color: ${isUp ? 'var(--color-success)' : 'var(--color-danger)'}">
        ${isUp ? '▲' : '▼'} ${Math.abs(mandi.trend)}% aaj ka trend
      </span>`;
    modal.classList.add('active');
  }

  modalClose.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  async function loadMandis() {
    skeleton.style.display = '';
    grid.style.display = 'none';
    resultsCount.textContent = 'Loading...';

    const crop = cropFilter.value;
    const state = stateFilter.value;
    const sort = sortFilter.value;

    const data = await getMandiPrices(crop, state);
    await delay(600);

    skeleton.style.display = 'none';
    grid.style.display = '';

    if (!data || !data.length) {
      grid.innerHTML = `
        <p style="color:var(--color-text-muted); grid-column:1/-1; text-align:center; padding:var(--space-lg) 0;">
          Aaj ke rates nahi mile. Kal dobara check karein.
        </p>`;
      resultsCount.textContent = '0 mandis mili';
      return;
    }

    const sorted = [...data].sort((a, b) =>
      sort === 'price_asc' ? a.price - b.price : b.price - a.price
    );

    resultsCount.textContent = `${sorted.length} mandis mili`;

    grid.innerHTML = sorted.map((mandi, i) => `
      <div class="mandi-card ${mandi.isBest && i === 0 ? 'mandi-card--best' : ''}" data-index="${i}">
        ${mandi.isBest && i === 0 ? '<span class="mandi-card__badge">Best price</span>' : ''}
        <p class="mandi-card__name">${mandi.name}</p>
        <p class="mandi-card__distance">${mandi.district}, ${mandi.state}</p>
        <p class="mandi-card__price">&#8377;${mandi.price.toLocaleString('en-IN')}/q</p>
        <p class="mandi-card__trend" style="color:${mandi.trend >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
          ${mandi.trend >= 0 ? '▲' : '▼'} ${Math.abs(mandi.trend)}% aaj
        </p>
      </div>
    `).join('');

    grid.querySelectorAll('.mandi-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.index);
        openModal(sorted[idx]);
      });
    });
  }

  cropFilter.addEventListener('change', loadMandis);
  stateFilter.addEventListener('change', loadMandis);
  sortFilter.addEventListener('change', loadMandis);
  await loadMandis();
});