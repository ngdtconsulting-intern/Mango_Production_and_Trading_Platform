import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { createOrUpdatePrice, getLatestPrices } from '../api/market';
import { Loading, ErrorBox, EmptyState } from '../components/Status';

const MARKETS = ['Kalimati', 'Balkhu', 'Lahan', 'Janakpur', 'Hetauda', 'Bhaktapur', 'Kathmandu'];

const emptyForm = {
  market: MARKETS[0],
  variety: '',
  wholesalePricePerKg: '',
  retailPricePerKg: '',
  quality: 'good',
  supply: 'normal',
};

export default function MarketPrices() {
  const { user } = useAuth();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadPrices = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getLatestPrices();
      setPrices(data.prices);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load market prices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPrices(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createOrUpdatePrice({
        ...form,
        wholesalePricePerKg: Number(form.wholesalePricePerKg),
        retailPricePerKg: Number(form.retailPricePerKg),
      });
      setForm(emptyForm);
      setShowForm(false);
      loadPrices();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save price.');
    } finally {
      setSaving(false);
    }
  };

  const chartData = prices.map((p) => ({
    name: `${p.market} · ${p.variety}`,
    Wholesale: p.wholesalePricePerKg,
    Retail: p.retailPricePerKg,
  }));

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Market Prices</h1>
          <p className="page__subtitle">Latest wholesale and retail prices by market and variety.</p>
        </div>
        {user.role === 'admin' && (
          <button className="btn btn--primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Close' : '+ Update price'}
          </button>
        )}
      </div>

      <ErrorBox message={error} />

      {showForm && (
        <form className="panel" onSubmit={handleSubmit}>
          <h2>Update market price</h2>
          <div className="field-grid">
            <label className="field">
              <span>Market</span>
              <select name="market" value={form.market} onChange={handleChange}>
                {MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Variety</span>
              <input name="variety" value={form.variety} onChange={handleChange} required placeholder="e.g. Kalapahad" />
            </label>
            <label className="field">
              <span>Wholesale price / kg (NPR)</span>
              <input type="number" step="0.01" name="wholesalePricePerKg" value={form.wholesalePricePerKg} onChange={handleChange} required min="0" />
            </label>
            <label className="field">
              <span>Retail price / kg (NPR)</span>
              <input type="number" step="0.01" name="retailPricePerKg" value={form.retailPricePerKg} onChange={handleChange} required min="0" />
            </label>
            <label className="field">
              <span>Quality</span>
              <select name="quality" value={form.quality} onChange={handleChange}>
                <option value="premium">Premium</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </label>
            <label className="field">
              <span>Supply</span>
              <select name="supply" value={form.supply} onChange={handleChange}>
                <option value="abundant">Abundant</option>
                <option value="normal">Normal</option>
                <option value="scarce">Scarce</option>
              </select>
            </label>
          </div>
          <div className="panel__actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save price'}
            </button>
          </div>
        </form>
      )}

      {loading && <Loading />}
      {!loading && prices.length === 0 && <EmptyState message="No market prices recorded yet." />}

      {!loading && prices.length > 0 && (
        <>
          <div className="panel panel--chart">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={80} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Wholesale" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Retail" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Market</th>
                <th>Variety</th>
                <th>Wholesale (NPR/kg)</th>
                <th>Retail (NPR/kg)</th>
                <th>Quality</th>
                <th>Supply</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p) => (
                <tr key={p._id}>
                  <td>{p.market}</td>
                  <td>{p.variety}</td>
                  <td>{p.wholesalePricePerKg}</td>
                  <td>{p.retailPricePerKg}</td>
                  <td><span className={`tag tag--${p.quality}`}>{p.quality}</span></td>
                  <td>{p.supply}</td>
                  <td>{new Date(p.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}