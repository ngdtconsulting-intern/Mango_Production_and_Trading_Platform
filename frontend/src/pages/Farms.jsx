import React, { useEffect, useState } from 'react';
import { createFarm, deleteFarm, getFarms, updateFarm } from '../api/farms';
import { Loading, ErrorBox, EmptyState } from '../components/Status';

const emptyForm = {
  farmName: '',
  description: '',
  location: { district: '', municipality: '', tole: '', ward: '' },
  orchardAreaKatha: '',
  totalTreeCount: '',
  bearingTreeCount: '',
  soilType: 'loamy',
  terrain: 'flat',
  irrigationSystem: 'rainfed',
  lastHarvestQuantityKg: '',
  lastHarvestRevenuNPR: '',
};

export default function Farms() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadFarms = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getFarms({ limit: 50 });
      setFarms(data.farms);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load farms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFarms(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const key = name.split('.')[1];
      setForm({ ...form, location: { ...form.location, [key]: value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const openNewForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (farm) => {
    setForm({
      farmName: farm.farmName || '',
      description: farm.description || '',
      location: {
        district: farm.location?.district || '',
        municipality: farm.location?.municipality || '',
        tole: farm.location?.tole || '',
        ward: farm.location?.ward ?? '',
      },
      orchardAreaKatha: farm.orchardAreaKatha ?? '',
      totalTreeCount: farm.totalTreeCount ?? '',
      bearingTreeCount: farm.bearingTreeCount ?? '',
      soilType: farm.soilType || 'loamy',
      terrain: farm.terrain || 'flat',
      irrigationSystem: farm.irrigationSystem || 'rainfed',
      lastHarvestQuantityKg: farm.lastHarvestQuantityKg ?? '',
      lastHarvestRevenuNPR: farm.lastHarvestRevenuNPR ?? '',
    });
    setEditingId(farm._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      location: { ...form.location, ward: form.location.ward ? Number(form.location.ward) : undefined },
      orchardAreaKatha: form.orchardAreaKatha ? Number(form.orchardAreaKatha) : undefined,
      totalTreeCount: form.totalTreeCount ? Number(form.totalTreeCount) : undefined,
      bearingTreeCount: form.bearingTreeCount ? Number(form.bearingTreeCount) : undefined,
      lastHarvestQuantityKg: form.lastHarvestQuantityKg ? Number(form.lastHarvestQuantityKg) : undefined,
      lastHarvestRevenuNPR: form.lastHarvestRevenuNPR ? Number(form.lastHarvestRevenuNPR) : undefined,
    };
    try {
      if (editingId) {
        await updateFarm(editingId, payload);
      } else {
        await createFarm(payload);
      }
      setShowForm(false);
      loadFarms();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save farm.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this farm? This cannot be undone.')) return;
    try {
      await deleteFarm(id);
      loadFarms();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete farm.');
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>My Farms</h1>
          <p className="page__subtitle">Register and manage your mango orchards.</p>
        </div>
        <button className="btn btn--primary" onClick={openNewForm}>+ Add farm</button>
      </div>

      <ErrorBox message={error} />

      {showForm && (
        <form className="panel" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit farm' : 'New farm'}</h2>
          <div className="field-grid">
            <label className="field">
              <span>Farm name</span>
              <input name="farmName" value={form.farmName} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>Description</span>
              <input name="description" value={form.description} onChange={handleChange} />
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
              <span>Tole</span>
              <input name="location.tole" value={form.location.tole} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Ward</span>
              <input type="number" name="location.ward" value={form.location.ward} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Orchard area (katha)</span>
              <input type="number" step="0.01" name="orchardAreaKatha" value={form.orchardAreaKatha} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Total tree count</span>
              <input type="number" name="totalTreeCount" value={form.totalTreeCount} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Bearing tree count</span>
              <input type="number" name="bearingTreeCount" value={form.bearingTreeCount} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Soil type</span>
              <select name="soilType" value={form.soilType} onChange={handleChange}>
                <option value="loamy">Loamy</option>
                <option value="sandy">Sandy</option>
                <option value="clay">Clay</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>
            <label className="field">
              <span>Terrain</span>
              <select name="terrain" value={form.terrain} onChange={handleChange}>
                <option value="flat">Flat</option>
                <option value="sloped">Sloped</option>
                <option value="hilly">Hilly</option>
              </select>
            </label>
            <label className="field">
              <span>Irrigation</span>
              <select name="irrigationSystem" value={form.irrigationSystem} onChange={handleChange}>
                <option value="drip">Drip</option>
                <option value="flood">Flood</option>
                <option value="sprinkler">Sprinkler</option>
                <option value="rainfed">Rainfed</option>
              </select>
            </label>
            <label className="field">
              <span>Last harvest quantity (kg)</span>
              <input type="number" name="lastHarvestQuantityKg" value={form.lastHarvestQuantityKg} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Last harvest revenue (NPR)</span>
              <input type="number" name="lastHarvestRevenuNPR" value={form.lastHarvestRevenuNPR} onChange={handleChange} />
            </label>
          </div>
          <div className="panel__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save farm'}
            </button>
          </div>
        </form>
      )}

      {loading && <Loading />}
      {!loading && farms.length === 0 && <EmptyState message="No farms yet. Add your first farm to get started." />}

      {!loading && farms.length > 0 && (
        <div className="card-grid">
          {farms.map((farm) => (
            <div key={farm._id} className="card">
              <h3>{farm.farmName}</h3>
              <p className="card__meta">
                {farm.location?.municipality || 'Unknown location'}
                {farm.location?.district ? `, ${farm.location.district}` : ''}
              </p>
              <ul className="card__facts">
                <li>Area: {farm.orchardAreaKatha ?? '—'} katha</li>
                <li>Trees: {farm.totalTreeCount ?? '—'} ({farm.bearingTreeCount ?? 0} bearing)</li>
                <li>Soil: {farm.soilType}</li>
                <li>Irrigation: {farm.irrigationSystem}</li>
              </ul>
              <div className="card__actions">
                <button className="btn btn--ghost" onClick={() => openEditForm(farm)}>Edit</button>
                <button className="btn btn--danger" onClick={() => handleDelete(farm._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}