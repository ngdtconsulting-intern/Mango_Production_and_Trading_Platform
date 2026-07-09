import api from './axios';

// POST /api/auth/register  body: { name, email, phone, password, role, address }
export const registerUser = (data) => api.post('/auth/register', data);

// POST /api/auth/login  body: { email, password }
export const loginUser = (data) => api.post('/auth/login', data);

// GET /api/auth/me  (requires token)
export const fetchCurrentUser = () => api.get('/auth/me');

// PUT /api/auth/profile  body: { name, age, educationLevel, businessName }
export const updateProfile = (data) => api.put('/auth/profile', data);

// POST /api/auth/logout
export const logoutUser = () => api.post('/auth/logout');