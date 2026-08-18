import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import {
  calculateExpectedProduction,
  calculateYieldGap,
  censusYearOptions,
  getCurrentBsYear,
  YIELD_FLAGS,
  YIELD_FLAG_LABELS,
  formatKg,
} from '../../utils/treeAgeYield';
import '../../styles/dashboard.css';
import '../../styles/directory.css';
import '../../styles/census.css';

/**
 * Expected production is recomputed here from the survey's own tree ages so the
 * officer sees the working, not just a stored number. It agrees with the
 * `expectedProductionKg` the backend saved, because both read the same table.
 */
const reviewFigures = (survey) => {
  const expected = calculateExpectedProduction(survey?.treeAgeDistribution);
  const gap = calculateYieldGap(
    expected.expectedKg,
    survey?.totalProductionKg,
    expected.totalTrees
  );
  return { expected, gap };
};

export default function PendingSurveys() {
  const [loading, setLoading] = useState(true);
  const [pendingSurveys, setPendingSurveys] = useState([]);
  const [reviewingSurvey, setReviewingSurvey] = useState(null);
  const [year, setYear] = useState(getCurrentBsYear());

  useEffect(() => {
    fetchSurveys();
  }, [year]);

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/surveys', {
        params: { status: 'submitted', year, limit: 100 },
      });
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

      <div className="filters-section">
        <div className="filter-group">
          <label>Census year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {censusYearOptions().map((y) => (
              <option key={y} value={y}>{y} BS</option>
            ))}
          </select>
        </div>
      </div>

      <h2>Pending Surveys ({pendingSurveys.length})</h2>
      {loading ? (
        <p className="loading">Loading surveys...</p>
      ) : pendingSurveys.length === 0 ? (
        <p>No surveys awaiting review for {year} BS.</p>
      ) : (
        <div className="admin-list">
          {pendingSurveys.map((survey) => {
            const { gap } = reviewFigures(survey);
            return (
            <div key={survey._id} className="admin-card">
              <div className="admin-card-info">
                <strong>{survey.farmerId?.name || 'Unknown farmer'}</strong>
                <span>
                  {survey.municipality || survey.district || survey.province
                    ? `${survey.municipality || 'N/A'}, ${survey.district || 'N/A'}, ${survey.province || 'N/A'}`
                    : 'Location not recorded'}
                </span>
                <span>{survey.farmerId?.phone || 'N/A'}</span>
                {/* Surface the cross-check in the list so an officer can triage
                    without opening every record. */}
                <span className={`yield-pill yield-pill--${gap.flag}`}>
                  {YIELD_FLAG_LABELS[gap.flag]}
                  {gap.gapPercent !== null && ` · ${gap.gapPercent > 0 ? '+' : ''}${gap.gapPercent}%`}
                </span>
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
            );
          })}
        </div>
      )}

      {/* Full survey review modal */}
      {reviewingSurvey && (
        <div className="modal-overlay" onClick={closeReview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {reviewingSurvey.farmerId?.name || 'Unknown farmer'} · {reviewingSurvey.surveyYearBS} BS
              </h2>
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

            {(() => {
              const { expected, gap } = reviewFigures(reviewingSurvey);
              const declared = reviewingSurvey.totalMangoTrees || 0;
              const mismatch = expected.totalTrees > 0 && declared > 0 && expected.totalTrees !== declared;

              return (
                <>
                  <h3 className="detail-heading">Tree Age Distribution &amp; Expected Production</h3>

                  {expected.totalTrees === 0 ? (
                    <p className="empty-message-small">
                      No tree ages recorded — expected production cannot be checked for this survey.
                    </p>
                  ) : (
                    <>
                      <table className="yield-table">
                        <thead>
                          <tr>
                            <th>Age bracket</th>
                            <th>Trees</th>
                            <th>Per tree</th>
                            <th>Expected</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expected.perBracket
                            .filter((b) => b.trees > 0)
                            .map((b) => (
                              <tr key={b.key}>
                                <td>{b.label}</td>
                                <td>{b.trees}</td>
                                <td>{b.kgPerTree === 0 ? '—' : `${b.kgPerTree} kg`}</td>
                                <td>{b.expectedKg === 0 ? '—' : formatKg(b.expectedKg)}</td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td>Total</td>
                            <td>{expected.totalTrees}</td>
                            <td>{expected.bearingTrees} bearing</td>
                            <td>{formatKg(expected.expectedKg)}</td>
                          </tr>
                        </tfoot>
                      </table>

                      {mismatch && (
                        <p className="expected-panel__warn">
                          Age brackets total {expected.totalTrees} trees, but the survey declares{' '}
                          {declared} total mango trees. Ask the farmer to reconcile.
                        </p>
                      )}

                      {/* The cross-check the officer signs off on. */}
                      <div className={`yield-check yield-check--${gap.flag}`}>
                        <div className="yield-check__head">
                          <span className="yield-check__dot" />
                          <strong>{YIELD_FLAG_LABELS[gap.flag]}</strong>
                        </div>
                        <div className="yield-check__figures">
                          <div>
                            <span className="detail-label">Expected</span>
                            <span>{formatKg(expected.expectedKg)}</span>
                          </div>
                          <div>
                            <span className="detail-label">Reported</span>
                            <span>{formatKg(reviewingSurvey.totalProductionKg)}</span>
                          </div>
                          <div>
                            <span className="detail-label">Difference</span>
                            <span>
                              {gap.gapKg > 0 ? '+' : ''}{formatKg(gap.gapKg)}
                              {gap.gapPercent !== null && ` (${gap.gapPercent > 0 ? '+' : ''}${gap.gapPercent}%)`}
                            </span>
                          </div>
                          <div>
                            <span className="detail-label">Usual range</span>
                            <span>{formatKg(expected.minKg)} – {formatKg(expected.maxKg)}</span>
                          </div>
                        </div>
                        {gap.flag !== YIELD_FLAGS.OK && (
                          <p className="yield-check__foot">
                            A difference this size is not automatically wrong — hail, drought or a
                            poor flowering year all produce it. Confirm the figure with the farmer
                            before approving or rejecting.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </>
              );
            })()}

            <h3 className="detail-heading">Production &amp; Earnings</h3>
            <div className="detail-grid">
              <div><span className="detail-label">Total Production</span><span>{reviewingSurvey.totalProductionKg} kg</span></div>
              <div>
                <span className="detail-label">Earnings ({reviewingSurvey.surveyYearBS})</span>
                <span>Rs. {reviewingSurvey.earningsCurrentYearNPR ?? reviewingSurvey.totalEarnings2082 ?? 0}</span>
              </div>
              <div>
                <span className="detail-label">Earnings ({reviewingSurvey.surveyYearBS - 1})</span>
                <span>Rs. {reviewingSurvey.earningsPreviousYearNPR ?? reviewingSurvey.totalEarnings2081 ?? 0}</span>
              </div>
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
