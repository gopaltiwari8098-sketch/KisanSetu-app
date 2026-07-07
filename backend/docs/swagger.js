const swaggerDoc = {
  openapi: '3.0.0',
  info: {
    title: 'KisanSetu API',
    version: '1.0.0',
    description: 'AI-based mandi price intelligence for Indian farmers'
  },
  servers: [{ url: '/api' }],
  paths: {
    '/auth/signup': { post: { summary: 'Register farmer', tags: ['Auth'] } },
    '/auth/login': { post: { summary: 'Login farmer', tags: ['Auth'] } },
    '/price/dashboard-summary': { get: { summary: 'Dashboard stats', tags: ['Prices'] } },
    '/price/mandi': { get: { summary: 'Mandi prices by crop', tags: ['Prices'] } },
    '/price/forecast': { get: { summary: 'AI price forecast', tags: ['Prices'] } },
    '/mandi': { get: { summary: 'All mandis list', tags: ['Mandis'] } },
    '/scheme': { get: { summary: 'Govt schemes list', tags: ['Schemes'] } },
    '/alert': { get: { summary: 'Get farmer alerts', tags: ['Alerts'] } },
    '/weather/current': { get: { summary: 'Current weather', tags: ['Weather'] } }
  }
};

module.exports = swaggerDoc;