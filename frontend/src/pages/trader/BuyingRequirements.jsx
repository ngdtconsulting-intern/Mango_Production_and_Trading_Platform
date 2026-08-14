import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiMapPin } from 'react-icons/fi';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import StatusBadge from '../../components/StatusBadge';
import { getProvinces, getDistricts, getMunicipalities } from '../../utils/nepalLocations';
import '../../styles/trader.css';

const VARIETIES = ['Maldaha', 'Amrapali', 'Sindhure', 'Langra', 'Dusehri', 'Chaunsa'];

export default function BuyingRequirements() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ variety: '', province: '', district: '', municipality: '' });

  useEffect(() => {
    fetchRequirements();
  }, [filters]);

  const fetchRequirements = async () => {
    try {
      const { data } = await api.get('/traders/requirements', {
        params: { status: 'open', ...filters, limit: 20 },
      });
      setRequirements(data.requirements);
    } catch (error) {
      console.error('Error fetching buying requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...filters, [name]: value };
    if (name === 'province') {
      updated.district = '';
      updated.municipality = '';
    } else if (name === 'district') {
      updated.municipality = '';
    }
    setFilters(updated);
  };

  return (
    <div className="dashboard-container">
      <PageBanner
        variant={user?.role === 'farmer' ? 'farmer' : 'trader'}
        eyebrow="Buying requirements"
        title="Buying Requirements"
        subtitle={
          user?.role === 'farmer'
            ? 'Browse what traders are looking to buy and request an order.'
            : 'Open buying requirements currently posted by traders.'
        }
      />

      <div className="filters-section">
        <div className="filter-group">
          <label>Variety</label>
          <select name="variety" value={filters.variety} onChange={handleFilterChange}>
            <option value="">All varieties</option>
            {VARIETIES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Province</label>
          <select name="province" value={filters.province} onChange={handleFilterChange}>
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
            value={filters.district}
            onChange={handleFilterChange}
            disabled={!filters.province}
          >
            <option value="">All districts</option>
            {getDistricts(filters.province).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Municipality</label>
          <select
            name="municipality"
            value={filters.municipality}
            onChange={handleFilterChange}
            disabled={!filters.district}
          >
            <option value="">All municipalities</option>
            {getMunicipalities(filters.province, filters.district).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="loading">Loading buying requirements...</p>
      ) : requirements.length === 0 ? (
        <p className="empty-message">No open buying requirements right now.</p>
      ) : (
        <div className="requirements-list">
          {requirements.map((req) => (
            <div key={req._id} className="requirement-card" onClick={() => navigate(`/trader/requirements/${req._id}`)}>
              <div className="requirement-header">
                <h3>{req.variety}</h3>
                <StatusBadge status={req.status} />
              </div>
              <div className="requirement-details">
                <div className="detail-row">
                  <span className="label">Quantity</span>
                  <span className="value">{req.quantityMT} MT</span>
                </div>
                <div className="detail-row">
                  <span className="label">Budget</span>
                  <span className="value">Rs. {req.budget?.minPricePerKg}-{req.budget?.maxPricePerKg}/kg</span>
                </div>
                <div className="detail-row">
                  <span className="label"><FiMapPin size={12} /> Location</span>
                  <span className="value">{req.location?.municipality || 'N/A'}, {req.location?.district}</span>
                </div>
              </div>
              <p className="responses">{req.responseCount || 0} farmer response(s)</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
