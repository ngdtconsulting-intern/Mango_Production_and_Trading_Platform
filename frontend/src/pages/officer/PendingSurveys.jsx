import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import '../../styles/dashboard.css';

export default function PendingSurveys() {
  const [loading, setLoading] = useState(true);
  const [pendingSurveys, setPendingSurveys] = useState([]);
  const [reviewingSurvey, setReviewingSurvey] = useState(null);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const { data } = await api.get('/surveys', { params: { status: 'submitted', limit: 20 } });
      setPendingSurveys(data.surveys);
    } catch (error) {
      console.error('Error fetching pending surveys:', error);
      toast.error('Failed to load pending surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (surveyId, status) => {
    let verificationNotes = '';
    if (status === 'rejected') {
      verificationNotes = window.prompt('Reason for rejection (optional):') || '';
    }
    try {
      await api.patch(`/surveys/${surveyId}/verify`, { status, verificationNotes });
      toast.success(`Survey ${status}`);
      setPendingSurveys((prev) => prev.filter((s) => s._id !== surveyId));
      setReviewingSurvey(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update survey');
    }
  };

  const closeReview = () => setReviewingSurvey(null);

  if (loading) return <div className="dashboard-container">Loading...</div>;

  return (
    <div className="dashboard-container">
      <PageBanner
        variant="admin"
        eyebrow="Officer dashboard"
        title="Pending Survey Verifications"
        subtitle="Review and verify production surveys submitted by farmers in your coverage area."
      />

      <h2>Pending Surveys ({pendingSurveys.length})</h2>
      {pendingSurveys.length === 0 ? (
        <p>No surveys awaiting review.</p>
      ) : (
        <div className="admin-list">
          {pendingSurveys.map((survey) => (
            <div key={survey._id} className="admin-card">
              <div className="admin-card-info">
                <strong>{survey.farmerId?.name || 'Unknown farmer'}</strong>
                <span>
                  {survey.municipality || survey.district || survey.province
                    ? `${survey.municipality || 'N/A'}, ${survey.district || 'N/A'}, ${survey.province || 'N/A'}`
                    : 'Location not recorded'}
                </span>
                <span>{survey.farmerId?.phone || 'N/A'}</span>
              </div>
              <div className="admin-card-actions">
                <button className="btn-toggle" onClick={() => setReviewingSurvey(survey)}>
                  Review Details
                </button>
                <button className="btn-approve" onClick={() => handleVerify(survey._id, 'verified')}>
                  Approve
                </button>
                <button className="btn-reject" onClick={() => handleVerify(survey._id, 'rejected')}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full survey review modal */}
      {reviewingSurvey && (
        <div className="modal-overlay" onClick={closeReview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{reviewingSurvey.farmerId?.name || 'Unknown farmer'}'s Survey</h2>
              <button className="close-btn" onClick={closeReview}>×</button>
            </div>

            <h3 className="detail-heading">Farmer Details</h3>
            <div className="detail-grid">
              <div><span className="detail-label">Name</span><span>{reviewingSurvey.farmerId?.name || 'N/A'}</span></div>
              <div><span className="detail-label">Phone</span><span>{reviewingSurvey.farmerId?.phone || 'N/A'}</span></div>
              <div><span className="detail-label">Email</span><span>{reviewingSurvey.farmerId?.email || 'N/A'}</span></div>
              <div>
                <span className="detail-label">Home Address</span>
                <span>
                  {[reviewingSurvey.farmerId?.address?.tole, reviewingSurvey.farmerId?.address?.municipality, reviewingSurvey.farmerId?.address?.district]
                    .filter(Boolean).join(', ') || 'N/A'}
                </span>
              </div>
            </div>

            <h3 className="detail-heading">Survey Details</h3>
            <div className="detail-grid">
              <div><span className="detail-label">Age</span><span>{reviewingSurvey.age}</span></div>
              <div><span className="detail-label">Education</span><span>{reviewingSurvey.educationLevel}</span></div>
              <div><span className="detail-label">Household Members</span><span>{reviewingSurvey.householdMembers}</span></div>
            </div>

            <h3 className="detail-heading">Farm Location</h3>
            <div className="detail-grid">
              <div><span className="detail-label">Province</span><span>{reviewingSurvey.province}</span></div>
              <div><span className="detail-label">District</span><span>{reviewingSurvey.district}</span></div>
              <div><span className="detail-label">Municipality</span><span>{reviewingSurvey.municipality}</span></div>
            </div>

            <h3 className="detail-heading">Orchard</h3>
            <div className="detail-grid">
              <div><span className="detail-label">Area</span><span>{reviewingSurvey.orchardAreaKatha} katha ({reviewingSurvey.orchardAreaHectare} ha)</span></div>
              <div><span className="detail-label">Total Trees</span><span>{reviewingSurvey.totalMangoTrees}</span></div>
              <div><span className="detail-label">Self-Managed</span><span>{reviewingSurvey.selfManaged ? 'Yes' : 'No'}</span></div>
              <div><span className="detail-label">Production Cost</span><span>Rs. {reviewingSurvey.productionCostNPR || 'N/A'}</span></div>
            </div>

            {reviewingSurvey.treeAgeDistribution?.length > 0 && (
              <>
                <h3 className="detail-heading">Tree Age Distribution</h3>
                <div className="tree-age-tags">
                  {reviewingSurvey.treeAgeDistribution.map((t, i) => (
                    <span key={i} className="tree-age-tag">{t.ageRange}: {t.numberOfTrees}</span>
                  ))}
                </div>
              </>
            )}

            <h3 className="detail-heading">Production & Earnings</h3>
            <div className="detail-grid">
              <div><span className="detail-label">Total Production</span><span>{reviewingSurvey.totalProductionKg} kg</span></div>
              <div><span className="detail-label">Earnings (2082)</span><span>Rs. {reviewingSurvey.totalEarnings2082}</span></div>
              <div><span className="detail-label">Earnings (2081)</span><span>Rs. {reviewingSurvey.totalEarnings2081}</span></div>
              <div><span className="detail-label">Growth</span><span>{reviewingSurvey.earningsGrowth ?? 'N/A'}%</span></div>
              <div><span className="detail-label">Satisfaction</span><span>{reviewingSurvey.satisfactionLevel}/10</span></div>
            </div>

            <h3 className="detail-heading">Assistance Received</h3>
            <div className="detail-grid">
              <div>
                <span className="detail-label">Government</span>
                <span>{reviewingSurvey.receivedGovernmentAssistance ? (reviewingSurvey.governmentOfficeSource || 'Yes') : 'None'}</span>
              </div>
              <div>
                <span className="detail-label">NGO / Other</span>
                <span>{reviewingSurvey.receivedNonGovernmentAssistance ? (reviewingSurvey.nonGovernmentSource || 'Yes') : 'None'}</span>
              </div>
            </div>

            {(reviewingSurvey.productionChallenges || reviewingSurvey.marketingChallenges || reviewingSurvey.suggestions) && (
              <>
                <h3 className="detail-heading">Challenges & Suggestions</h3>
                {reviewingSurvey.productionChallenges && (
                  <p className="detail-note"><strong>Production:</strong> {reviewingSurvey.productionChallenges}</p>
                )}
                {reviewingSurvey.marketingChallenges && (
                  <p className="detail-note"><strong>Marketing:</strong> {reviewingSurvey.marketingChallenges}</p>
                )}
                {reviewingSurvey.suggestions && (
                  <p className="detail-note"><strong>Suggestions:</strong> {reviewingSurvey.suggestions}</p>
                )}
              </>
            )}

            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button className="btn-submit" onClick={() => handleVerify(reviewingSurvey._id, 'verified')}>
                Approve
              </button>
              <button className="btn-cancel" onClick={() => handleVerify(reviewingSurvey._id, 'rejected')}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
