import api from './axios';

// These map to backend/routes/farmerRoutes.js, mounted at /api/farms (see server.js fix).
export const createFarm = (data) => api.post('/farms', data);
export const getFarms = (params) => api.get('/farms', { params }); // { page, limit }
export const getFarmById = (id) => api.get(`/farms/${id}`);
export const updateFarm = (id, data) => api.put(`/farms/${id}`, data);
export const deleteFarm = (id) => api.delete(`/farms/${id}`);