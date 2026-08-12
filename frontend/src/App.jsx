import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './store/authSlice';
import Sidebar from './components/Sidebar';
import { checkSurveyStatus } from './store/surveySlice';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/Home';

// Farmer Pages
import FarmerDashboard from './pages/farmer/Dashboard';
import SurveyForm from './pages/farmer/SurveyForm';
import MarketPrices from './pages/farmer/MarketPrices';
import AddFarm from './pages/farmer/AddFarm';
import ChatBox from './pages/community/ChatBox';

// Trader Pages
import TraderDashboard from './pages/trader/Dashboard';
import BuyingRequirements from './pages/trader/BuyingRequirements';
import CreateRequirement from './pages/trader/CreateRequirement';
import RequirementDetail from './pages/trader/RequirementDetail';
import FarmerDirectory from './pages/trader/FarmerDirectory';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { hasSurvey } = useSelector((state) => state.survey);

  useEffect(() => {
    if (user?.role === 'farmer' && hasSurvey === null) {
      dispatch(checkSurveyStatus());
    }
  }, [user, hasSurvey, dispatch]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !requiredRole.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">{children}</main>
    </div>
  );
};

// Root route modified to ALWAYS return <Home />
const RootRoute = () => {
  return <Home />;
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
    <BrowserRouter>
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
          path="/farmer/farms/new"
          element={
            <ProtectedRoute requiredRole={['farmer']}>
              <AddFarm />
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
        <Route
          path="/farmer/community"
          element={
            <ProtectedRoute requiredRole={['farmer']}>
              <ChatBox />
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
          path="/trader/requirements/create"
          element={
            <ProtectedRoute requiredRole={['trader']}>
              <CreateRequirement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trader/requirements/:id"
          element={
            <ProtectedRoute requiredRole={['trader']}>
              <RequirementDetail />
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
        <Route path="/" element={<RootRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;