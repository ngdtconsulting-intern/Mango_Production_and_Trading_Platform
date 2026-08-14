import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import '../../styles/dashboard.css';
import '../../styles/forms.css';

const VARIETIES = ['Maldaha', 'Amrapali', 'Sindhure', 'Langra', 'Dusehri', 'Chaunsa'];

const initialForm = {
  variety: VARIETIES[0],
  wholesalePricePerKg: '',
  retailPricePerKg: '',
  quality: 'good',
  supply: 'normal',
};

export default function OfficerMarketPrices() {
  const { user } = useSelector((state) => state.auth);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const coverage = user?.coverageArea;

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const { data } = await api.get('/market/my-prices');
      setPrices(data.prices);
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast.error('Failed to load your prices');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/market', {
        variety: form.variety,
        wholesalePricePerKg: Number(form.wholesalePricePerKg),
        retailPricePerKg: Number(form.retailPricePerKg),
        quality: form.quality,
        supply: form.supply,
      });
      toast.success(`Price set for ${form.variety}`);
      setForm({ ...initialForm, variety: form.variety });
      fetchPrices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to set price');
    } finally {
      setSubmitting(false);
    }
  };

  if (!coverage?.district) {
    return (
      <div className="dashboard-container">
        <PageBanner
          variant="admin"
          eyebrow="Officer dashboard"
          title="Market Prices"
          subtitle="Set today's mango prices for your coverage area."
        />
        <p className="empty-message">
          Your account has no coverage area assigned yet. Ask an admin to set one before you can publish prices.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <PageBanner
        variant="admin"
        eyebrow="Officer dashboard"
        title="Market Prices"
        subtitle={`Set today's mango prices for ${coverage.municipality ? coverage.municipality + ', ' : ''}${coverage.district}. Traders posting buying requirements in your district must price within a range of what you set here.`}
      />

      <form className="application-form" onSubmit={handleSubmit} style={{ maxWidth: 480, marginBottom: 40 }}>
        <div className="form-group">
          <label>Variety</label>
          <select name="variety" value={form.variety} onChange={handleChange}>
            {VARIETIES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Wholesale Price (Rs/kg)</label>
          <input type="number" step="0.01" min="0" name="wholesalePricePerKg" value={form.wholesalePricePerKg} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Retail Price (Rs/kg)</label>
          <input type="number" step="0.01" min="0" name="retailPricePerKg" value={form.retailPricePerKg} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Reference Quality</label>
          <select name="quality" value={form.quality} onChange={handleChange}>
            <option value="premium">Premium</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>

        <div className="form-group">
          <label>Supply</label>
          <select name="supply" value={form.supply} onChange={handleChange}>
            <option value="abundant">Abundant</option>
            <option value="normal">Normal</option>
            <option value="scarce">Scarce</option>
          </select>
        </div>

        <div className="modal-actions">
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Set Price'}
          </button>
        </div>
      </form>

      <h2>Today's Prices for {coverage.district} ({prices.length})</h2>
      {loading ? (
        <p className="loading">Loading...</p>
      ) : prices.length === 0 ? (
        <p className="empty-message-small">You haven't set any prices today.</p>
      ) : (
        <div className="admin-list">
          {prices.map((p) => (
            <div key={p._id} className="admin-card">
              <div className="admin-card-info">
                <strong>{p.variety}</strong>
                <span>Wholesale Rs. {p.wholesalePricePerKg}/kg, Retail Rs. {p.retailPricePerKg}/kg</span>
                <span>Reference quality: {p.quality}, supply: {p.supply}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
