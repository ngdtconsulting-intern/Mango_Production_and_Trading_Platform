import React, { useEffect, useState } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

function getInitialTheme() {
  const saved = localStorage.getItem('aam-bazaar-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aam-bazaar-theme', theme);
  }, [theme]);

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <FiSun /> : <FiMoon />}
    </button>
  );
}
