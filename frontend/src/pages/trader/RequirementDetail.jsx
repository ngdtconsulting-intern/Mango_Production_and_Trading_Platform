import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { FiPhone, FiMail, FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import StatusBadge from '../../components/StatusBadge';
import '../../styles/trader.css';

export default function RequirementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isTrader = user?.role === 'trader';

  const [requirement, setRequirement] = useState(null);
  const [loading, setLoading] = useState(true);

  const [responseForm, setResponseForm] = useState({ availableQuantityKg: '', proposedPricePerKg: '', message: '' });
  const [submittingResponse, setSubmittingResponse] = useState(false);

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

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    setSubmittingResponse(true);
    try {
      const { data } = await api.post(`/traders/requirements/${id}/respond`, {
        availableQuantityKg: Number(responseForm.availableQuantityKg),
        proposedPricePerKg: Number(responseForm.proposedPricePerKg),
        message: responseForm.message.trim() || undefined,
      });
      setRequirement(data.requirement);
      toast.success('Request sent to the trader');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setSubmittingResponse(false);
    }
  };

  if (loading) return <div className="dashboard-container">Loading...</div>;
  if (!requirement) return <div className="dashboard-container">Requirement not found.</div>;

  const myResponse = !isTrader ? requirement.responses?.[0] : null;
  const isExpired = requirement.status === 'open' && requirement.requiredByDate && new Date(requirement.requiredByDate) < new Date();

  const renderAcceptedFarmerCard = (res, requirementStatus) => (
    <div key={res._id} className="requirement-card requirement-item--static" style={{ marginBottom: 20 }}>
      <div className="requirement-header">
        <h3>{res.farmerName}</h3>
        <StatusBadge status={requirementStatus} />
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
        {res.farmerStats && (
          <>
            <div className="detail-row">
              <span className="label">Recent Production</span>
              <span className="value">{res.farmerStats.recentProduction} kg</span>
            </div>
            <div className="detail-row">
              <span className="label">Recent Earnings</span>
              <span className="value">Rs. {res.farmerStats.recentEarnings}</span>
            </div>
          </>
        )}
        {res.message && (
          <div className="detail-row">
            <span className="label">Message</span>
            <span className="value">{res.message}</span>
          </div>
        )}
      </div>
      <div className="contact-panel">
        <p className="contact-panel-label">Contact this farmer</p>
        <div className="farmer-contacts">
          <a href={`tel:${res.farmerPhone}`} className="contact-btn phone">
            <FiPhone /> {res.farmerPhone || 'N/A'}
          </a>
          {res.farmerEmail && (
            <a href={`mailto:${res.farmerEmail}`} className="contact-btn email">
              <FiMail /> Email
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <PageBanner
        variant={isTrader ? 'trader' : 'farmer'}
        eyebrow="Requirement details"
        title={requirement.variety}
        subtitle={isTrader ? 'Review the full requirement and manage farmer responses.' : 'Review this requirement and request the order.'}
      />

      <button
        className="btn-cancel"
        style={{ marginBottom: 20, maxWidth: 200 }}
        onClick={() => navigate(isTrader ? '/trader/dashboard' : '/trader/requirements')}
      >
        <FiArrowLeft /> Back
      </button>

      <div className="requirement-card requirement-item--static" style={{ marginBottom: 24 }}>
        <div className="requirement-header">
          <h3>{requirement.variety}</h3>
          <StatusBadge status={isExpired ? 'expired' : requirement.status} />
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
          {requirement.requiredByDate && (
            <div className="detail-row">
              <span className="label">Required By</span>
              <span className="value">{new Date(requirement.requiredByDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {isTrader ? (
        <>
          {requirement.status === 'open' && (
            <>
              {isExpired && (
                <div className="status-guide">
                  <p><strong>Expired:</strong> past its "required by" date. It no longer appears to farmers, but you can still act on requests already sent.</p>
                </div>
              )}
              <h2 style={{ marginBottom: 16 }}>Pending Requests ({requirement.responses.length})</h2>
              {requirement.responses.length === 0 ? (
                <p className="empty-message">No farmers have requested this order yet.</p>
              ) : (
                <div className="requirements-list">
                  {requirement.responses.map((res) => (
                    <div key={res._id} className="requirement-card requirement-item--static">
                      <div className="requirement-header">
                        <h3>{res.farmerName}</h3>
                        <StatusBadge status={res.status} />
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
                      <div className="modal-actions">
                        <button className="btn-submit" onClick={() => handleResponseAction(res._id, 'accepted')}>
                          Accept Request
                        </button>
                        <button className="btn-cancel" onClick={() => handleResponseAction(res._id, 'rejected')}>
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {requirement.status === 'in-progress' && (
            <>
              <div className="status-guide">
                <p><strong>In Progress:</strong> you've accepted a farmer's request. Contact them below to arrange the deal, then mark the order completed once it's fulfilled.</p>
              </div>
              {requirement.responses.length === 0 ? (
                <p className="empty-message">No accepted farmer on record for this order.</p>
              ) : (
                requirement.responses.map((res) => renderAcceptedFarmerCard(res, 'in-progress'))
              )}
              <button className="btn-submit" style={{ maxWidth: 260 }} onClick={handleMarkCompleted}>
                Mark Order Completed
              </button>
            </>
          )}

          {requirement.status === 'completed' && (
            <>
              <div className="status-guide">
                <p><strong>Completed:</strong> this order has been fulfilled.</p>
              </div>
              {requirement.responses.map((res) => renderAcceptedFarmerCard(res, 'completed'))}
            </>
          )}
        </>
      ) : (
        <>
          {(requirement.contact?.phone || requirement.contact?.email) && (
            <div className="contact-panel" style={{ marginBottom: 24 }}>
              <p className="contact-panel-label">Trader contact</p>
              <div className="farmer-contacts">
                {requirement.contact?.phone && (
                  <a href={`tel:${requirement.contact.phone}`} className="contact-btn phone">
                    <FiPhone /> {requirement.contact.phone}
                  </a>
                )}
                {requirement.contact?.email && (
                  <a href={`mailto:${requirement.contact.email}`} className="contact-btn email">
                    <FiMail /> Email
                  </a>
                )}
              </div>
            </div>
          )}

          {myResponse ? (
            <div className="requirement-card requirement-item--static">
              <div className="requirement-header">
                <h3>Your Request</h3>
                <StatusBadge status={myResponse.status} />
              </div>
              <div className="requirement-details">
                <div className="detail-row">
                  <span className="label">Available Quantity</span>
                  <span className="value">{myResponse.availableQuantityKg} kg</span>
                </div>
                <div className="detail-row">
                  <span className="label">Proposed Price</span>
                  <span className="value">Rs. {myResponse.proposedPricePerKg}/kg</span>
                </div>
                {myResponse.message && (
                  <div className="detail-row">
                    <span className="label">Message</span>
                    <span className="value">{myResponse.message}</span>
                  </div>
                )}
              </div>
              {myResponse.status === 'pending' && (
                <p className="empty-message-small">Waiting for the trader to respond to your request.</p>
              )}
              {myResponse.status === 'accepted' && (
                <p className="empty-message-small">Your request was accepted. Use the trader contact above to arrange the deal.</p>
              )}
              {myResponse.status === 'rejected' && (
                <p className="empty-message-small">The trader declined this request.</p>
              )}
            </div>
          ) : requirement.status === 'open' && !isExpired ? (
            <form className="application-form" onSubmit={handleSubmitResponse} style={{ maxWidth: 480 }}>
              <h2 style={{ margin: 0 }}>Request This Order</h2>
              <div className="form-group">
                <label>Available Quantity (kg)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={responseForm.availableQuantityKg}
                  onChange={(e) => setResponseForm({ ...responseForm, availableQuantityKg: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Proposed Price (Rs/kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={responseForm.proposedPricePerKg}
                  onChange={(e) => setResponseForm({ ...responseForm, proposedPricePerKg: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Message (optional)</label>
                <textarea
                  rows={3}
                  value={responseForm.message}
                  onChange={(e) => setResponseForm({ ...responseForm, message: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-submit" disabled={submittingResponse}>
                  {submittingResponse ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          ) : (
            <p className="empty-message">
              {isExpired ? 'This requirement has passed its deadline and is no longer accepting requests.' : 'This requirement is no longer open.'}
            </p>
          )}
        </>
      )}
    </div>
  );
}
