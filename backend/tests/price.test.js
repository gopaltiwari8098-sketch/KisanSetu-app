const pool = require('../config/db');

async function testPriceQuery() {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM prices WHERE recorded_date = CURRENT_DATE"
    );
    const count = parseInt(result.rows[0].count);
    console.log(`✅ Price test: ${count} records aaj ke hain`);
    console.log(count > 0 ? '✅ Prices available hain' : '❌ Koi prices nahi hain aaj ke');
  } catch (err) {
    console.error('❌ Price test fail:', err.message);
  }
}

testPriceQuery().then(() => process.exit(0));