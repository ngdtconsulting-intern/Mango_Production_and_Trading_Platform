import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../store/authSlice';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'farmer',
  address: { ward: '', tole: '', district: '', municipality: '' },
};

const ROLES = [
  { value: 'farmer', label: 'Farmer', icon: '🌳', desc: 'Register orchards & surveys' },
  { value: 'trader', label: 'Trader', icon: '📦', desc: 'Post requirements & buy' },
  { value: 'admin', label: 'Admin', icon: '⚙️', desc: 'Manage the platform' },
];

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setForm({ ...form, address: { ...form.address, [key]: value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleRoleSelect = (role) => setForm({ ...form, role });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      address: { ...form.address, ward: form.address.ward ? Number(form.address.ward) : undefined },
    };

    const resultAction = await dispatch(register(payload));

    if (register.fulfilled.match(resultAction)) {
      const role = resultAction.payload.role;
      navigate(`/${role}/dashboard`);
    }
    // if rejected, `error` from useSelector already updates and renders below
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-side">
          <Link to="/" className="auth-side__brand">
            <span className="navbar__logo">🥭</span> Aam Bazaar
          </Link>
          <h2 className="auth-side__title">Join Nepal's mango supply chain, digitally.</h2>
          <p className="auth-side__text">
            One account. Farmers, traders, and admins all work from the same
            platform — no spreadsheets, no middlemen.
          </p>
          <ul className="auth-side__list">
            <li>✅ Free to register</li>
            <li>✅ Role-based dashboards</li>
            <li>✅ Direct farmer–trader matching</li>
          </ul>
          <div className="auth-side__glow" />
        </aside>

        <main className="auth-main">
          <form className="auth-card auth-card--wide" onSubmit={handleSubmit}>
            <div className="auth-card__brand auth-card__brand--mobile">🥭 Aam Bazaar</div>
            <h1>Create an account</h1>
            <p className="auth-card__subtitle">Join as a farmer, trader, or admin.</p>

            {error && <div className="status status--error">{error}</div>}

            <div className="role-select">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.value}
                  className={`role-card ${form.role === r.value ? 'role-card--active' : ''}`}
                  onClick={() => handleRoleSelect(r.value)}
                >
                  <span className="role-card__icon">{r.icon}</span>
                  <span className="role-card__label">{r.label}</span>
                  <span className="role-card__desc">{r.desc}</span>
                </button>
              ))}
            </div>

            <div className="field-grid">
              <label className="field">
                <span>Full name</span>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Sandhyaa Rai" />
              </label>

              <label className="field">
                <span>Email</span>
                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
              </label>

              <label className="field">
                <span>Phone (10 digits)</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  title="10 digit phone number"
                  required
                  placeholder="98XXXXXXXX"
                />
              </label>

              <label className="field">
                <span>Password (min 8 chars)</span>
                <div className="field__password">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    minLength={8}
                    required
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="field__password-toggle"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </label>

              <label className="field">
                <span>District</span>
                <input name="address.district" value={form.address.district} onChange={handleChange} placeholder="e.g. Siraha" />
              </label>

              <label className="field">
                <span>Municipality</span>
                <input name="address.municipality" value={form.address.municipality} onChange={handleChange} placeholder="e.g. Lahan" />
              </label>

              <label className="field">
                <span>Tole</span>
                <input name="address.tole" value={form.address.tole} onChange={handleChange} />
              </label>

              <label className="field">
                <span>Ward number</span>
                <input type="number" name="address.ward" value={form.address.ward} onChange={handleChange} />
              </label>
            </div>

            <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={loading}>
              {loading ? <span className="btn__spinner" /> : 'Create account'}
            </button>

            <p className="auth-card__footer">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}