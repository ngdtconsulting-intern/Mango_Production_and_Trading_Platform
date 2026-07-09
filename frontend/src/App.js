import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import Surveys from './pages/Surveys';
import MarketPrices from './pages/MarketPrices';
import Requirements from './pages/Requirements';
import AdminPanel from './pages/AdminPanel';

import './App.css';

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
      } />

      <Route path="/farms" element={
        <ProtectedRoute roles={['farmer']}><Layout><Farms /></Layout></ProtectedRoute>
      } />

      <Route path="/surveys" element={
        <ProtectedRoute roles={['farmer', 'surveyor', 'admin']}><Layout><Surveys /></Layout></ProtectedRoute>
      } />

      <Route path="/market" element={
        <ProtectedRoute><Layout><MarketPrices /></Layout></ProtectedRoute>
      } />

      <Route path="/requirements" element={
        <ProtectedRoute roles={['trader', 'farmer', 'admin']}><Layout><Requirements /></Layout></ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}><Layout><AdminPanel /></Layout></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}