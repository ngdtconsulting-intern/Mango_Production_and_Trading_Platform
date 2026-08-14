import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login, logout } from '../../store/authSlice';
import ThemeToggle from '../../components/ThemeToggle';
import Logo from '../../components/Logo';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUsers, FiShield, FiCheck } from 'react-icons/fi';

const LOGIN_MODES = [
  { value: 'user', label: 'Farmer / Trader', icon: FiUsers },
  { value: 'officer', label: 'Officer / Admin', icon: FiShield },
];

const ROLE_GROUPS = {
  user: ['farmer', 'trader'],
  officer: ['admin', 'surveyor'],
};

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState('user');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(formData));

    if (login.fulfilled.match(result)) {
      const role = result.payload.role;

      if (!ROLE_GROUPS[loginMode].includes(role)) {
        dispatch(logout());
        const modeLabel = LOGIN_MODES.find((m) => m.value === loginMode)?.label;
        toast.error(`That account isn't a ${modeLabel} account. Switch the login mode above and try again.`);
        return;
      }

      toast.success('Logged in successfully');
      if (role === 'trader') navigate('/trader/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'surveyor') navigate('/officer/dashboard');
      else navigate('/farmer/dashboard');
    } else {
      toast.error(result.payload || 'Login failed');
    }
  };

  return (
    <div className="auth-page">
      <ThemeToggle className="auth-page__theme-toggle" />
      <div className="auth-shell">
        <aside className="auth-side">
          <Logo size="lg" dark className="auth-side__brand" />
          <h2 className="auth-side__title">Welcome back to Nepal's mango marketplace.</h2>
          <p className="auth-side__text">
            Log in to manage your orchards, respond to buying requirements,
            check live market prices, or oversee the platform, all in one place.
          </p>
          <ul className="auth-side__list">
            <li><span className="auth-side__list-icon"><FiCheck /></span> Role-based dashboards</li>
            <li><span className="auth-side__list-icon"><FiCheck /></span> Live market prices</li>
            <li><span className="auth-side__list-icon"><FiCheck /></span> Direct farmer–trader matching</li>
          </ul>
          <div className="auth-side__glow" />
        </aside>

        <main className="auth-main">
          <form className="auth-card" onSubmit={handleSubmit}>
            <Logo size="sm" className="auth-card__brand auth-card__brand--mobile" />
            <h1>Log in</h1>
            <p className="auth-card__subtitle">Enter your details to access your dashboard.</p>

            <div className="role-select role-select--2" style={{ marginBottom: 22 }}>
              {LOGIN_MODES.map((m) => (
                <button
                  type="button"
                  key={m.value}
                  className={`role-card ${loginMode === m.value ? 'role-card--active' : ''}`}
                  onClick={() => setLoginMode(m.value)}
                >
                  <span className="role-card__icon"><m.icon /></span>
                  <span className="role-card__label">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="field-grid field-grid--single">
              <label className="field">
                <span>Email</span>
                <div className="field__icon">
                  <FiMail className="field__icon-glyph" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                  />
                </div>
              </label>

              <label className="field">
                <span>Password</span>
                <div className="field__icon field__password">
                  <FiLock className="field__icon-glyph" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="field__password-toggle"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>
            </div>

            <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={loading}>
              {loading ? <span className="btn__spinner" /> : 'Log in'}
            </button>

            {loginMode === 'user' ? (
              <p className="auth-card__footer">
                Don't have an account? <Link to="/register">Register</Link>
              </p>
            ) : (
              <p className="auth-card__footer">
                Officer and admin accounts are created by an administrator. Contact your admin if you need access.
              </p>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}