import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'farmer',
  address: { ward: '', tole: '', district: '', municipality: '' },
};

export default function Register() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setForm({ ...form, address: { ...form.address, [key]: value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register({
        ...form,
        address: { ...form.address, ward: form.address.ward ? Number(form.address.ward) : undefined },
      });
      navigate('/dashboard');
    } catch {
      // error surfaced via context
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card auth-card--wide" onSubmit={handleSubmit}>
        <div className="auth-card__brand">🥭 Mango Platform</div>
        <h1>Create an account</h1>
        <p className="auth-card__subtitle">Join as a farmer, trader, surveyor, or admin.</p>

        {error && <div className="status status--error">{error}</div>}

        <div className="field-grid">
          <label className="field">
            <span>Full name</span>
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
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
            />
          </label>

          <label className="field">
            <span>Password (min 8 chars)</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              required
            />
          </label>

          <label className="field">
            <span>I am a</span>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="farmer">Farmer</option>
              <option value="trader">Trader</option>
              <option value="surveyor">Surveyor</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label className="field">
            <span>District</span>
            <input name="address.district" value={form.address.district} onChange={handleChange} />
          </label>

          <label className="field">
            <span>Municipality</span>
            <input name="address.municipality" value={form.address.municipality} onChange={handleChange} />
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

        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}