document.addEventListener('DOMContentLoaded', async () => {
  const dateEl = document.getElementById('todayDate');
  if (dateEl) dateEl.textContent = formatDate();

  const summary = await getDashboardSummary();
  if (!summary) {
    console.log('Demo data dikhaya jaa raha hai, backend abhi connect nahi hai.');
    return;
  }

  // Backend ban jaane par yahan summary.farmerName, summary.prices, etc.
  // use karke real DOM update karein.
  const nameEl = document.getElementById('farmerName');
  if (nameEl && summary.farmerName) nameEl.textContent = summary.farmerName;
});