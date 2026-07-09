import api from './axios';

// Maps to backend/routes/adminRoutes.js, mounted at /api/admin (all admin-only)
export const getDashboardStats = () => api.get('/admin/dashboard');
export const getUserManagement = (params) => api.get('/admin/users', { params }); // { role, page, limit }
export const toggleUserStatus = (id) => api.patch(`/admin/users/${id}/toggle`);
export const getAnalyticsReport = () => api.get('/admin/analytics');