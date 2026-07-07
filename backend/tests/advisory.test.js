const { generateAdvisory } = require('../services/advisoryService');

function testAdvisory() {
  const mockForecast = [
    { value: 2150 }, { value: 2200 }, { value: 2250 },
    { value: 2280 }, { value: 2300 }, { value: 2320 }, { value: 2350 }
  ];

  const result = generateAdvisory('Wheat', 2150, mockForecast);
  console.log('✅ Advisory test result:', result);
  console.assert(result.signal === 'HOLD', 'Signal should be HOLD for rising price');
  console.assert(result.percentChange > 0, 'PercentChange should be positive');
  console.log('✅ All advisory tests passed');
}

testAdvisory();