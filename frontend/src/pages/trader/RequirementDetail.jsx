import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import '../../styles/trader.css';

const STATUS_LABELS = {
  open: 'Open',
  'in-progress': 'Accepted',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

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
      toast.success(status === 'accepted' ? 'Request accepted' : 'Request declined');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update request');
    }
  };

  const handleMarkCompleted = async () => {
    try {
      const { data } = await api.patch(`/traders/requirements/${id}/status`, { status: 'completed' });
      setRequirement(data.requirement);
      toast.success('Order marked as completed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <div className="buying-requirements-container">Loading...</div>;
  if (!requirement) return <div className="buying-requirements-container">Requirement not found.</div>;

  return (
    <div className="buying-requirements-container">
      <button className="btn-cancel" style={{ marginBottom: 20 }} onClick={() => navigate('/trader/dashboard')}>
        ← Back to Dashboard
      </button>

      <div className="requirement-card" style={{ marginBottom: 24 }}>
        <div className="requirement-header">
          <h3>{requirement.variety}</h3>
          <span className={`status-badge ${requirement.status}`}>
            {STATUS_LABELS[requirement.status] || requirement.status}
          </span>
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

      <div className="status-guide">
        <p><strong>Open</strong> — waiting for farmers to request this order.</p>
        <p><strong>Accepted</strong> — you've accepted a farmer's request; contact them below to arrange the deal.</p>
        <p><strong>Completed</strong> — mark this once the order has been fulfilled.</p>
      </div>

      {requirement.status === 'in-progress' && (
        <button className="btn-submit" style={{ marginBottom: 28 }} onClick={handleMarkCompleted}>
          Mark Order Completed
        </button>
      )}

      <h2 style={{ marginBottom: 16 }}>Farmer Requests ({requirement.responses.length})</h2>
      {requirement.responses.length === 0 ? (
        <p className="empty-message">No farmers have requested this order yet.</p>
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
                    Accept Request
                  </button>
                  <button className="btn-cancel" onClick={() => handleResponseAction(res._id, 'rejected')}>
                    Decline
                  </button>
                </div>
              )}

              {res.status === 'accepted' && (
                <div className="contact-panel">
                  <p className="contact-panel-label">Contact this farmer</p>
                  <div className="farmer-contacts">
                    <a href={`tel:${res.farmerPhone}`} className="contact-btn phone">
                      📞 {res.farmerPhone || 'N/A'}
                    </a>
                    {res.farmerEmail && (
                      <a href={`mailto:${res.farmerEmail}`} className="contact-btn email">
                        ✉️ Email
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}