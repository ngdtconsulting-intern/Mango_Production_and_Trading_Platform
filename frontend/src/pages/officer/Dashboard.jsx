import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiClipboard, FiSun, FiPackage, FiFlag } from 'react-icons/fi';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import StatusBadge from '../../components/StatusBadge';
import { getProvinces, getDistricts, getMunicipalities } from '../../utils/nepalLocations';
import '../../styles/dashboard.css';
import '../../styles/directory.css';

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [pendingCount, setPendingCount] = useState(0);
  const [openReportCount, setOpenReportCount] = useState(0);

  const [profileCounts, setProfileCounts] = useState({ farmer: 0, trader: 0 });
  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profileFilters, setProfileFilters] = useState({
    role: 'farmer',
    province: '',
    district: '',
    municipality: '',
  });

  const [selectedProfile, setSelectedProfile] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [profileFilters]);

  const fetchInitial = async () => {
    try {
      const [pendingRes, farmerCountRes, traderCountRes, reportsRes] = await Promise.all([
        api.get('/surveys', { params: { status: 'submitted', limit: 1 } }),
        api.get('/admin/users', { params: { role: 'farmer', limit: 1 } }),
        api.get('/admin/users', { params: { role: 'trader', limit: 1 } }),
        api.get('/reports', { params: { status: 'open', limit: 1 } }),
      ]);
      setPendingCount(pendingRes.data.total);
      setProfileCounts({ farmer: farmerCountRes.data.total, trader: traderCountRes.data.total });
      setOpenReportCount(reportsRes.data.total);
    } catch (error) {
      console.error('Error fetching officer data:', error);
      toast.error('Failed to load officer data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    setProfilesLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { ...profileFilters, limit: 20 } });
      setProfiles(data.users);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setProfilesLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...profileFilters, [name]: value };
    if (name === 'province') {
      updated.district = '';
      updated.municipality = '';
    } else if (name === 'district') {
      updated.municipality = '';
    }
    setProfileFilters(updated);
  };

  const viewProfileDetails = async (userId) => {
    setDetailsLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${userId}`);
      setSelectedProfile(data);
    } catch (error) {
      toast.error('Failed to load profile details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeProfile = () => setSelectedProfile(null);

  if (loading) return <div className="dashboard-container">Loading...</div>;

  return (
    <div className="dashboard-container">
      <PageBanner
        variant="admin"
        eyebrow="Officer dashboard"
        title="Officer Dashboard"
        subtitle="Browse farmer and trader profiles in your coverage area. Survey verification, reports, and market prices are in the sidebar."
      />

      <div className="stats-grid">
        <div className="stat-card gold stat-card--clickable" onClick={() => navigate('/officer/surveys')}>
          <div className="stat-card-icon"><FiClipboard /></div>
          <p className="stat-label">Pending Surveys</p>
          <p className="stat-value">{pendingCount}</p>
        </div>
        <div className="stat-card green">
          <div className="stat-card-icon"><FiSun /></div>
          <p className="stat-label">Farmers</p>
          <p className="stat-value">{profileCounts.farmer}</p>
        </div>
        <div className="stat-card blue">
          <div className="stat-card-icon"><FiPackage /></div>
          <p className="stat-label">Traders</p>
          <p className="stat-value">{profileCounts.trader}</p>
        </div>
        <div className="stat-card stat-card--clickable" onClick={() => navigate('/officer/reports')}>
          <div className="stat-card-icon"><FiFlag /></div>
          <p className="stat-label">Open Reports</p>
          <p className="stat-value">{openReportCount}</p>
        </div>
      </div>

      <h2>Farmer &amp; Trader Profiles</h2>

      <div className="filters-section">
        <div className="filter-group">
          <label>Role</label>
          <select name="role" value={profileFilters.role} onChange={handleFilterChange}>
            <option value="farmer">Farmer</option>
            <option value="trader">Trader</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Province</label>
          <select name="province" value={profileFilters.province} onChange={handleFilterChange}>
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
            value={profileFilters.district}
            onChange={handleFilterChange}
            disabled={!profileFilters.province}
          >
            <option value="">All districts</option>
            {getDistricts(profileFilters.province).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Municipality</label>
          <select
            name="municipality"
            value={profileFilters.municipality}
            onChange={handleFilterChange}
            disabled={!profileFilters.district}
          >
            <option value="">All municipalities</option>
            {getMunicipalities(profileFilters.province, profileFilters.district).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {profilesLoading ? (
        <p className="loading">Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <p className="empty-message">No {profileFilters.role}s found for this location.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Location</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.email}</td>
                  <td>{p.phone}</td>
                  <td>
                    {p.address?.district || p.address?.municipality
                      ? `${p.address?.district || 'N/A'}, ${p.address?.municipality || 'N/A'}${p.address?.ward ? ` - ${p.address.ward}` : ''}`
                      : 'N/A'}
                  </td>
                  <td className="admin-table-actions">
                    <button className="btn-toggle" onClick={() => viewProfileDetails(p._id)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Profile details modal (read-only) */}
      {detailsLoading && (
        <div className="modal-overlay">
          <div className="modal-content">Loading details...</div>
        </div>
      )}

      {selectedProfile && !detailsLoading && (
        <div className="modal-overlay" onClick={closeProfile}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProfile.user.name}</h2>
              <button className="close-btn" onClick={closeProfile}>×</button>
            </div>

            <div className="detail-section">
              <p><strong>Email:</strong> {selectedProfile.user.email}</p>
              <p><strong>Phone:</strong> {selectedProfile.user.phone}</p>
              <p><strong>Role:</strong> {selectedProfile.user.role}</p>
              <p>
                <strong>Location:</strong>{' '}
                {selectedProfile.user.address?.district || selectedProfile.user.address?.municipality
                  ? `${selectedProfile.user.address?.district || 'N/A'}, ${selectedProfile.user.address?.municipality || 'N/A'}${selectedProfile.user.address?.ward ? ` - ${selectedProfile.user.address.ward}` : ''}`
                  : 'N/A'}
              </p>
              <p><strong>Joined:</strong> {new Date(selectedProfile.user.createdAt).toLocaleDateString()}</p>
            </div>

            {selectedProfile.user.role === 'farmer' && (
              <>
                <h3 className="detail-heading">Farms ({selectedProfile.details.farms?.length || 0})</h3>
                {(!selectedProfile.details.farms || selectedProfile.details.farms.length === 0) ? (
                  <p className="empty-message-small">No farms registered.</p>
                ) : (
                  selectedProfile.details.farms.map((farm) => (
                    <div key={farm._id} className="detail-item">
                      <strong>{farm.farmName}</strong>
                      <span>{farm.orchardAreaKatha} katha • {farm.totalTreeCount || 0} trees</span>
                    </div>
                  ))
                )}

                <h3 className="detail-heading">Surveys ({selectedProfile.details.surveys?.length || 0})</h3>
                {(!selectedProfile.details.surveys || selectedProfile.details.surveys.length === 0) ? (
                  <p className="empty-message-small">No surveys submitted.</p>
                ) : (
                  selectedProfile.details.surveys.map((survey) => (
                    <div key={survey._id} className="detail-item">
                      <div className="detail-item-header">
                        <strong>
                          {survey.municipality || survey.district
                            ? `${survey.municipality || 'N/A'}, ${survey.district || 'N/A'}`
                            : 'Location not recorded'}
                        </strong>
                        <StatusBadge status={survey.status} />
                      </div>
                      <span>{survey.totalMangoTrees} trees • {survey.totalProductionKg} kg produced</span>
                      <span>Satisfaction: {survey.satisfactionLevel}/10</span>
                      <span>Submitted: {new Date(survey.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </>
            )}

            {selectedProfile.user.role === 'trader' && (
              <>
                <h3 className="detail-heading">Buying Requirements ({selectedProfile.details.requirements?.length || 0})</h3>
                {(!selectedProfile.details.requirements || selectedProfile.details.requirements.length === 0) ? (
                  <p className="empty-message-small">No buying requirements posted.</p>
                ) : (
                  selectedProfile.details.requirements.map((req) => (
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
