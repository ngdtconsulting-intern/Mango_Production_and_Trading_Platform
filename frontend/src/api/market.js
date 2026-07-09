import api from './axios';

// Maps to backend/routes/marketRoutes.js, mounted at /api/market
export const createOrUpdatePrice = (data) => api.post('/market', data); // admin only
export const getPrices = (params) => api.get('/market', { params }); // { market, variety, days, page, limit }
export const getLatestPrices = () => api.get('/market/latest');
export const getPriceComparison = (params) => api.get('/market/comparison', { params }); // { market1, market2, variety }