import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/directory.css';

export default function FarmerDirectory() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    district: '',
    search: '',
  });

  const DISTRICTS = ['Saptari', 'Siraha', 'Mahottari', 'Dhanusha', 'Janakpur'];

  useEffect(() => {
    fetchFarmers();
  }, [filters]);

  const fetchFarmers = async () => {
    try {
      const response = await api.get('/traders/farmers', {
        params: { district: filters.district, search: filters.search },
      });
      setFarmers(response.data.data);
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (farmerId) => {
    try {
      const response = await api.get(`/traders/farmers/${farmerId}`);
      alert(`
        Farmer: ${response.data.data.farmer.name}
        Phone: ${response.data.data.farmer.phone}
        Email: ${response.data.data.farmer.email}
        Recent Production: ${response.data.data.statistics.recentProduction} kg
        Recent Earnings: Rs. ${response.data.data.statistics.recentEarnings}
      `);
    } catch (error) {
      console.error('Error fetching farmer profile:', error);
    }
  };

  return (
    <div className="farmer-directory-container">
      <div className="header">
        <h1>👨‍🌾 Farmer Directory</h1>
        <p>Find and connect with mango farmers</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>District:</label>
          <select value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })}>
            <option value="">All Districts</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search by name or location..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      {/* Farmers List */}
      {loading ? (
        <p className="loading">Loading farmers...</p>
      ) : farmers.length === 0 ? (
        <p className="empty-message">No farmers found</p>
      ) : (
        <div className="farmers-grid">
          {farmers.map((farmer) => (
            <div key={farmer._id} className="farmer-card">
              <div className="farmer-header">
                <h3>{farmer.name}</h3>
              </div>

              <div className="farmer-info">
                <p>
                  <strong>📍 Location:</strong> {farmer.address?.district}, {farmer.address?.municipality}
                </p>
                {farmer.recentProduction && (
                  <p>
                    <strong>📊 Recent Production:</strong> {farmer.recentProduction} kg
                  </p>
                )}
                {farmer.recentEarnings && (
                  <p>
                    <strong>💰 Recent Earnings:</strong> Rs. {farmer.recentEarnings.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="farmer-contacts">
                <a href={`tel:${farmer.phone}`} className="contact-btn phone">
                  📞 {farmer.phone}
                </a>
                <a href={`mailto:${farmer.email}`} className="contact-btn email">
                  ✉️ Email
                </a>
              </div>

              <button className="btn-profile" onClick={() => handleViewProfile(farmer._id)}>
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}