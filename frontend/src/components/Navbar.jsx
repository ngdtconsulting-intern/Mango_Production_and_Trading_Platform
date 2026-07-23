import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import '../styles/navbar.css';

const NAV_LINKS = {
  farmer: [
    { to: '/farmer/dashboard', label: 'Dashboard' },
    { to: '/farmer/farms/new', label: 'Add Farm' },
    { to: '/farmer/survey', label: 'Survey' },
    { to: '/farmer/market', label: 'Market Prices' },
    { to: '/trader/requirements', label: 'Buying Requirements' },
  ],
  trader: [
    { to: '/trader/dashboard', label: 'Dashboard' },
    { to: '/trader/requirements/create', label: 'Post Requirement' },
    { to: '/trader/directory', label: 'Farmer Directory' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
  ],
};

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const links = NAV_LINKS[user.role] || [];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={`/${user.role}/dashboard`} className="navbar-brand">
          <span className="navbar-brand-icon">🥭</span>
          <span>Aam Bazaar</span>
        </Link>

        <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          ☰
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-user">
          <span className="navbar-username">{user.name}</span>
          <button className="navbar-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      <div className="navbar-stripe" />
    </nav>
  );
}