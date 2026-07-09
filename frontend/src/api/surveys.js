import api from './axios';

// Maps to backend/routes/surveyRoutes.js, mounted at /api/surveys
export const createSurvey = (data) => api.post('/surveys', data);
export const getSurveys = (params) => api.get('/surveys', { params }); // { page, limit, status }
export const getSurveyStats = () => api.get('/surveys/stats');
export const getSurveyById = (id) => api.get(`/surveys/${id}`);
export const updateSurvey = (id, data) => api.put(`/surveys/${id}`, data);
export const deleteSurvey = (id) => api.delete(`/surveys/${id}`);
export const verifySurvey = (id, data) => api.patch(`/surveys/${id}/verify`, data); // { status, verificationNotes }