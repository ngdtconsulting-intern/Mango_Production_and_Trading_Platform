import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiPlusSquare, FiClipboard, FiBarChart2, FiShoppingBag, FiArrowRight, FiMapPin } from 'react-icons/fi';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import { checkSurveyStatus } from '../../store/surveySlice';
import '../../styles/dashboard.css';

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { hasSurvey } = useSelector((state) => state.survey);

  const [farms, setFarms] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    if (hasSurvey === null) dispatch(checkSurveyStatus());
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [farmsRes, marketRes, reqRes] = await Promise.allSettled([
        api.get('/farms'),
        api.get('/market/latest'),
        api.get('/traders/requirements', { params: { status: 'open', limit: 4 } }),
      ]);

      if (farmsRes.status === 'fulfilled') setFarms(farmsRes.value.data.farms || []);
      if (marketRes.status === 'fulfilled') setMarketPrices((marketRes.value.data.data || []).slice(0, 4));
      if (reqRes.status === 'fulfilled') setRequirements(reqRes.value.data.requirements || []);
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
        variant="farmer"
        eyebrow="🌳 Farmer dashboard"
        title={`Welcome back, ${user?.name}`}
        subtitle="Manage your orchards, submit production surveys, and respond to trader requirements."
      />

      {hasSurvey === false && (
        <div className="status status--reminder">
          <span>📋 You haven't submitted a production survey yet — it helps traders find you.</span>
          <button className="btn-primary" onClick={() => navigate('/farmer/survey')}>
            Complete survey
          </button>
        </div>
      )}

      {/* ---------- Quick actions ---------- */}
      <div className="quick-actions">
        <button className="quick-action-card" onClick={() => navigate('/farmer/farms/new')}>
          <FiPlusSquare className="quick-action-icon" />
          <span>Add Farm</span>
        </button>
        <button className="quick-action-card" onClick={() => navigate('/farmer/survey')}>
          <FiClipboard className="quick-action-icon" />
          <span>New Survey</span>
        </button>
        <button className="quick-action-card" onClick={() => navigate('/farmer/market')}>
          <FiBarChart2 className="quick-action-icon" />
          <span>Market Prices</span>
        </button>
        <button className="quick-action-card" onClick={() => navigate('/trader/requirements')}>
          <FiShoppingBag className="quick-action-icon" />
          <span>Buying Requirements</span>
        </button>
      </div>

      {/* ---------- Market price snapshot ---------- */}
      <div className="dashboard-section">
        <div className="dashboard-section-head">
          <h2>📊 Market Prices</h2>
          <button className="view-all-link" onClick={() => navigate('/farmer/market')}>
            View all <FiArrowRight />
          </button>
        </div>

        {marketPrices.length === 0 ? (
          <p className="empty-message-small">No market prices published yet.</p>
        ) : (
          <div className="snapshot-grid">
            {marketPrices.map((price) => (
              <div
                key={`${price.market}-${price.variety}`}
                className="snapshot-card"
                onClick={() => navigate('/farmer/market')}
              >
                <div className="snapshot-card__top">
                  <h3>{price.market}</h3>
                  <span className={`supply-badge ${price.supply}`}>{price.supply}</span>
                </div>
                <p className="snapshot-card__variety">{price.variety}</p>
                <div className="snapshot-card__price">
                  Rs. {price.wholesalePricePerKg}
                  <span>/kg wholesale</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- Buying requirements snapshot ---------- */}
      <div className="dashboard-section">
        <div className="dashboard-section-head">
          <h2>📦 Buying Requirements</h2>
          <button className="view-all-link" onClick={() => navigate('/trader/requirements')}>
            View all <FiArrowRight />
          </button>
        </div>

        {requirements.length === 0 ? (
          <p className="empty-message-small">No open buying requirements right now.</p>
        ) : (
          <div className="snapshot-grid">
            {requirements.map((req) => (
              <div
                key={req._id}
                className="snapshot-card"
                onClick={() => navigate('/trader/requirements')}
              >
                <div className="snapshot-card__top">
                  <h3>{req.variety}</h3>
                  <span className="quality-badge good">{req.quantityMT} MT</span>
                </div>
                <p className="snapshot-card__variety">
                  <FiMapPin size={12} /> {req.location?.district}
                </p>
                <div className="snapshot-card__price">
                  Rs. {req.budget?.minPricePerKg}-{req.budget?.maxPricePerKg}
                  <span>/kg budget</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- Farms ---------- */}
      <div className="dashboard-section">
        <div className="dashboard-section-head">
          <h2>Your Farms ({farms.length})</h2>
        </div>

        {farms.length === 0 ? (
          <p className="empty-message-small">You haven't registered any farms yet.</p>
        ) : (
          <div className="snapshot-grid">
            {farms.map((farm) => (
              <div key={farm._id} className="snapshot-card snapshot-card--static">
                <h3>{farm.farmName}</h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
