import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './store/authSlice';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Farmer Pages
import FarmerDashboard from './pages/farmer/Dashboard';
import SurveyForm from './pages/farmer/SurveyForm';
import MarketPrices from './pages/farmer/MarketPrices';

// Trader Pages
import TraderDashboard from './pages/trader/Dashboard';
import BuyingRequirements from './pages/trader/BuyingRequirements';
import FarmerDirectory from './pages/trader/FarmerDirectory';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !requiredRole.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Farmer Routes */}
        <Route
          path="/farmer/dashboard"
          element={
            <ProtectedRoute requiredRole={['farmer']}>
              <FarmerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/survey"
          element={
            <ProtectedRoute requiredRole={['farmer']}>
              <SurveyForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/market"
          element={
            <ProtectedRoute requiredRole={['farmer']}>
              <MarketPrices />
            </ProtectedRoute>
          }
        />

        {/* Trader Routes */}
        <Route
          path="/trader/dashboard"
          element={
            <ProtectedRoute requiredRole={['trader']}>
              <TraderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trader/requirements"
          element={
            <ProtectedRoute requiredRole={['trader', 'farmer']}>
              <BuyingRequirements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trader/directory"
          element={
            <ProtectedRoute requiredRole={['trader']}>
              <FarmerDirectory />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default Routes */}
        <Route path="/" element={<Navigate to="/farmer/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;