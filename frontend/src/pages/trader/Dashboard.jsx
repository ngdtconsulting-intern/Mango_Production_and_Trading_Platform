import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import '../../styles/trader-dashboard.css';

export default function TraderDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentRequirements, setRecentRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const myReqsResponse = await api.get('/buying-requirements/my-requirements', {
        params: { limit: 5 },
      });

      const allReqsResponse = await api.get('/buying-requirements', {
        params: { status: 'open', limit: 5 },
      });

      setStats({
        totalRequirements: myReqsResponse.data.total,
        openRequirements: myReqsResponse.data.data.filter((r) => r.status === 'open').length,
        inProgressRequirements: myReqsResponse.data.data.filter((r) => r.status === 'in-progress').length,
        completedRequirements: myReqsResponse.data.data.filter((r) => r.status === 'completed').length,
      });

      setRecentRequirements(allReqsResponse.data.data);
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

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Total Requirements" value={stats.totalRequirements} />
        <StatCard label="Open" value={stats.openRequirements} color="green" />
        <StatCard label="In Progress" value={stats.inProgressRequirements} color="blue" />
        <StatCard label="Completed" value={stats.completedRequirements} color="purple" />
      </div>

      {/* Recent Requirements */}
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