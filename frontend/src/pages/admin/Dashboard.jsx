import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiUsers, FiSun, FiPackage, FiShield, FiClipboard, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import StatusBadge from '../../components/StatusBadge';
import { getProvinces, getDistricts, getMunicipalities } from '../../utils/nepalLocations';
import '../../styles/dashboard.css';
import '../../styles/directory.css';

const ROLE_LABELS = { farmer: 'Farmers', trader: 'Traders', surveyor: 'Surveyors' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [selectedRole, setSelectedRole] = useState('farmer');
  const [locationFilters, setLocationFilters] = useState({ province: '', district: '', municipality: '' });

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [selectedRole, locationFilters]);

  const fetchInitial = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data.stats);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users', { params: { role: selectedRole, ...locationFilters, limit: 20 } });
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...locationFilters, [name]: value };
    if (name === 'province') {
      updated.district = '';
      updated.municipality = '';
    } else if (name === 'district') {
      updated.municipality = '';
    }
    setLocationFilters(updated);
  };

  const handleToggleUser = async (userId) => {
    try {
      const { data } = await api.patch(`/admin/users/${userId}/toggle`);
      setUsers((prev) => prev.map((u) => (u._id === userId ? data.user : u)));
      toast.success(data.user.active ? 'User activated' : 'User deactivated');
      fetchStats();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const viewUserDetails = async (userId) => {
    setDetailsLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${userId}`);
      setSelectedUser(data);
    } catch (error) {
      toast.error('Failed to load user details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => setSelectedUser(null);

  if (loading) return <div className="dashboard-container">Loading...</div>;

  return (
    <div className="dashboard-container">
      <PageBanner
        variant="admin"
        eyebrow="Admin dashboard"
        title="Admin Dashboard"
        subtitle="Monitor platform-wide production and pricing, and manage user accounts."
      />

      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-card-icon"><FiUsers /></div>
          <p className="stat-label">Total Users</p>
          <p className="stat-value">{stats?.totalUsers ?? 0}</p>
        </div>
        <div
          className={`stat-card gold stat-card--clickable ${selectedRole === 'farmer' ? 'stat-card--active' : ''}`}
          onClick={() => setSelectedRole('farmer')}
        >
          <div className="stat-card-icon"><FiSun /></div>
          <p className="stat-label">Farmers</p>
          <p className="stat-value">{stats?.totalFarmers ?? 0}</p>
        </div>
        <div
          className={`stat-card blue stat-card--clickable ${selectedRole === 'trader' ? 'stat-card--active' : ''}`}
          onClick={() => setSelectedRole('trader')}
        >
          <div className="stat-card-icon"><FiPackage /></div>
          <p className="stat-label">Traders</p>
          <p className="stat-value">{stats?.totalTraders ?? 0}</p>
        </div>
        <div
          className={`stat-card purple stat-card--clickable ${selectedRole === 'surveyor' ? 'stat-card--active' : ''}`}
          onClick={() => setSelectedRole('surveyor')}
        >
          <div className="stat-card-icon"><FiShield /></div>
          <p className="stat-label">Surveyors</p>
          <p className="stat-value">{stats?.totalSurveyors ?? 0}</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon"><FiClipboard /></div>
          <p className="stat-label">Total Surveys</p>
          <p className="stat-value">{stats?.totalSurveys ?? 0}</p>
        </div>
        <div className="stat-card green">
          <div className="stat-card-icon"><FiCheckCircle /></div>
          <p className="stat-label">Verified Surveys</p>
          <p className="stat-value">{stats?.completedSurveys ?? 0}</p>
        </div>
      </div>

      <div className="dashboard-section-head">
        <h2>User Management: {ROLE_LABELS[selectedRole]}</h2>
      </div>
      <p className="empty-message-small">Click a Farmers, Traders, or Surveyors card above to switch which list is shown.</p>

      <div className="filters-section">
        <div className="filter-group">
          <label>Province</label>
          <select name="province" value={locationFilters.province} onChange={handleFilterChange}>
            <option value="">All provinces</option>
            {getProvinces().map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>District</label>
          <select
            name="district"
            value={locationFilters.district}
            onChange={handleFilterChange}
            disabled={!locationFilters.province}
          >
            <option value="">All districts</option>
            {getDistricts(locationFilters.province).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Municipality</label>
          <select
            name="municipality"
            value={locationFilters.municipality}
            onChange={handleFilterChange}
            disabled={!locationFilters.district}
          >
            <option value="">All municipalities</option>
            {getMunicipalities(locationFilters.province, locationFilters.district).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>{selectedRole === 'surveyor' ? 'Coverage Area' : 'Location'}</th>
              {selectedRole === 'farmer' && <th>Survey</th>}
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={6} className="empty-message-small">No {ROLE_LABELS[selectedRole].toLowerCase()} found for this location.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    {u.role === 'surveyor'
                      ? u.coverageArea?.district || u.coverageArea?.municipality
                        ? `${u.coverageArea?.district || 'N/A'}, ${u.coverageArea?.municipality || 'N/A'}`
                        : 'N/A'
                      : u.address?.district || u.address?.municipality
                        ? `${u.address?.district || 'N/A'}, ${u.address?.municipality || 'N/A'}${u.address?.ward ? ` - ${u.address.ward}` : ''}`
                        : 'N/A'}
                  </td>
                  {selectedRole === 'farmer' && <td>{u.surveyStatus || 'none'}</td>}
                  <td>{u.active ? 'Active' : 'Inactive'}</td>
                  <td className="admin-table-actions">
                    <button className="btn-toggle" onClick={() => viewUserDetails(u._id)}>
                      View Details
                    </button>
                    <button className="btn-toggle" onClick={() => handleToggleUser(u._id)}>
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User details modal */}
      {detailsLoading && (
        <div className="modal-overlay">
          <div className="modal-content">Loading details...</div>
        </div>
      )}

      {selectedUser && !detailsLoading && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedUser.user.name}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <div className="detail-section">
              <p><strong>Email:</strong> {selectedUser.user.email}</p>
              <p><strong>Phone:</strong> {selectedUser.user.phone}</p>
              <p><strong>Role:</strong> {selectedUser.user.role}</p>
              {selectedUser.user.role === 'surveyor' && (
                <p>
                  <strong>Coverage Area:</strong>{' '}
                  {[selectedUser.user.coverageArea?.municipality, selectedUser.user.coverageArea?.district, selectedUser.user.coverageArea?.province]
                    .filter(Boolean).join(', ') || 'Not assigned'}
                </p>
              )}
              <p><strong>Status:</strong> {selectedUser.user.active ? 'Active' : 'Inactive'}</p>
              <p><strong>Joined:</strong> {new Date(selectedUser.user.createdAt).toLocaleDateString()}</p>
            </div>

            {selectedUser.user.role === 'farmer' && (
              <>
                <h3 className="detail-heading">Farms ({selectedUser.details.farms?.length || 0})</h3>
                {(!selectedUser.details.farms || selectedUser.details.farms.length === 0) ? (
                  <p className="empty-message-small">No farms registered.</p>
                ) : (
                  selectedUser.details.farms.map((farm) => (
                    <div key={farm._id} className="detail-item">
                      <strong>{farm.farmName}</strong>
                      <span>{farm.orchardAreaKatha} katha • {farm.totalTreeCount || 0} trees</span>
                    </div>
                  ))
                )}

                <h3 className="detail-heading">Surveys ({selectedUser.details.surveys?.length || 0})</h3>
                {(!selectedUser.details.surveys || selectedUser.details.surveys.length === 0) ? (
                  <p className="empty-message-small">No surveys submitted.</p>
                ) : (
                  selectedUser.details.surveys.map((survey) => (
                    <div key={survey._id} className="detail-item">
                      <div className="detail-item-header">
                        <strong>
                          {survey.municipality || survey.district
                            ? `${survey.municipality || 'N/A'}, ${survey.district || 'N/A'}`
                            : 'Location not recorded'}
                        </strong>
                        <StatusBadge status={survey.status} />
                      </div>
                      <span>
                        {survey.surveyYearBS} BS • {survey.totalMangoTrees} trees •{' '}
                        {survey.totalProductionKg} kg produced
                        {survey.expectedProductionKg > 0 &&
                          ` (expected ${survey.expectedProductionKg} kg)`}
                      </span>
                      <span>Satisfaction: {survey.satisfactionLevel}/10</span>
                      <span>Submitted: {new Date(survey.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </>
            )}

            {selectedUser.user.role === 'trader' && (
              <>
                <h3 className="detail-heading">Buying Requirements ({selectedUser.details.requirements?.length || 0})</h3>
                {(!selectedUser.details.requirements || selectedUser.details.requirements.length === 0) ? (
                  <p className="empty-message-small">No buying requirements posted.</p>
                ) : (
                  selectedUser.details.requirements.map((req) => (
                    <div key={req._id} className="detail-item">
                      <div className="detail-item-header">
                        <strong>{req.variety}</strong>
                        <StatusBadge status={req.status} />
                      </div>
                      <span>{req.quantityMT} MT • Rs. {req.budget?.minPricePerKg}-{req.budget?.maxPricePerKg}/kg</span>
                      <span>{req.responses?.length || 0} response(s)</span>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}