import api from './axios';

// Maps to backend/routes/traderRoutes.js, mounted at /api/trader
export const createBuyingRequirement = (data) => api.post('/trader/requirements', data);
export const getBuyingRequirements = (params) => api.get('/trader/requirements', { params }); // { status, variety, district, page, limit }
export const getBuyingRequirementById = (id) => api.get(`/trader/requirements/${id}`);
export const respondToRequirement = (id, data) => api.post(`/trader/requirements/${id}/respond`, data); // { availableQuantityKg, proposedPricePerKg, message }
export const getFarmerDirectory = (params) => api.get('/trader/directory', { params }); // { district, page, limit }