import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login } from '../../store/authSlice';
import ThemeToggle from '../../components/ThemeToggle';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(formData));

    if (login.fulfilled.match(result)) {
      toast.success('Logged in successfully');
      const role = result.payload.role;
      if (role === 'trader') navigate('/trader/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
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
          <Link to="/" className="auth-side__brand">
            <span className="navbar__logo">🥭</span> Aam Bazaar
          </Link>
          <h2 className="auth-side__title">Welcome back to Nepal's mango marketplace.</h2>
          <p className="auth-side__text">
            Log in to manage your orchards, respond to buying requirements,
            check live market prices, or oversee the platform — all in one place.
          </p>
          <ul className="auth-side__list">
            <li>✅ Role-based dashboards</li>
            <li>✅ Live market prices</li>
            <li>✅ Direct farmer–trader matching</li>
          </ul>
          <div className="auth-side__glow" />
        </aside>

        <main className="auth-main">
          <form className="auth-card" onSubmit={handleSubmit}>
            <div className="auth-card__brand auth-card__brand--mobile">🥭 Aam Bazaar</div>
            <h1>Log in</h1>
            <p className="auth-card__subtitle">Enter your details to access your dashboard.</p>

            <div className="field-grid field-grid--single">
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                />
              </label>

              <label className="field">
                <span>Password</span>
                <div className="field__password">
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

            <p className="auth-card__footer">
              Don't have an account? <Link to="/register">Register</Link>
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}
