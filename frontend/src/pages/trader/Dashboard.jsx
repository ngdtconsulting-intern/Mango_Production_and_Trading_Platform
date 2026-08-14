import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import PageBanner from '../../components/PageBanner';
import StatusBadge from '../../components/StatusBadge';
import '../../styles/trader-dashboard.css';

export default function TraderDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [myRequirements, setMyRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const myReqsResponse = await api.get('/traders/requirements/my-requirements', {
        params: { limit: 5 },
      });

      setStats({
        totalRequirements: myReqsResponse.data.total,
        inProgressRequirements: myReqsResponse.data.requirements.filter((r) => r.status === 'in-progress').length,
        completedRequirements: myReqsResponse.data.requirements.filter((r) => r.status === 'completed').length,
      });

      setMyRequirements(myReqsResponse.data.requirements);
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
        eyebrow="Trader dashboard"
        title="Trader Dashboard"
        subtitle="Post buying requirements and connect directly with farmers, no middleman."
      >
        <button className="btn-primary" onClick={() => navigate('/trader/requirements/create')}>
          + New Buying Requirement
        </button>
      </PageBanner>

      <div className="stats-grid">
        <StatCard label="Total Requirements" value={stats.totalRequirements} icon={FiPackage} />
        <StatCard label="In Progress" value={stats.inProgressRequirements} color="blue" icon={FiRefreshCw} />
        <StatCard label="Completed" value={stats.completedRequirements} color="purple" icon={FiCheckCircle} />
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-head">
          <h2>Your Requirements</h2>
        </div>
        {myRequirements.length === 0 ? (
          <p className="empty-message-small">You haven't posted any buying requirements yet.</p>
        ) : (
          <div className="requirements-list">
            {myRequirements.map((req) => {
              const isExpired = req.status === 'open' && req.requiredByDate && new Date(req.requiredByDate) < new Date();
              return (
                <div
                  key={req._id}
                  className="requirement-item"
                  onClick={() => navigate(`/trader/requirements/${req._id}`)}
                >
                  <div className="requirement-item__top">
                    <h4>{req.variety}</h4>
                    <StatusBadge status={isExpired ? 'expired' : req.status} />
                  </div>
                  <p>{req.quantityMT} MT, {req.responseCount || 0} response(s)</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'default', icon: Icon }) {
  return (
    <div className={`stat-card ${color}`}>
      {Icon && <div className="stat-card-icon"><Icon /></div>}
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}
