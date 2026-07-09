import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createBuyingRequirement, getBuyingRequirements, respondToRequirement } from '../api/trader';
import { Loading, ErrorBox, EmptyState } from '../components/Status';

const emptyForm = {
  variety: '',
  quantityMT: '',
  quality: 'good',
  location: { district: '', municipality: '', ward: '' },
  budget: { minPricePerKg: '', maxPricePerKg: '', negotiable: true },
  requiredByDate: '',
  contact: { phone: '', email: '' },
};

const emptyResponse = { availableQuantityKg: '', proposedPricePerKg: '', message: '' };

export default function Requirements() {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseForm, setResponseForm] = useState(emptyResponse);

  const loadRequirements = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getBuyingRequirements({ limit: 50 });
      setRequirements(data.requirements);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load buying requirements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequirements(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [group, key] = name.split('.');
      setForm({ ...form, [group]: { ...form[group], [key]: type === 'checkbox' ? checked : value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createBuyingRequirement({
        ...form,
        quantityMT: Number(form.quantityMT),
        location: { ...form.location, ward: form.location.ward ? Number(form.location.ward) : undefined },
        budget: {
          ...form.budget,
          minPricePerKg: form.budget.minPricePerKg ? Number(form.budget.minPricePerKg) : undefined,
          maxPricePerKg: form.budget.maxPricePerKg ? Number(form.budget.maxPricePerKg) : undefined,
        },
      });
      setForm(emptyForm);
      setShowForm(false);
      loadRequirements();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post buying requirement.');
    } finally {
      setSaving(false);
    }
  };

  const handleRespond = async (e, id) => {
    e.preventDefault();
    setError('');
    try {
      await respondToRequirement(id, {
        ...responseForm,
        availableQuantityKg: Number(responseForm.availableQuantityKg),
        proposedPricePerKg: Number(responseForm.proposedPricePerKg),
      });
      setRespondingTo(null);
      setResponseForm(emptyResponse);
      loadRequirements();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit response.');
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Buying Requirements</h1>
          <p className="page__subtitle">Traders post what they need; farmers respond with offers.</p>
        </div>
        {user.role === 'trader' && (
          <button className="btn btn--primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Close' : '+ Post requirement'}
          </button>
        )}
      </div>

      <ErrorBox message={error} />

      {showForm && (
        <form className="panel" onSubmit={handleCreate}>
          <h2>New buying requirement</h2>
          <div className="field-grid">
            <label className="field">
              <span>Variety</span>
              <input name="variety" value={form.variety} onChange={handleChange} required placeholder="e.g. Kalapahad" />
            </label>
            <label className="field">
              <span>Quantity (metric tons)</span>
              <input type="number" step="0.1" name="quantityMT" value={form.quantityMT} onChange={handleChange} required min="0.1" />
            </label>
            <label className="field">
              <span>Quality</span>
              <select name="quality" value={form.quality} onChange={handleChange}>
                <option value="premium">Premium</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </label>
            <label className="field">
              <span>District</span>
              <input name="location.district" value={form.location.district} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Municipality</span>
              <input name="location.municipality" value={form.location.municipality} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Min price / kg (NPR)</span>
              <input type="number" name="budget.minPricePerKg" value={form.budget.minPricePerKg} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Max price / kg (NPR)</span>
              <input type="number" name="budget.maxPricePerKg" value={form.budget.maxPricePerKg} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Required by</span>
              <input type="date" name="requiredByDate" value={form.requiredByDate} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Contact phone</span>
              <input name="contact.phone" value={form.contact.phone} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Contact email</span>
              <input type="email" name="contact.email" value={form.contact.email} onChange={handleChange} />
            </label>
          </div>
          <div className="panel__actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Posting...' : 'Post requirement'}
            </button>
          </div>
        </form>
      )}

      {loading && <Loading />}
      {!loading && requirements.length === 0 && <EmptyState message="No open buying requirements right now." />}

      {!loading && requirements.length > 0 && (
        <div className="card-grid">
          {requirements.map((r) => (
            <div key={r._id} className="card">
              <h3>{r.variety} — {r.quantityMT} MT</h3>
              <p className="card__meta">
                {r.location?.municipality || 'Location not set'}{r.location?.district ? `, ${r.location.district}` : ''}
              </p>
              <ul className="card__facts">
                <li>Quality: {r.quality}</li>
                <li>Budget: NPR {r.budget?.minPricePerKg ?? '—'}–{r.budget?.maxPricePerKg ?? '—'} / kg</li>
                <li>Status: <span className={`tag tag--${r.status}`}>{r.status}</span></li>
                <li>{r.responseCount ?? 0} response(s)</li>
              </ul>

              {user.role === 'farmer' && respondingTo !== r._id && (
                <button className="btn btn--ghost" onClick={() => setRespondingTo(r._id)}>Respond</button>
              )}

              {user.role === 'farmer' && respondingTo === r._id && (
                <form className="inline-form" onSubmit={(e) => handleRespond(e, r._id)}>
                  <label className="field">
                    <span>Available quantity (kg)</span>
                    <input
                      type="number"
                      required
                      value={responseForm.availableQuantityKg}
                      onChange={(e) => setResponseForm({ ...responseForm, availableQuantityKg: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Proposed price / kg (NPR)</span>
                    <input
                      type="number"
                      required
                      value={responseForm.proposedPricePerKg}
                      onChange={(e) => setResponseForm({ ...responseForm, proposedPricePerKg: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Message</span>
                    <textarea
                      rows={2}
                      value={responseForm.message}
                      onChange={(e) => setResponseForm({ ...responseForm, message: e.target.value })}
                    />
                  </label>
                  <div className="panel__actions">
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setRespondingTo(null)}>Cancel</button>
                    <button type="submit" className="btn btn--primary btn--sm">Send response</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}