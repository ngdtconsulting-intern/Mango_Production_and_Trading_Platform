import React, { useEffect, useState } from 'react';
import { getAnalyticsReport, getDashboardStats, getUserManagement, toggleUserStatus } from '../api/admin';
import { Loading, ErrorBox, EmptyState } from '../components/Status';

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [recentSurveys, setRecentSurveys] = useState([]);
  const [report, setReport] = useState(null);
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, reportRes, usersRes] = await Promise.all([
        getDashboardStats(),
        getAnalyticsReport(),
        getUserManagement(roleFilter ? { role: roleFilter } : {}),
      ]);
      setStats(dashRes.data.stats);
      setRecentSurveys(dashRes.data.recentSurveys);
      setReport(reportRes.data);
      setUsers(usersRes.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = async (id) => {
    try {
      await toggleUserStatus(id);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update user status.');
    }
  };

  if (loading) return <div className="page"><Loading label="Loading admin panel..." /></div>;

  return (
    <div className="page">
      <h1>Admin Panel</h1>
      <p className="page__subtitle">Platform-wide stats, reports, and user management.</p>

      <ErrorBox message={error} />

      {stats && (
        <div className="stat-grid">
          <StatCard label="Total users" value={stats.totalUsers} />
          <StatCard label="Farmers" value={stats.totalFarmers} />
          <StatCard label="Traders" value={stats.totalTraders} />
          <StatCard label="Total surveys" value={stats.totalSurveys} />
          <StatCard label="Verified surveys" value={stats.completedSurveys} />
          <StatCard label="Open requirements" value={stats.totalBuyingRequirements} />
        </div>
      )}

      {report && (
        <div className="panel">
          <h2>Aggregate report</h2>
          <div className="field-grid">
            <div><strong>Avg production:</strong> {round(report.surveyStats?.avgProduction)} kg</div>
            <div><strong>Avg earnings:</strong> NPR {round(report.surveyStats?.avgEarnings)}</div>
            <div><strong>Avg satisfaction:</strong> {round(report.surveyStats?.avgSatisfaction)}/10</div>
          </div>
          {report.priceStats?.length > 0 && (
            <table className="table">
              <thead><tr><th>Market</th><th>Avg wholesale (NPR/kg)</th><th>Avg retail (NPR/kg)</th></tr></thead>
              <tbody>
                {report.priceStats.map((p) => (
                  <tr key={p._id}>
                    <td>{p._id}</td>
                    <td>{round(p.avgWholesale)}</td>
                    <td>{round(p.avgRetail)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {recentSurveys?.length > 0 && (
        <div className="panel">
          <h2>Recent surveys</h2>
          <table className="table">
            <thead><tr><th>Farmer</th><th>Production (kg)</th><th>Status</th></tr></thead>
            <tbody>
              {recentSurveys.map((s) => (
                <tr key={s._id}>
                  <td>{s.farmerId?.name || s.farmerName}</td>
                  <td>{s.totalProductionKg ?? '—'}</td>
                  <td><span className={`tag tag--${s.status}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel">
        <div className="page__header">
          <h2>User management</h2>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            <option value="farmer">Farmer</option>
            <option value="trader">Trader</option>
            <option value="surveyor">Surveyor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {users.length === 0 && <EmptyState message="No users found." />}

        {users.length > 0 && (
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td><span className={`tag ${u.active ? 'tag--verified' : 'tag--rejected'}`}>{u.active ? 'active' : 'inactive'}</span></td>
                  <td>
                    <button className="btn btn--ghost btn--sm" onClick={() => handleToggle(u._id)}>
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function round(n) {
  return typeof n === 'number' ? Math.round(n * 100) / 100 : '—';
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-card__value">{value ?? '—'}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  );
}