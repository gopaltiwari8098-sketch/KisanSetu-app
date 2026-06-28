document.addEventListener('DOMContentLoaded', async () => {
  const schemes = await getSchemes();
  if (!schemes) {
    console.log('Demo scheme cards dikh rahe hain, backend abhi connect nahi hai.');
    return;
  }
  // Backend ban jaane par yahan dynamically cards render kara h getSchemes() se.
});