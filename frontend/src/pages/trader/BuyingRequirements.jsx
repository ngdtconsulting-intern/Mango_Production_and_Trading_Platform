import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/trader.css';

export default function BuyingRequirements() {
  const [requirements, setRequirements] = useState([]);
  const [filteredRequirements, setFilteredRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'open',
    variety: '',
    district: '',
  });
  const [selectedReq, setSelectedReq] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const VARIETIES = ['Maldaha', 'Amrapali', 'Sindhure', 'Langra', 'Dusehri', 'Chaunsa'];
  const DISTRICTS = ['Saptari', 'Siraha', 'Mahottari', 'Dhanusha', 'Janakpur'];

  useEffect(() => {
    fetchRequirements();
  }, []);

  useEffect(() => {
    filterRequirements();
  }, [requirements, filters]);

  const fetchRequirements = async () => {
  try {
    const response = await api.get('/traders/requirements', {
      params: { status: 'open', limit: 100 },
    });
    setRequirements(response.data.requirements);
  } catch (error) {
    console.error('Error fetching requirements:', error);
  } finally {
    setLoading(false);
  }
};

  const filterRequirements = () => {
    let filtered = requirements;

    if (filters.variety) {
      filtered = filtered.filter((r) => r.variety === filters.variety);
    }

    if (filters.district) {
      filtered = filtered.filter((r) => r.location.district === filters.district);
    }

    if (filters.status) {
      filtered = filtered.filter((r) => r.status === filters.status);
    }

    setFilteredRequirements(filtered);
  };

  const handleApply = (req) => {
    setSelectedReq(req);
    setShowForm(true);
  };

  return (
    <div className="buying-requirements-container">
      <div className="header">
        <h1>🛒 Buying Requirements</h1>
        <p>Available mango buying opportunities from traders</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Variety:</label>
          <select
            value={filters.variety}
            onChange={(e) => setFilters({ ...filters, variety: e.target.value })}
          >
            <option value="">All Varieties</option>
            {VARIETIES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>District:</label>
          <select
            value={filters.district}
            onChange={(e) => setFilters({ ...filters, district: e.target.value })}
          >
            <option value="">All Districts</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requirements List */}
      {loading ? (
        <p className="loading">Loading requirements...</p>
      ) : filteredRequirements.length === 0 ? (
        <p className="empty-message">No buying requirements found matching your filters</p>
      ) : (
        <div className="requirements-list">
          {filteredRequirements.map((req) => (
            <div key={req._id} className="requirement-card">
              <div className="requirement-header">
                <h3>{req.variety}</h3>
                <span className={`status-badge ${req.status}`}>{req.status}</span>
              </div>

              <div className="requirement-details">
                <div className="detail-row">
                  <span className="label">Quantity:</span>
                  <span className="value">{req.quantityMT} MT ({req.quantityKg} kg)</span>
                </div>

                <div className="detail-row">
                  <span className="label">Quality:</span>
                  <span className="value">{req.quality}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Location:</span>
                  <span className="value">{req.location.district}, {req.location.municipality}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Price Range:</span>
                  <span className="value">
                    Rs. {req.budget.minPricePerKg} - Rs. {req.budget.maxPricePerKg}/kg
                  </span>
                </div>

                <div className="detail-row">
                  <span className="label">Required By:</span>
                  <span className="value">{new Date(req.requiredByDate).toLocaleDateString()}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Trader:</span>
                  <span className="value">{req.businessName}</span>
                </div>
              </div>

              <div className="requirement-footer">
                <span className="responses">{req.responseCount} responses</span>
                <button className="btn-apply" onClick={() => handleApply(req)}>
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Form Modal */}
      {showForm && selectedReq && (
        <ApplicationForm requirement={selectedReq} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function ApplicationForm({ requirement, onClose }) {
  const [formData, setFormData] = useState({
    availableQuantityKg: requirement.quantityKg,
    proposedPricePerKg: (requirement.budget.minPricePerKg + requirement.budget.maxPricePerKg) / 2,
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post(`/traders/requirements/${requirement._id}/respond`, formData);
      alert('Application submitted successfully!');
      onClose();
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || 'Failed to submit application'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Apply for {requirement.variety}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="application-form">
          <div className="form-group">
            <label>Available Quantity (kg)</label>
            <input
              type="number"
              min="0"
              value={formData.availableQuantityKg}
              onChange={(e) => setFormData({ ...formData, availableQuantityKg: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Proposed Price (Rs/kg)</label>
            <input
              type="number"
              step="0.01"
              value={formData.proposedPricePerKg}
              onChange={(e) => setFormData({ ...formData, proposedPricePerKg: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              rows="4"
              placeholder="Tell the trader about your farm and product quality..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}