import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createSurvey, deleteSurvey, getSurveys, updateSurvey, verifySurvey } from '../api/surveys';
import { Loading, ErrorBox, EmptyState } from '../components/Status';

const emptyForm = {
  farmerName: '',
  phone: '',
  age: '',
  educationLevel: '',
  wardNumber: '',
  tole: '',
  householdMembers: '',
  orchardAreaKatha: '',
  totalMangoTrees: '',
  selfManaged: true,
  productionCostNPR: '',
  totalProductionKg: '',
  totalEarnings2082: '',
  totalEarnings2081: '',
  satisfactionLevel: 5,
  productionChallenges: '',
  marketingChallenges: '',
  suggestions: '',
};

export default function Surveys() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadSurveys = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getSurveys({ limit: 50 });
      setSurveys(data.surveys);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load surveys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSurveys(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const openNewForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (survey) => {
    setForm({
      farmerName: survey.farmerName || '',
      phone: survey.phone || '',
      age: survey.age ?? '',
      educationLevel: survey.educationLevel || '',
      wardNumber: survey.wardNumber ?? '',
      tole: survey.tole || '',
      householdMembers: survey.householdMembers ?? '',
      orchardAreaKatha: survey.orchardAreaKatha ?? '',
      totalMangoTrees: survey.totalMangoTrees ?? '',
      selfManaged: !!survey.selfManaged,
      productionCostNPR: survey.productionCostNPR ?? '',
      totalProductionKg: survey.totalProductionKg ?? '',
      totalEarnings2082: survey.totalEarnings2082 ?? '',
      totalEarnings2081: survey.totalEarnings2081 ?? '',
      satisfactionLevel: survey.satisfactionLevel ?? 5,
      productionChallenges: survey.productionChallenges || '',
      marketingChallenges: survey.marketingChallenges || '',
      suggestions: survey.suggestions || '',
    });
    setEditingId(survey._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const numFields = [
      'age', 'wardNumber', 'householdMembers', 'orchardAreaKatha', 'totalMangoTrees',
      'productionCostNPR', 'totalProductionKg', 'totalEarnings2082', 'totalEarnings2081', 'satisfactionLevel',
    ];
    const payload = { ...form };
    numFields.forEach((f) => {
      payload[f] = payload[f] === '' ? undefined : Number(payload[f]);
    });
    try {
      if (editingId) {
        await updateSurvey(editingId, payload);
      } else {
        await createSurvey(payload);
      }
      setShowForm(false);
      loadSurveys();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save survey.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this survey?')) return;
    try {
      await deleteSurvey(id);
      loadSurveys();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete survey.');
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await verifySurvey(id, { status });
      loadSurveys();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update verification status.');
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Surveys</h1>
          <p className="page__subtitle">Household and orchard survey records.</p>
        </div>
        <button className="btn btn--primary" onClick={openNewForm}>+ New survey</button>
      </div>

      <ErrorBox message={error} />

      {showForm && (
        <form className="panel" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit survey' : 'New survey'}</h2>
          <div className="field-grid">
            <label className="field">
              <span>Farmer name</span>
              <input name="farmerName" value={form.farmerName} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>Phone</span>
              <input name="phone" value={form.phone} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>Age</span>
              <input type="number" name="age" value={form.age} onChange={handleChange} min="18" max="100" required />
            </label>
            <label className="field">
              <span>Education level</span>
              <input name="educationLevel" value={form.educationLevel} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>Ward number</span>
              <input type="number" name="wardNumber" value={form.wardNumber} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>Tole</span>
              <input name="tole" value={form.tole} onChange={handleChange} required />
            </label>
            <label className="field">
              <span>Household members</span>
              <input type="number" name="householdMembers" value={form.householdMembers} onChange={handleChange} min="1" required />
            </label>
            <label className="field">
              <span>Orchard area (katha)</span>
              <input type="number" step="0.01" name="orchardAreaKatha" value={form.orchardAreaKatha} onChange={handleChange} min="0.1" required />
            </label>
            <label className="field">
              <span>Total mango trees</span>
              <input type="number" name="totalMangoTrees" value={form.totalMangoTrees} onChange={handleChange} min="1" required />
            </label>
            <label className="field field--checkbox">
              <input type="checkbox" name="selfManaged" checked={form.selfManaged} onChange={handleChange} />
              <span>Self-managed orchard</span>
            </label>
            <label className="field">
              <span>Production cost (NPR)</span>
              <input type="number" name="productionCostNPR" value={form.productionCostNPR} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Total production (kg)</span>
              <input type="number" name="totalProductionKg" value={form.totalProductionKg} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Earnings this year (NPR)</span>
              <input type="number" name="totalEarnings2082" value={form.totalEarnings2082} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Earnings last year (NPR)</span>
              <input type="number" name="totalEarnings2081" value={form.totalEarnings2081} onChange={handleChange} />
            </label>
            <label className="field">
              <span>Satisfaction (0–10)</span>
              <input type="number" name="satisfactionLevel" value={form.satisfactionLevel} onChange={handleChange} min="0" max="10" required />
            </label>
          </div>

          <label className="field field--full">
            <span>Production challenges</span>
            <textarea name="productionChallenges" value={form.productionChallenges} onChange={handleChange} rows={2} />
          </label>
          <label className="field field--full">
            <span>Marketing challenges</span>
            <textarea name="marketingChallenges" value={form.marketingChallenges} onChange={handleChange} rows={2} />
          </label>
          <label className="field field--full">
            <span>Suggestions</span>
            <textarea name="suggestions" value={form.suggestions} onChange={handleChange} rows={2} />
          </label>

          <div className="panel__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save survey'}
            </button>
          </div>
        </form>
      )}

      {loading && <Loading />}
      {!loading && surveys.length === 0 && <EmptyState message="No surveys yet." />}

      {!loading && surveys.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Farmer</th>
              <th>Ward / Tole</th>
              <th>Trees</th>
              <th>Production (kg)</th>
              <th>Satisfaction</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {surveys.map((s) => (
              <tr key={s._id}>
                <td>{s.farmerName}</td>
                <td>{s.wardNumber} / {s.tole}</td>
                <td>{s.totalMangoTrees}</td>
                <td>{s.totalProductionKg ?? '—'}</td>
                <td>{s.satisfactionLevel}/10</td>
                <td><span className={`tag tag--${s.status}`}>{s.status}</span></td>
                <td className="table__actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => openEditForm(s)}>Edit</button>
                  <button className="btn btn--danger btn--sm" onClick={() => handleDelete(s._id)}>Delete</button>
                  {user.role === 'admin' && s.status !== 'verified' && (
                    <button className="btn btn--sm btn--primary" onClick={() => handleVerify(s._id, 'verified')}>Verify</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}