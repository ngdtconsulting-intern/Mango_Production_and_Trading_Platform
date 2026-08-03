import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFarms();
    if (hasSurvey === null) dispatch(checkSurveyStatus());
  }, []);

  const fetchFarms = async () => {
    try {
      const { data } = await api.get('/farms');
      setFarms(data.farms || []);
    } catch (error) {
      console.error('Error fetching farms:', error);
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

      <div className="dashboard-actions">
        <button onClick={() => navigate('/farmer/farms/new')}>+ Add Farm</button>
        <button onClick={() => navigate('/farmer/survey')}>New Survey</button>
        <button onClick={() => navigate('/farmer/market')}>Market Prices</button>
        <button onClick={() => navigate('/trader/requirements')}>Buying Requirements</button>
      </div>

      <h2>Your Farms ({farms.length})</h2>
      {farms.length === 0 ? (
        <p>You haven't registered any farms yet.</p>
      ) : (
        <ul>
          {farms.map((farm) => (
            <li key={farm._id}>{farm.farmName}</li>
          ))}
        </ul>
      )}
    </div>
  );
}