import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../store/authSlice';
import { FiEye, FiEyeOff, FiUser, FiMail, FiPhone, FiLock, FiSun, FiPackage, FiCheck } from 'react-icons/fi';
import { getProvinces, getDistricts, getMunicipalities } from '../../utils/nepalLocations';
import ThemeToggle from '../../components/ThemeToggle';
import Logo from '../../components/Logo';
const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'farmer',
  address: { province: '', district: '', municipality: '', ward: '', tole: '' },
};

// Admin is not selectable here. The platform owner's admin account is
// created directly (e.g. via the backend seed script / database), never
// through public self-registration.
const ROLES = [
  { value: 'farmer', label: 'Farmer', icon: FiSun, desc: 'Register orchards & surveys' },
  { value: 'trader', label: 'Trader', icon: FiPackage, desc: 'Post requirements & buy' },
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
      const updatedAddress = { ...form.address, [key]: value };

      // Cascading resets: changing province clears district+municipality,
      // changing district clears municipality
      if (key === 'province') {
        updatedAddress.district = '';
        updatedAddress.municipality = '';
      } else if (key === 'district') {
        updatedAddress.municipality = '';
      }

      setForm({ ...form, address: updatedAddress });
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
      <ThemeToggle className="auth-page__theme-toggle" />
      <div className="auth-shell">
        <aside className="auth-side">
          <Logo size="lg" dark className="auth-side__brand" />
          <h2 className="auth-side__title">Join Nepal's mango supply chain, digitally.</h2>
          <p className="auth-side__text">
            One account. Farmers and traders work from the same
            platform. No spreadsheets, no middlemen.
          </p>
          <ul className="auth-side__list">
            <li><span className="auth-side__list-icon"><FiCheck /></span> Free to register</li>
            <li><span className="auth-side__list-icon"><FiCheck /></span> Role-based dashboards</li>
            <li><span className="auth-side__list-icon"><FiCheck /></span> Direct farmer–trader matching</li>
          </ul>
          <div className="auth-side__glow" />
        </aside>

        <main className="auth-main">
          <form className="auth-card auth-card--wide" onSubmit={handleSubmit}>
            <Logo size="sm" className="auth-card__brand auth-card__brand--mobile" />
            <h1>Create an account</h1>
            <p className="auth-card__subtitle">Join as a farmer or a trader.</p>

            {error && <div className="status status--error">{error}</div>}

            <div className="role-select role-select--2">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.value}
                  className={`role-card ${form.role === r.value ? 'role-card--active' : ''}`}
                  onClick={() => handleRoleSelect(r.value)}
                >
                  <span className="role-card__icon"><r.icon /></span>
                  <span className="role-card__label">{r.label}</span>
                  <span className="role-card__desc">{r.desc}</span>
                </button>
              ))}
            </div>

            <div className="field-grid">
              <label className="field">
                <span>Full name</span>
                <div className="field__icon">
                  <FiUser className="field__icon-glyph" />
                  <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Sandhyaa Rai" />
                </div>
              </label>

              <label className="field">
                <span>Email</span>
                <div className="field__icon">
                  <FiMail className="field__icon-glyph" />
                  <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
                </div>
              </label>

              <label className="field">
                <span>Phone (10 digits)</span>
                <div className="field__icon">
                  <FiPhone className="field__icon-glyph" />
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    pattern="[0-9]{10}"
                    title="10 digit phone number"
                    required
                    placeholder="98XXXXXXXX"
                  />
                </div>
              </label>

              <label className="field">
                <span>Password (min 8 chars)</span>
                <div className="field__icon field__password">
                  <FiLock className="field__icon-glyph" />
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
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>

              <label className="field">
                <span>Province</span>
                <select name="address.province" value={form.address.province} onChange={handleChange}>
                  <option value="">Select province</option>
                  {getProvinces().map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>District</span>
                <select
                  name="address.district"
                  value={form.address.district}
                  onChange={handleChange}
                  disabled={!form.address.province}
                >
                  <option value="">
                    {form.address.province ? 'Select district' : 'Select province first'}
                  </option>
                  {getDistricts(form.address.province).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Municipality</span>
                <select
                  name="address.municipality"
                  value={form.address.municipality}
                  onChange={handleChange}
                  disabled={!form.address.district}
                >
                  <option value="">
                    {form.address.district ? 'Select municipality' : 'Select district first'}
                  </option>
                  {getMunicipalities(form.address.province, form.address.district).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
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
