import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import PageBanner from '../../components/PageBanner';
import '../../styles/trader-dashboard.css';

export default function TraderDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [myRequirements, setMyRequirements] = useState([]);
  const [recentRequirements, setRecentRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const myReqsResponse = await api.get('/traders/requirements/my-requirements', {
        params: { limit: 5 },
      });

      const allReqsResponse = await api.get('/traders/requirements', {
        params: { status: 'open', limit: 5 },
      });

      setStats({
        totalRequirements: myReqsResponse.data.total,
        openRequirements: myReqsResponse.data.requirements.filter((r) => r.status === 'open').length,
        inProgressRequirements: myReqsResponse.data.requirements.filter((r) => r.status === 'in-progress').length,
        completedRequirements: myReqsResponse.data.requirements.filter((r) => r.status === 'completed').length,
      });

      setMyRequirements(myReqsResponse.data.requirements);
      setRecentRequirements(allReqsResponse.data.requirements);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard-container">Loading...</div>;

  return (
    <div className="dashboard-container">
      <PageBanner
        variant="trader"
        eyebrow="📦 Trader dashboard"
        title="Trader Dashboard"
        subtitle="Post buying requirements and connect directly with farmers — no middleman."
      >
        <button className="btn-primary" onClick={() => navigate('/trader/requirements/create')}>
          + New Buying Requirement
        </button>
      </PageBanner>

      <div className="stats-grid">
        <StatCard label="Total Requirements" value={stats.totalRequirements} icon="📦" />
        <StatCard label="Open" value={stats.openRequirements} color="green" icon="🟢" />
        <StatCard label="In Progress" value={stats.inProgressRequirements} color="blue" icon="⏳" />
        <StatCard label="Completed" value={stats.completedRequirements} color="purple" icon="✅" />
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-head">
          <h2>Your Requirements</h2>
        </div>
        {myRequirements.length === 0 ? (
          <p className="empty-message-small">You haven't posted any buying requirements yet.</p>
        ) : (
          <div className="requirements-list">
            {myRequirements.map((req) => (
              <div
                key={req._id}
                className="requirement-item"
                onClick={() => navigate(`/trader/requirements/${req._id}`)}
              >
                <h4>{req.variety} — {req.status === 'in-progress' ? 'Accepted' : req.status.charAt(0).toUpperCase() + req.status.slice(1)}</h4>
                <p>{req.quantityMT} MT • {req.responseCount || 0} response(s)</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-head">
          <h2>Recent Market Opportunities</h2>
        </div>
        <div className="requirements-list">
          {recentRequirements.map((req) => (
            <div key={req._id} className="requirement-item requirement-item--static">
              <h4>{req.variety}</h4>
              <p>{req.quantityMT} MT • Rs. {req.budget.minPricePerKg}-{req.budget.maxPricePerKg}/kg</p>
              <small>{req.location.district}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'default', icon }) {
  return (
    <div className={`stat-card ${color}`}>
      {icon && <div className="stat-card-icon">{icon}</div>}
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}
