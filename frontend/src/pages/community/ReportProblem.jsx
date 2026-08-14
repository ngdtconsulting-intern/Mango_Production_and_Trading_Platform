import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiPaperclip } from 'react-icons/fi';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import '../../styles/forms.css';
import '../../styles/dashboard.css';

export default function ReportProblem() {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      const { data } = await api.get('/reports/my');
      setMyReports(data.reports);
    } catch (error) {
      console.error('Error fetching your reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !imageFile) {
      toast.error('Add a message or a photo before submitting');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const { data } = await api.post('/reports/upload', formData);
        imageUrl = data.imageUrl;
      }

      await api.post('/reports', { message: message.trim() || undefined, imageUrl });
      toast.success('Report submitted. An officer will review it');
      setMessage('');
      setImageFile(null);
      fetchMyReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h1>Report a Problem</h1>

      <form onSubmit={handleSubmit}>
        <label className="field">
          <span>What's the problem?</span>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            placeholder="Describe the issue: pests, market access, payment disputes, etc."
          />
        </label>

        <label className="field" style={{ marginTop: 18 }}>
          <span>Photo (optional)</span>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        </label>
        {imageFile && <p className="empty-message-small"><FiPaperclip size={13} /> {imageFile.name}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>

      <h2 style={{ marginTop: 40 }}>Your Reports</h2>
      {loadingReports ? (
        <p className="empty-message-small">Loading...</p>
      ) : myReports.length === 0 ? (
        <p className="empty-message-small">You haven't submitted any reports yet.</p>
      ) : (
        <div className="admin-list">
          {myReports.map((r) => (
            <div key={r._id} className="admin-card">
              <div className="admin-card-info">
                <StatusBadge status={r.status} />
                <span>{r.message || '(photo only)'}</span>
                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                {r.status === 'resolved' && (
                  <div className="detail-note" style={{ marginTop: 6 }}>
                    <strong>Officer reply:</strong> {r.officerNotes || 'Marked resolved, no reply message was left.'}
                    {r.resolvedBy && (
                      <div className="empty-message-small">
                        {r.resolvedBy.name} · {new Date(r.resolvedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {r.imageUrl && <img src={r.imageUrl} alt="Attached" className="report-card-image" style={{ maxWidth: 120 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
