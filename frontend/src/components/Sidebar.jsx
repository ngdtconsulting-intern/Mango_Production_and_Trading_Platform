import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiGrid, FiPlusSquare, FiClipboard,
  FiMessageCircle, FiLogOut, FiMenu,
  FiChevronLeft, FiChevronRight, FiAlertTriangle, FiSend,
  FiSun, FiMoon, FiFlag, FiTag, FiUserPlus, FiBookOpen,
} from 'react-icons/fi';
import { logout } from '../store/authSlice';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';
import '../styles/sidebar.css';

const NAV_LINKS = {
  farmer: [
    { to: '/farmer/dashboard', label: 'Dashboard', icon: FiGrid, end: true },
    { to: '/farmer/report', label: 'Report a Problem', icon: FiAlertTriangle },
    { to: '/farmer/farms/new', label: 'Add Farm', icon: FiPlusSquare },
    { to: '/farmer/survey', label: 'Survey', icon: FiClipboard },
    { to: '/farmer/requests', label: 'My Requests', icon: FiSend },
    { to: '/farmer/community', label: 'Community', icon: FiMessageCircle },
  ],
trader: [
  { to: '/trader/dashboard', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/trader/report', label: 'Report a Problem', icon: FiAlertTriangle },
  { to: '/trader/requirements/create', label: 'Post Requirement', icon: FiPlusSquare },
],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: FiGrid, end: true },
    { to: '/admin/census', label: 'National Census', icon: FiBookOpen },
    { to: '/admin/officers/new', label: 'Create Officer', icon: FiUserPlus },
  ],
  surveyor: [
    { to: '/officer/dashboard', label: 'Dashboard', icon: FiGrid, end: true },
    { to: '/officer/surveys', label: 'Pending Surveys', icon: FiClipboard },
    { to: '/officer/census', label: 'Annual Census', icon: FiBookOpen },
    { to: '/officer/reports', label: 'Reported Problems', icon: FiFlag },
    { to: '/officer/market', label: 'Market Prices', icon: FiTag },
  ],
};

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('aam-sidebar-collapsed') === '1');

  if (!user) return null;

  const links = NAV_LINKS[user.role] || [];
  const ThemeIcon = theme === 'dark' ? FiSun : FiMoon;
  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem('aam-sidebar-collapsed', !c ? '1' : '0');
      return !c;
    });
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="sidebar-topbar">
        <button className="sidebar-icon-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <FiMenu />
        </button>
        <Logo size="sm" to={`/${user.role}/dashboard`} className="sidebar-topbar-brand" />
        <button
          className="sidebar-icon-btn"
          onClick={toggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
        >
          <ThemeIcon />
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <Logo
            size="sm"
            markOnly={collapsed}
            to={`/${user.role}/dashboard`}
            className="sidebar-brand"
            onClick={() => setMobileOpen(false)}
          />
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to + link.label}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? link.label : undefined}
              >
                <Icon className="sidebar-link-icon" />
                {!collapsed && <span>{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-theme-toggle"
            onClick={toggleTheme}
            aria-label={themeLabel}
            title={themeLabel}
          >
            <span className="sidebar-theme-icon"><ThemeIcon /></span>
            {!collapsed && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
          </button>

          {!collapsed && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{user.name?.[0]?.toUpperCase()}</div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.name}</span>
                <span className="sidebar-user-role">{user.role}</span>
              </div>
            </div>
          )}

          <button className="sidebar-logout" onClick={handleLogout}>
            <FiLogOut />
            {!collapsed && <span>Logout</span>}
          </button>

          <button className="sidebar-collapse-btn" onClick={toggleCollapsed} aria-label="Collapse sidebar">
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>
      </aside>
    </>
  );
}
