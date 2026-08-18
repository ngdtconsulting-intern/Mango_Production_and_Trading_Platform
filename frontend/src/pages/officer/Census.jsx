import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FiUsers, FiDownload, FiTrendingUp, FiMapPin, FiLayers, FiCheckCircle,
} from 'react-icons/fi';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import StatusBadge from '../../components/StatusBadge';
import {
  TREE_AGE_BRACKETS,
  censusYearOptions,
  getCurrentBsYear,
  calculateYieldGap,
  countTrees,
  YIELD_FLAG_LABELS,
  formatKg,
  formatMT,
} from '../../utils/treeAgeYield';
import '../../styles/dashboard.css';
import '../../styles/directory.css';
import '../../styles/census.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All records' },
  { value: 'verified', label: 'Verified only' },
  { value: 'submitted', label: 'Awaiting verification' },
  { value: 'rejected', label: 'Rejected' },
];

export default function OfficerCensus() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [census, setCensus] = useState(null);

  const [year, setYear] = useState(getCurrentBsYear());
  const [status, setStatus] = useState('verified');

  useEffect(() => {
    fetchCensus();
  }, [year, status]);

  const fetchCensus = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/surveys/census', {
        params: { year, status: status || undefined },
      });
      setCensus(data);
    } catch (error) {
      console.error('Error fetching census:', error);
      toast.error(error.response?.data?.message || 'Failed to load census data');
      setCensus(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * The CSV comes back as a file body rather than JSON, so it is fetched as a
   * blob and handed to the browser as a download.
   */
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get('/surveys/census/export', {
        params: { year, status: status || undefined },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mango-census-${year}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Census ${year} BS exported`);
    } catch (error) {
      toast.error('Failed to export census');
    } finally {
      setExporting(false);
    }
  };

  const totals = census?.totals;
  const hasRecords = totals?.farmers > 0;

  return (
    <div className="dashboard-container">
      <PageBanner
        variant="admin"
        eyebrow="Officer dashboard"
        title="Annual Mango Census"
        subtitle="The year's production register for your coverage area — recorded from farmer surveys, checked against standard tree-age yields, and exportable for the district office."
      />

      <div className="filters-section">
        <div className="filter-group">
          <label>Census year</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {(census?.availableYears || censusYearOptions()).map((y) => (
              <option key={y} value={y}>{y} BS</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Records</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Coverage</label>
          <input value={census?.scope || '—'} readOnly />
        </div>
        <div className="filter-group filter-group--action">
          <button className="btn-primary" onClick={handleExport} disabled={exporting || !hasRecords}>
            <FiDownload /> {exporting ? 'Preparing...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading">Loading census...</p>
      ) : !hasRecords ? (
        <p className="empty-message">
          No census records for {year} BS
          {status && ` with status "${STATUS_OPTIONS.find((o) => o.value === status)?.label}"`}.
        </p>
      ) : (
        <>
          {/* ---------- Headline figures ---------- */}
          <div className="stats-grid">
            <div className="stat-card green">
              <div className="stat-card-icon"><FiUsers /></div>
              <p className="stat-label">Farmers Recorded</p>
              <p className="stat-value">{totals.farmers}</p>
            </div>
            <div className="stat-card gold">
              <div className="stat-card-icon"><FiLayers /></div>
              <p className="stat-label">Mango Trees</p>
              <p className="stat-value">{totals.totalTrees.toLocaleString('en-IN')}</p>
              <p className="stat-sub">{totals.bearingTrees.toLocaleString('en-IN')} bearing</p>
            </div>
            <div className="stat-card blue">
              <div className="stat-card-icon"><FiMapPin /></div>
              <p className="stat-label">Orchard Area</p>
              <p className="stat-value">{totals.orchardAreaHectare}</p>
              <p className="stat-sub">hectares</p>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon"><FiTrendingUp /></div>
              <p className="stat-label">Reported Production</p>
              <p className="stat-value">{totals.reportedProductionMT}</p>
              <p className="stat-sub">MT · expected {totals.expectedProductionMT} MT</p>
            </div>
          </div>

          {/* ---------- Expected vs reported ---------- */}
          <div className="census-panel">
            <h2>Expected vs Reported</h2>
            <p className="census-panel__intro">
              Expected production is each orchard&apos;s tree count multiplied by the standard
              yield for that tree age, summed across the whole area. It is a reference
              baseline for planning, not a target.
            </p>
            <div className="census-compare">
              <div className="census-compare__item">
                <span className="detail-label">Expected</span>
                <strong>{formatMT(totals.expectedProductionKg)}</strong>
                <span className="census-compare__sub">{formatKg(totals.expectedProductionKg)}</span>
              </div>
              <div className="census-compare__item">
                <span className="detail-label">Reported</span>
                <strong>{formatMT(totals.reportedProductionKg)}</strong>
                <span className="census-compare__sub">{formatKg(totals.reportedProductionKg)}</span>
              </div>
              <div className="census-compare__item">
                <span className="detail-label">Difference</span>
                <strong className={totals.gapKg < 0 ? 'is-negative' : 'is-positive'}>
                  {totals.gapKg > 0 ? '+' : ''}{formatMT(totals.gapKg)}
                </strong>
                <span className="census-compare__sub">
                  {totals.gapPercent === null
                    ? 'no tree age data'
                    : `${totals.gapPercent > 0 ? '+' : ''}${totals.gapPercent}% vs expected`}
                </span>
              </div>
              <div className="census-compare__item">
                <span className="detail-label">Avg Satisfaction</span>
                <strong>{totals.averageSatisfaction}</strong>
                <span className="census-compare__sub">out of 10</span>
              </div>
            </div>

            {/* Review flags across the cohort */}
            {Object.keys(totals.flagCounts || {}).length > 0 && (
              <div className="tree-age-tags" style={{ marginTop: 14 }}>
                {Object.entries(totals.flagCounts).map(([flag, count]) => (
                  <span key={flag} className={`yield-pill yield-pill--${flag}`}>
                    {YIELD_FLAG_LABELS[flag] || flag}: {count}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ---------- Tree age profile ---------- */}
          <div className="census-panel">
            <h2>Tree Age Profile</h2>
            <p className="census-panel__intro">
              The age structure of the orchard stock across your area. Young brackets
              indicate future production coming on stream; the 40+ bracket indicates
              replanting need.
            </p>
            <div className="admin-table-wrap">
              <table className="admin-table yield-table">
                <thead>
                  <tr>
                    <th>Age of mango tree</th>
                    <th>Trees recorded</th>
                    <th>Share</th>
                    <th>Planning value</th>
                    <th>Expected production</th>
                  </tr>
                </thead>
                <tbody>
                  {census.treeAgeProfile.map((row) => {
                    const share = totals.totalTrees
                      ? ((row.trees / totals.totalTrees) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <tr key={row.key}>
                        <td>{row.label}</td>
                        <td>{row.trees.toLocaleString('en-IN')}</td>
                        <td>
                          <div className="share-bar">
                            <div className="share-bar__fill" style={{ width: `${share}%` }} />
                            <span>{share}%</span>
                          </div>
                        </td>
                        <td>{row.kgPerTree === 0 ? '—' : `${row.kgPerTree} kg/tree`}</td>
                        <td>{row.expectedKg === 0 ? '—' : formatKg(row.expectedKg)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---------- Breakdown ---------- */}
          <div className="census-panel">
            <h2>By {census.groupedBy === 'municipality' ? 'Municipality' : 'District'}</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{census.groupedBy === 'municipality' ? 'Municipality' : 'District'}</th>
                    <th>Farmers</th>
                    <th>Trees</th>
                    <th>Area (ha)</th>
                    <th>Expected</th>
                    <th>Reported</th>
                    <th>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {census.breakdown.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.farmers}</td>
                      <td>{row.totalTrees.toLocaleString('en-IN')}</td>
                      <td>{row.orchardAreaHectare}</td>
                      <td>{formatMT(row.expectedProductionKg)}</td>
                      <td>{formatMT(row.reportedProductionKg)}</td>
                      <td className={row.gapKg < 0 ? 'is-negative' : 'is-positive'}>
                        {row.gapPercent === null
                          ? '—'
                          : `${row.gapPercent > 0 ? '+' : ''}${row.gapPercent}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---------- Full register ---------- */}
          <div className="census-panel">
            <h2>Census Register ({census.surveys.length})</h2>
            <p className="census-panel__intro">
              Every record filed for {year} BS. Export the CSV for the district office file.
            </p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Farmer</th>
                    <th>Municipality</th>
                    <th>Area (ha)</th>
                    <th>Trees</th>
                    <th>Expected</th>
                    <th>Reported</th>
                    <th>Check</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {census.surveys.map((s) => {
                    const gap = calculateYieldGap(
                      s.expectedProductionKg,
                      s.totalProductionKg,
                      countTrees(s.treeAgeDistribution)
                    );
                    return (
                      <tr key={s._id}>
                        <td>{s.farmerId?.name || 'Unknown'}</td>
                        <td>{s.municipality || '—'}</td>
                        <td>{s.orchardAreaHectare ?? '—'}</td>
                        <td>
                          {s.totalMangoTrees}
                          {s.bearingTreeCount > 0 && (
                            <span className="cell-sub"> ({s.bearingTreeCount} bearing)</span>
                          )}
                        </td>
                        <td>{formatKg(s.expectedProductionKg)}</td>
                        <td>{formatKg(s.totalProductionKg)}</td>
                        <td>
                          <span className={`yield-pill yield-pill--${gap.flag}`}>
                            {gap.gapPercent === null
                              ? YIELD_FLAG_LABELS[gap.flag]
                              : `${gap.gapPercent > 0 ? '+' : ''}${gap.gapPercent}%`}
                          </span>
                        </td>
                        <td><StatusBadge status={s.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---------- Reference table ---------- */}
          <div className="census-panel census-panel--reference">
            <h2><FiCheckCircle /> Yield Reference Used</h2>
            <p className="census-panel__intro">
              Every expected-production figure on this page comes from this table. No
              estimation or prediction model is involved — the arithmetic is
              trees × kg-per-tree, and it can be reproduced by hand.
            </p>
            <div className="admin-table-wrap">
              <table className="admin-table yield-table">
                <thead>
                  <tr>
                    <th>Age of mango tree</th>
                    <th>Indicative production/tree/year</th>
                    <th>Suggested planning value</th>
                  </tr>
                </thead>
                <tbody>
                  {TREE_AGE_BRACKETS.map((b) => (
                    <tr key={b.key}>
                      <td>{b.label}</td>
                      <td>
                        {b.minKg === b.maxKg ? `${b.minKg} kg` : `${b.minKg}–${b.maxKg} kg`}
                        <span className="cell-sub"> · {b.note}</span>
                      </td>
                      <td><strong>{b.kgPerTree} kg</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
