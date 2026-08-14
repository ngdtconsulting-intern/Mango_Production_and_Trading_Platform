import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import StatusBadge from '../../components/StatusBadge';
import '../../styles/trader.css';

function RequestFlow({ status }) {
  const finalLabel = status === 'rejected' ? 'Declined' : 'Accepted';
  const stage = status === 'pending' ? 1 : 2; // 0 = requested, 1 = under review, 2 = decided
  const steps = ['Requested', 'Trader Review', finalLabel];

  return (
    <div className="request-flow">
      {steps.map((label, i) => (
        <span
          key={label}
          className={`request-flow-step ${i <= stage ? 'request-flow-step--done' : ''} ${i === 2 && status === 'rejected' ? 'request-flow-step--rejected' : ''}`}
        >
          {label}
          {i < steps.length - 1 && <span className="request-flow-arrow">→</span>}
        </span>
      ))}
    </div>
  );
}

function RequestCard({ r, onOpen }) {
  const isExpired = r.requirementStatus === 'open' && r.requiredByDate && new Date(r.requiredByDate) < new Date();
  const badgeStatus = r.response.status === 'pending' && isExpired ? 'expired' : r.response.status;

  return (
    <div className="requirement-card" onClick={() => onOpen(r._id)}>
      <div className="requirement-header">
        <h3>{r.variety}</h3>
        <StatusBadge status={badgeStatus} />
      </div>
      <div className="requirement-details">
        <div className="detail-row">
          <span className="label">Your Quantity</span>
          <span className="value">{r.response.availableQuantityKg} kg</span>
        </div>
        <div className="detail-row">
          <span className="label">Your Price</span>
          <span className="value">Rs. {r.response.proposedPricePerKg}/kg</span>
        </div>
        <div className="detail-row">
          <span className="label">Location</span>
          <span className="value">{r.location?.municipality || 'N/A'}, {r.location?.district}</span>
        </div>
      </div>
      <RequestFlow status={r.response.status} />
      {r.response.status === 'accepted' && (
        <p className="empty-message-small">Open this requirement to see the trader's contact details.</p>
      )}
    </div>
  );
}

export default function MyRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/traders/requirements/my-responses');
      setRequests(data.requests);
    } catch (error) {
      console.error('Error fetching your requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const openRequirement = (requirementId) => navigate(`/trader/requirements/${requirementId}`);

  const pending = requests.filter((r) => r.response.status === 'pending');
  const accepted = requests.filter((r) => r.response.status === 'accepted');
  const rejected = requests.filter((r) => r.response.status === 'rejected');

  return (
    <div className="dashboard-container">
      <PageBanner
        variant="farmer"
        eyebrow="Your requests"
        title="My Requests"
        subtitle="Every buying requirement you've requested, and where it stands."
      />

      {loading ? (
        <p className="loading">Loading your requests...</p>
      ) : requests.length === 0 ? (
        <p className="empty-message">You haven't requested any buying requirements yet.</p>
      ) : (
        <>
          <div className="dashboard-section">
            <div className="dashboard-section-head">
              <h2>Awaiting Response ({pending.length})</h2>
            </div>
            {pending.length === 0 ? (
              <p className="empty-message-small">Nothing waiting on a trader right now.</p>
            ) : (
              <div className="requirements-list">
                {pending.map((r) => <RequestCard key={r._id} r={r} onOpen={openRequirement} />)}
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <div className="dashboard-section-head">
              <h2>Accepted ({accepted.length})</h2>
            </div>
            {accepted.length === 0 ? (
              <p className="empty-message-small">No accepted requests yet.</p>
            ) : (
              <div className="requirements-list">
                {accepted.map((r) => <RequestCard key={r._id} r={r} onOpen={openRequirement} />)}
              </div>
            )}
          </div>

          {rejected.length > 0 && (
            <div className="dashboard-section">
              <div className="dashboard-section-head">
                <h2>Declined ({rejected.length})</h2>
              </div>
              <div className="requirements-list">
                {rejected.map((r) => <RequestCard key={r._id} r={r} onOpen={openRequirement} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
