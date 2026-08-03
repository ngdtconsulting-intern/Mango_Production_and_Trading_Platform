import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import '../../styles/dashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingSurveys, setPendingSurveys] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [reviewingSurvey, setReviewingSurvey] = useState(null);

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
      setReviewingSurvey(null);
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
  const closeReview = () => setReviewingSurvey(null);

  if (loading) return <div className="dashboard-container">Loading...</div>;

  return (
    <div className="dashboard-container">
      <PageBanner
        variant="admin"
        eyebrow="⚙️ Admin dashboard"
        title="Admin Dashboard"
        subtitle="Verify farmer surveys, monitor platform-wide production and pricing, and manage user accounts."
      />

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
<span>
  {survey.municipality || survey.district || survey.province
    ? `${survey.municipality || '—'}, ${survey.district || '—'}, ${survey.province || '—'}`
    : 'Location not recorded'}
</span>                <span>{survey.tole}, Ward {survey.wardNumber}</span>
              </div>
              <div className="admin-card-actions">
                <button className="btn-toggle" onClick={() => setReviewingSurvey(survey)}>
                  Review Details
                </button>
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
              <th>Location</th>
              <th>Survey</th>
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
                <td>
                  {u.role === 'farmer' && u.location
                    ? `${u.location.municipality}, ${u.location.district}`
                    : '—'}
                </td>
                <td>{u.role === 'farmer' ? (u.surveyStatus || 'none') : '—'}</td>
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Full survey review modal */}
      {reviewingSurvey && (
        <div className="modal-overlay" onClick={closeReview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{reviewingSurvey.farmerName}'s Survey</h2>
              <button className="close-btn" onClick={closeReview}>×</button>
            </div>

            <h3 className="detail-heading">Personal Details</h3>
            <div className="detail-grid">
              <div><span className="detail-label">Phone</span><span>{reviewingSurvey.phone}</span></div>
              <div><span className="detail-label">Age</span><span>{reviewingSurvey.age}</span></div>
              <div><span className="detail-label">Education</span><span>{reviewingSurvey.educationLevel}</span></div>
              <div><span className="detail-label">Household Members</span><span>{reviewingSurvey.householdMembers}</span></div>
            </div>

            <h3 className="detail-heading">Address</h3>
            <div className="detail-grid">
              <div><span className="detail-label">Province</span><span>{reviewingSurvey.province}</span></div>
              <div><span className="detail-label">District</span><span>{reviewingSurvey.district}</span></div>
              <div><span className="detail-label">Municipality</span><span>{reviewingSurvey.municipality}</span></div>
              <div><span className="detail-label">Ward</span><span>{reviewingSurvey.wardNumber}</span></div>
              <div><span className="detail-label">Tole</span><span>{reviewingSurvey.tole}</span></div>
            </div>

            <h3 className="detail-heading">Orchard</h3>
            <div className="detail-grid">
              <div><span className="detail-label">Area</span><span>{reviewingSurvey.orchardAreaKatha} katha ({reviewingSurvey.orchardAreaHectare} ha)</span></div>
              <div><span className="detail-label">Total Trees</span><span>{reviewingSurvey.totalMangoTrees}</span></div>
              <div><span className="detail-label">Self-Managed</span><span>{reviewingSurvey.selfManaged ? 'Yes' : 'No'}</span></div>
              <div><span className="detail-label">Production Cost</span><span>Rs. {reviewingSurvey.productionCostNPR || 'N/A'}</span></div>
            </div>

            {reviewingSurvey.treeAgeDistribution?.length > 0 && (
              <>
                <h3 className="detail-heading">Tree Age Distribution</h3>
                <div className="tree-age-tags">
                  {reviewingSurvey.treeAgeDistribution.map((t, i) => (
                    <span key={i} className="tree-age-tag">{t.ageRange}: {t.numberOfTrees}</span>
                  ))}
                </div>
              </>
            )}

            <h3 className="detail-heading">Production & Earnings</h3>
            <div className="detail-grid">
              <div><span className="detail-label">Total Production</span><span>{reviewingSurvey.totalProductionKg} kg</span></div>
              <div><span className="detail-label">Earnings (2082)</span><span>Rs. {reviewingSurvey.totalEarnings2082}</span></div>
              <div><span className="detail-label">Earnings (2081)</span><span>Rs. {reviewingSurvey.totalEarnings2081}</span></div>
              <div><span className="detail-label">Growth</span><span>{reviewingSurvey.earningsGrowth ?? 'N/A'}%</span></div>
              <div><span className="detail-label">Satisfaction</span><span>{reviewingSurvey.satisfactionLevel}/10</span></div>
            </div>

            <h3 className="detail-heading">Assistance Received</h3>
            <div className="detail-grid">
              <div>
                <span className="detail-label">Government</span>
                <span>{reviewingSurvey.receivedGovernmentAssistance ? (reviewingSurvey.governmentOfficeSource || 'Yes') : 'None'}</span>
              </div>
              <div>
                <span className="detail-label">NGO / Other</span>
                <span>{reviewingSurvey.receivedNonGovernmentAssistance ? (reviewingSurvey.nonGovernmentSource || 'Yes') : 'None'}</span>
              </div>
            </div>

            {(reviewingSurvey.productionChallenges || reviewingSurvey.marketingChallenges || reviewingSurvey.suggestions) && (
              <>
                <h3 className="detail-heading">Challenges & Suggestions</h3>
                {reviewingSurvey.productionChallenges && (
                  <p className="detail-note"><strong>Production:</strong> {reviewingSurvey.productionChallenges}</p>
                )}
                {reviewingSurvey.marketingChallenges && (
                  <p className="detail-note"><strong>Marketing:</strong> {reviewingSurvey.marketingChallenges}</p>
                )}
                {reviewingSurvey.suggestions && (
                  <p className="detail-note"><strong>Suggestions:</strong> {reviewingSurvey.suggestions}</p>
                )}
              </>
            )}

            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button className="btn-submit" onClick={() => handleVerify(reviewingSurvey._id, 'verified')}>
                Approve
              </button>
              <button className="btn-cancel" onClick={() => handleVerify(reviewingSurvey._id, 'rejected')}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

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
    ? `${survey.municipality || '—'}, ${survey.district || '—'}`
    : 'Location not recorded'}
</strong>                        <span className={`status-badge ${survey.status}`}>{survey.status}</span>
                      </div>
                      <span>{survey.totalMangoTrees} trees • {survey.totalProductionKg} kg produced</span>
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
                        <span className={`status-badge ${req.status}`}>{req.status}</span>
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