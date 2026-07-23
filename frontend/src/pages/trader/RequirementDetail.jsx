import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import '../../styles/trader.css';

export default function RequirementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [requirement, setRequirement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequirement();
  }, [id]);

  const fetchRequirement = async () => {
    try {
      const { data } = await api.get(`/traders/requirements/${id}`);
      setRequirement(data.requirement);
    } catch (error) {
      toast.error('Failed to load requirement');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseAction = async (responseId, status) => {
    try {
      const { data } = await api.patch(`/traders/requirements/${id}/responses/${responseId}`, { status });
      setRequirement(data.requirement);
      toast.success(`Response ${status}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update response');
    }
  };

  if (loading) return <div className="buying-requirements-container">Loading...</div>;
  if (!requirement) return <div className="buying-requirements-container">Requirement not found.</div>;

  return (
    <div className="buying-requirements-container">
      <button className="btn-cancel" style={{ marginBottom: 20 }} onClick={() => navigate('/trader/dashboard')}>
        ← Back to Dashboard
      </button>

      <div className="requirement-card" style={{ marginBottom: 32 }}>
        <div className="requirement-header">
          <h3>{requirement.variety}</h3>
          <span className={`status-badge ${requirement.status}`}>{requirement.status}</span>
        </div>
        <div className="requirement-details">
          <div className="detail-row">
            <span className="label">Quantity</span>
            <span className="value">{requirement.quantityMT} MT</span>
          </div>
          <div className="detail-row">
            <span className="label">Budget</span>
            <span className="value">Rs. {requirement.budget?.minPricePerKg}-{requirement.budget?.maxPricePerKg}/kg</span>
          </div>
          <div className="detail-row">
            <span className="label">Location</span>
            <span className="value">{requirement.location?.municipality}, {requirement.location?.district}</span>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: 16 }}>Responses ({requirement.responses.length})</h2>
      {requirement.responses.length === 0 ? (
        <p className="empty-message">No farmers have responded yet.</p>
      ) : (
        <div className="requirements-list">
          {requirement.responses.map((res) => (
            <div key={res._id} className="requirement-card">
              <div className="requirement-header">
                <h3>{res.farmerName}</h3>
                <span className={`status-badge ${res.status}`}>{res.status}</span>
              </div>
              <div className="requirement-details">
                <div className="detail-row">
                  <span className="label">Available Quantity</span>
                  <span className="value">{res.availableQuantityKg} kg</span>
                </div>
                <div className="detail-row">
                  <span className="label">Proposed Price</span>
                  <span className="value">Rs. {res.proposedPricePerKg}/kg</span>
                </div>
                {res.message && (
                  <div className="detail-row">
                    <span className="label">Message</span>
                    <span className="value">{res.message}</span>
                  </div>
                )}
              </div>
              {res.status === 'pending' && (
                <div className="modal-actions">
                  <button className="btn-submit" onClick={() => handleResponseAction(res._id, 'accepted')}>
                    Accept
                  </button>
                  <button className="btn-cancel" onClick={() => handleResponseAction(res._id, 'rejected')}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}