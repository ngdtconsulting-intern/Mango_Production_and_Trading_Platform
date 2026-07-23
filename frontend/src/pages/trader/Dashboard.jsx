import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
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

  return (
    <div className="trader-dashboard">
      <div className="dashboard-header">
        <h1>🏪 Trader Dashboard</h1>
        <button className="btn-primary" onClick={() => navigate('/trader/requirements/create')}>
          + New Buying Requirement
        </button>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Requirements" value={stats.totalRequirements} />
        <StatCard label="Open" value={stats.openRequirements} color="green" />
        <StatCard label="In Progress" value={stats.inProgressRequirements} color="blue" />
        <StatCard label="Completed" value={stats.completedRequirements} color="purple" />
      </div>

      <div className="recent-section" style={{ marginBottom: 40 }}>
        <h2>Your Requirements</h2>
        {loading ? (
          <p>Loading...</p>
        ) : myRequirements.length === 0 ? (
          <p>You haven't posted any buying requirements yet.</p>
        ) : (
          <div className="requirements-list">
            {myRequirements.map((req) => (
              <div
                key={req._id}
                className="requirement-item"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/trader/requirements/${req._id}`)}
              >
                <h4>{req.variety} — {req.status}</h4>
                <p>{req.quantityMT} MT • {req.responseCount || 0} response(s)</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="recent-section">
        <h2>Recent Market Opportunities</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="requirements-list">
            {recentRequirements.map((req) => (
              <div key={req._id} className="requirement-item">
                <h4>{req.variety}</h4>
                <p>{req.quantityMT} MT • Rs. {req.budget.minPricePerKg}-{req.budget.maxPricePerKg}/kg</p>
                <small>{req.location.district}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'default' }) {
  return (
    <div className={`stat-card ${color}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}