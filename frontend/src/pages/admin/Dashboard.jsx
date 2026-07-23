import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import '../../styles/dashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingSurveys, setPendingSurveys] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [dashboardRes, pendingRes, usersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/surveys', { params: { status: 'submitted', limit: 20 } }),
        api.get('/admin/users', { params: { limit: 20 } }),
      ]);
      setStats(dashboardRes.data.stats);
      setPendingSurveys(pendingRes.data.surveys);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (surveyId, status) => {
    let verificationNotes = '';
    if (status === 'rejected') {
      verificationNotes = window.prompt('Reason for rejection (optional):') || '';
    }
    try {
      await api.patch(`/surveys/${surveyId}/verify`, { status, verificationNotes });
      toast.success(`Survey ${status}`);
      setPendingSurveys((prev) => prev.filter((s) => s._id !== surveyId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update survey');
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      const { data } = await api.patch(`/admin/users/${userId}/toggle`);
      setUsers((prev) => prev.map((u) => (u._id === userId ? data.user : u)));
      toast.success(data.user.active ? 'User activated' : 'User deactivated');
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  if (loading) return <div className="dashboard-container">Loading...</div>;

  return (
    <div className="dashboard-container">
      <h1>Admin Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card green">
          <p className="stat-label">Total Users</p>
          <p className="stat-value">{stats?.totalUsers ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Farmers</p>
          <p className="stat-value">{stats?.totalFarmers ?? 0}</p>
        </div>
        <div className="stat-card blue">
          <p className="stat-label">Traders</p>
          <p className="stat-value">{stats?.totalTraders ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Surveys</p>
          <p className="stat-value">{stats?.totalSurveys ?? 0}</p>
        </div>
        <div className="stat-card green">
          <p className="stat-label">Verified Surveys</p>
          <p className="stat-value">{stats?.completedSurveys ?? 0}</p>
        </div>
        <div className="stat-card purple">
          <p className="stat-label">Open Buying Requirements</p>
          <p className="stat-value">{stats?.totalBuyingRequirements ?? 0}</p>
        </div>
      </div>

      <h2>Pending Survey Verifications ({pendingSurveys.length})</h2>
      {pendingSurveys.length === 0 ? (
        <p>No surveys awaiting review.</p>
      ) : (
        <div className="admin-list">
          {pendingSurveys.map((survey) => (
            <div key={survey._id} className="admin-card">
              <div className="admin-card-info">
                <strong>{survey.farmerName}</strong>
                <span>{survey.tole}, Ward {survey.wardNumber}</span>
                <span>{survey.totalMangoTrees} trees Ā· {survey.orchardAreaKatha} katha</span>
              </div>
              <div className="admin-card-actions">
                <button className="btn-approve" onClick={() => handleVerify(survey._id, 'verified')}>
                  Approve
                </button>
                <button className="btn-reject" onClick={() => handleVerify(survey._id, 'rejected')}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2>User Management</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.active ? 'Active' : 'Inactive'}</td>
                <td>
                  <button className="btn-toggle" onClick={() => handleToggleUser(u._id)}>
                    {u.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}