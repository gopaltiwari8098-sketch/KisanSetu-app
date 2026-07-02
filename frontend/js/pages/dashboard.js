const urlParams = new URLSearchParams(window.location.search);
const googleToken = urlParams.get('token');
if (googleToken) {
  saveToken(googleToken);
  // URL clean karo (token URL mein na dikhe)
  window.history.replaceState({}, document.title, '/frontend/dashboard.html');
}
document.addEventListener('DOMContentLoaded', async () => {
  const dateEl = document.getElementById('todayDate');
  if (dateEl) dateEl.textContent = formatDate();

  await delay(3000);// simulate fetch — backend ready hone par real await yahin rahega
  document.getElementById('statsSkeleton').style.display = 'none';
  document.getElementById('statsReal').style.display = '';

  const summary = await getDashboardSummary();
  if (!summary) {
    console.log('Demo data dikhaya jaa raha hai, backend abhi connect nahi hai.');
    return;
  }
  const nameEl = document.getElementById('farmerName');
  if (nameEl && summary.farmerName) nameEl.textContent = summary.farmerName;
});