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

  // ✅ URL search param — "mathura" search se state filter auto-set
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search');

  // Saari crops load karo
  const crops = await getCropsList();
  if (crops && crops.length) {
    cropFilter.innerHTML = crops.map(c =>
      `<option value="${c.name_en}">${c.name_en} / ${c.name_hi}</option>`
    ).join('');
  }

  // ✅ Search query se state match karo
  if (searchQuery) {
    const query = searchQuery.toLowerCase();

    // State map — common city/district names se state match karo
    const cityStateMap = {
      'mathura': 'Uttar Pradesh', 'meerut': 'Uttar Pradesh', 'agra': 'Uttar Pradesh',
      'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh', 'varanasi': 'Uttar Pradesh',
      'allahabad': 'Uttar Pradesh', 'prayagraj': 'Uttar Pradesh', 'bareilly': 'Uttar Pradesh',
      'gorakhpur': 'Uttar Pradesh', 'aligarh': 'Uttar Pradesh', 'moradabad': 'Uttar Pradesh',
      'vrindavan': 'Uttar Pradesh', 'muzaffarnagar': 'Uttar Pradesh', 'hapur': 'Uttar Pradesh',
      'amritsar': 'Punjab', 'ludhiana': 'Punjab', 'jalandhar': 'Punjab', 'patiala': 'Punjab',
      'karnal': 'Haryana', 'hisar': 'Haryana', 'rohtak': 'Haryana', 'ambala': 'Haryana',
      'jaipur': 'Rajasthan', 'jodhpur': 'Rajasthan', 'kota': 'Rajasthan', 'ajmer': 'Rajasthan',
      'bhopal': 'Madhya Pradesh', 'indore': 'Madhya Pradesh', 'gwalior': 'Madhya Pradesh',
      'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nagpur': 'Maharashtra', 'nashik': 'Maharashtra',
      'ahmedabad': 'Gujarat', 'surat': 'Gujarat', 'vadodara': 'Gujarat', 'rajkot': 'Gujarat',
      'patna': 'Bihar', 'gaya': 'Bihar', 'muzaffarpur': 'Bihar',
      'kolkata': 'West Bengal', 'howrah': 'West Bengal', 'siliguri': 'West Bengal',
      'bangalore': 'Karnataka', 'mysore': 'Karnataka', 'hubli': 'Karnataka',
      'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu', 'madurai': 'Tamil Nadu',
      'hyderabad': 'Telangana', 'warangal': 'Telangana',
      'visakhapatnam': 'Andhra Pradesh', 'vijayawada': 'Andhra Pradesh', 'guntur': 'Andhra Pradesh',
    };

    const matchedState = cityStateMap[query];
    if (matchedState) {
      stateFilter.value = matchedState;
      // Page title update karo
      const greeting = document.querySelector('.dashboard__greeting');
      if (greeting) greeting.textContent = `"${searchQuery}" ke results — ${matchedState}`;
    }

    // Mandi naam mein bhi search karo (grid render ke baad)
    window._searchQuery = query;
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
    await delay(500);

    skeleton.style.display = 'none';
    grid.style.display = '';

    if (!data || !data.length) {
      grid.innerHTML = `
        <p style="color:var(--color-text-muted);grid-column:1/-1;text-align:center;padding:var(--space-lg) 0;">
          Aaj ke rates nahi mile. Kal dobara check karein.
        </p>`;
      resultsCount.textContent = '0 mandis mili';
      return;
    }

    // Sort
    let sorted = [...data].sort((a, b) =>
      sort === 'price_asc' ? a.price - b.price : b.price - a.price
    );

    // ✅ Search query se mandi naam filter karo
    const searchQ = window._searchQuery;
    if (searchQ) {
      const filtered = sorted.filter(m =>
        m.name.toLowerCase().includes(searchQ) ||
        m.district.toLowerCase().includes(searchQ)
      );
      if (filtered.length > 0) sorted = filtered;
    }

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