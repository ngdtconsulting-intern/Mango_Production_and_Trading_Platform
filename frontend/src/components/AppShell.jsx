import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../styles/sidebar.css';

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="app-shell__main">
        <header className="app-topbar">
          <button
            className="app-topbar-toggle"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <Link to="/" className="app-topbar-brand">
            <span>🥭</span> Aam Bazaar
          </Link>
        </header>
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}
