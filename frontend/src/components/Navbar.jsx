import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) => 'nav-link' + (isActive ? ' nav-link--active' : '');

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo">🥭</span>
        <span>Mango Platform</span>
      </div>

      <nav className="navbar__links">
        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        <NavLink to="/market" className={linkClass}>Market Prices</NavLink>

        {user.role === 'farmer' && (
          <>
            <NavLink to="/farms" className={linkClass}>My Farms</NavLink>
            <NavLink to="/surveys" className={linkClass}>My Surveys</NavLink>
            <NavLink to="/requirements" className={linkClass}>Buyer Requests</NavLink>
          </>
        )}

        {user.role === 'trader' && (
          <NavLink to="/requirements" className={linkClass}>Buying Requirements</NavLink>
        )}

        {user.role === 'surveyor' && (
          <NavLink to="/surveys" className={linkClass}>Surveys</NavLink>
        )}

        {user.role === 'admin' && (
          <NavLink to="/admin" className={linkClass}>Admin</NavLink>
        )}
      </nav>

      <div className="navbar__user">
        <span className="navbar__user-name">{user.name}</span>
        <span className="badge">{user.role}</span>
        <button className="btn btn--ghost" onClick={handleLogout}>Log out</button>
      </div>
    </header>
  );
}