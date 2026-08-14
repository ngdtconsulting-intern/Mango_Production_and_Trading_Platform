import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import StatusBadge from '../../components/StatusBadge';
import '../../styles/dashboard.css';

export default function OfficerReports() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);

  const [reviewingReport, setReviewingReport] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data } = await api.get('/reports', { params: { limit: 20 } });
      setReports(data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const openReport = (report) => {
    setReviewingReport(report);
    setReplyText(report.officerNotes || '');
  };

  const closeReportReview = () => {
    setReviewingReport(null);
    setReplyText('');
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    setSubmittingReply(true);
    try {
      const { data } = await api.patch(`/reports/${reviewingReport._id}/resolve`, {
        officerNotes: replyText.trim() || undefined,
      });
      setReports((prev) => prev.map((r) => (r._id === reviewingReport._id ? data.report : r)));
      toast.success('Reply sent, report marked resolved');
      closeReportReview();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) return <div className="dashboard-container">Loading...</div>;

  const openCount = reports.filter((r) => r.status === 'open').length;

  return (
    <div className="dashboard-container">
      <PageBanner
        variant="admin"
        eyebrow="Officer dashboard"
        title="Reported Problems"
        subtitle="Review and reply to problems reported by farmers and traders in your coverage area."
      />

      <h2>Reports ({openCount} open)</h2>
      {reports.length === 0 ? (
        <p>No reports from your coverage area.</p>
      ) : (
        <div className="report-grid">
          {reports.map((r) => (
            <div key={r._id} className="report-card" onClick={() => openReport(r)}>
              <div className="report-card-head">
                <div className="report-card-reporter">
                  <strong>{r.reporterName}</strong>
                  <span>{r.reporterRole} • {r.district}</span>
                </div>
                <StatusBadge status={r.status} />
              </div>

              {r.message && <p className="report-card-message">{r.message}</p>}
              {r.imageUrl && <img src={r.imageUrl} alt="Reported issue" className="report-card-image" />}

              <span className="report-card-meta">
                Submitted {new Date(r.createdAt).toLocaleDateString()}
                {r.status === 'resolved' && r.resolvedBy && ` • Resolved by ${r.resolvedBy.name}`}
              </span>

              {r.status === 'open' ? (
                <p className="empty-message-small">Click to reply and resolve.</p>
              ) : (
                <p className="empty-message-small">Click to view your reply.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report reply modal */}
      {reviewingReport && (
        <div className="modal-overlay" onClick={closeReportReview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Report from {reviewingReport.reporterName}</h2>
              <button className="close-btn" onClick={closeReportReview}>×</button>
            </div>

            <div className="detail-section">
              <p><strong>Reporter:</strong> {reviewingReport.reporterName} ({reviewingReport.reporterRole})</p>
              <p><strong>District:</strong> {reviewingReport.district}</p>
              <p><strong>Submitted:</strong> {new Date(reviewingReport.createdAt).toLocaleDateString()}</p>
            </div>

            {reviewingReport.message && (
              <>
                <h3 className="detail-heading">Message</h3>
                <p className="detail-note">{reviewingReport.message}</p>
              </>
            )}

            {reviewingReport.imageUrl && (
              <>
                <h3 className="detail-heading">Photo</h3>
                <img src={reviewingReport.imageUrl} alt="Reported issue" className="report-card-image" />
              </>
            )}

            {reviewingReport.status === 'open' ? (
              <form onSubmit={handleReplySubmit}>
                <label className="field" style={{ marginTop: 18 }}>
                  <span>Your reply</span>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Let the reporter know what you found or what happens next..."
                  />
                </label>
                <div className="modal-actions" style={{ marginTop: 16 }}>
                  <button className="btn-submit" type="submit" disabled={submittingReply}>
                    {submittingReply ? 'Sending...' : 'Send Reply & Resolve'}
                  </button>
                  <button className="btn-cancel" type="button" onClick={closeReportReview}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h3 className="detail-heading">Your Reply</h3>
                <p className="detail-note">{reviewingReport.officerNotes || 'No reply message was left.'}</p>
                {reviewingReport.resolvedBy && (
                  <p className="empty-message-small">
                    Resolved by {reviewingReport.resolvedBy.name} on {new Date(reviewingReport.resolvedAt).toLocaleDateString()}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
