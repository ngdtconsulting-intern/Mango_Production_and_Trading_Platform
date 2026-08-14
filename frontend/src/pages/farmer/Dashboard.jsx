import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiMapPin, FiClipboard } from 'react-icons/fi';
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
  const [selectedFarm, setSelectedFarm] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    if (hasSurvey === null) dispatch(checkSurveyStatus());
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [farmsRes, marketRes, reqRes] = await Promise.allSettled([
        api.get('/farms'),
        api.get('/market/latest', { params: { district: user?.address?.district } }),
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
        eyebrow="Farmer dashboard"
        title={`Welcome back, ${user?.name}`}
        subtitle="Manage your orchards, submit production surveys, and respond to trader requirements."
      />

      {hasSurvey === false && (
        <div className="status status--reminder">
          <span><FiClipboard /> You haven't submitted a production survey yet. It helps traders find you.</span>
          <button className="btn-primary" onClick={() => navigate('/farmer/survey')}>
            Complete survey
          </button>
        </div>
      )}

      {/* ---------- Market price snapshot ---------- */}
      <div className="dashboard-section">
        <div className="dashboard-section-head">
          <h2>Market Prices</h2>
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
                key={`${price.district}-${price.variety}`}
                className="snapshot-card"
                onClick={() => navigate('/farmer/market')}
              >
                <div className="snapshot-card__top">
                  <h3>{price.variety}</h3>
                  <span className={`supply-badge ${price.supply}`}>{price.supply}</span>
                </div>
                <p className="snapshot-card__variety">{price.district}</p>
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
          <h2>Buying Requirements</h2>
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
              <div key={farm._id} className="snapshot-card" onClick={() => setSelectedFarm(farm)}>
                <h3>{farm.farmName}</h3>
                <p className="snapshot-card__variety">
                  {farm.orchardAreaKatha ? `${farm.orchardAreaKatha} katha` : 'Area not set'} • {farm.totalTreeCount || 0} trees
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- Farm details modal ---------- */}
      {selectedFarm && (
        <div className="modal-overlay" onClick={() => setSelectedFarm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedFarm.farmName}</h2>
              <button className="close-btn" onClick={() => setSelectedFarm(null)}>×</button>
            </div>

            {selectedFarm.description && <p className="detail-note">{selectedFarm.description}</p>}

            <h3 className="detail-heading">Location</h3>
            <div className="detail-grid">
              <div><span className="detail-label">Province</span><span>{selectedFarm.location?.province || 'N/A'}</span></div>
              <div><span className="detail-label">District</span><span>{selectedFarm.location?.district || 'N/A'}</span></div>
              <div><span className="detail-label">Municipality</span><span>{selectedFarm.location?.municipality || 'N/A'}</span></div>
              <div><span className="detail-label">Ward</span><span>{selectedFarm.location?.ward || 'N/A'}</span></div>
              <div><span className="detail-label">Tole</span><span>{selectedFarm.location?.tole || 'N/A'}</span></div>
            </div>

            <h3 className="detail-heading">Orchard</h3>
            <div className="detail-grid">
              <div><span className="detail-label">Area</span><span>{selectedFarm.orchardAreaKatha || 0} katha ({selectedFarm.orchardAreaHectare || 0} ha)</span></div>
              <div><span className="detail-label">Total Trees</span><span>{selectedFarm.totalTreeCount || 0}</span></div>
              <div><span className="detail-label">Bearing Trees</span><span>{selectedFarm.bearingTreeCount || 0}</span></div>
              <div><span className="detail-label">Soil Type</span><span style={{ textTransform: 'capitalize' }}>{selectedFarm.soilType}</span></div>
              <div><span className="detail-label">Terrain</span><span style={{ textTransform: 'capitalize' }}>{selectedFarm.terrain}</span></div>
              <div><span className="detail-label">Irrigation</span><span style={{ textTransform: 'capitalize' }}>{selectedFarm.irrigationSystem}</span></div>
            </div>

            {selectedFarm.varieties?.length > 0 && (
              <>
                <h3 className="detail-heading">Varieties</h3>
                <div className="tree-age-tags">
                  {selectedFarm.varieties.map((v, i) => (
                    <span key={i} className="tree-age-tag">{v.name}: {v.percentage}%</span>
                  ))}
                </div>
              </>
            )}

            {selectedFarm.treeAgeDistribution && Object.values(selectedFarm.treeAgeDistribution).some((v) => v > 0) && (
              <>
                <h3 className="detail-heading">Tree Age Distribution</h3>
                <div className="tree-age-tags">
                  {Object.entries(selectedFarm.treeAgeDistribution)
                    .filter(([, count]) => count > 0)
                    .map(([range, count]) => (
                      <span key={range} className="tree-age-tag">{range} yrs: {count}</span>
                    ))}
                </div>
              </>
            )}

            {(selectedFarm.lastHarvestDate || selectedFarm.lastHarvestQuantityKg) && (
              <>
                <h3 className="detail-heading">Last Harvest</h3>
                <div className="detail-grid">
                  <div><span className="detail-label">Date</span><span>{selectedFarm.lastHarvestDate ? new Date(selectedFarm.lastHarvestDate).toLocaleDateString() : 'N/A'}</span></div>
                  <div><span className="detail-label">Quantity</span><span>{selectedFarm.lastHarvestQuantityKg || 0} kg</span></div>
                  <div><span className="detail-label">Revenue</span><span>Rs. {selectedFarm.lastHarvestRevenuNPR || 0}</span></div>
                </div>
              </>
            )}

            {selectedFarm.certifications?.length > 0 && (
              <>
                <h3 className="detail-heading">Certifications</h3>
                <div className="tree-age-tags">
                  {selectedFarm.certifications.map((c, i) => (
                    <span key={i} className="tree-age-tag">{c}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
