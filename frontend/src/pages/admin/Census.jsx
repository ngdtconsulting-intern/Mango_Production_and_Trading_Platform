import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiDownload, FiChevronRight } from 'react-icons/fi';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import CensusReport from '../../components/CensusReport';
import { censusYearOptions, getCurrentBsYear } from '../../utils/treeAgeYield';
import '../../styles/dashboard.css';
import '../../styles/directory.css';
import '../../styles/census.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All records' },
  { value: 'verified', label: 'Verified only' },
  { value: 'submitted', label: 'Awaiting verification' },
  { value: 'rejected', label: 'Rejected' },
];

/**
 * National census view.
 *
 * The same endpoint serves every tier: with no location filter it groups by
 * province, with a province it groups by districts inside it, with a district
 * it groups by municipality. Drilling in is therefore just a matter of adding
 * a filter — the page never assembles totals itself, so the figures an admin
 * reads always match the ones the district officer sees.
 */
export default function AdminCensus() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [census, setCensus] = useState(null);

  const [year, setYear] = useState(getCurrentBsYear());
  const [status, setStatus] = useState('verified');

  // Position in the hierarchy. Both null = the national view.
  const [province, setProvince] = useState(null);
  const [district, setDistrict] = useState(null);

  useEffect(() => {
    fetchCensus();
  }, [year, status, province, district]);

  const locationParams = () => ({
    province: province || undefined,
    district: district || undefined,
  });

  const fetchCensus = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/surveys/census', {
        params: { year, status: status || undefined, ...locationParams() },
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

  /** Clicking a row goes one level deeper. */
  const handleDrill = (name) => {
    if (!province) setProvince(name);
    else if (!district) setDistrict(name);
  };

  const goNational = () => {
    setProvince(null);
    setDistrict(null);
  };
  const goProvince = () => setDistrict(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get('/surveys/census/export', {
        params: { year, status: status || undefined, ...locationParams() },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Mirrors the server's own naming, so the file says which tier it covers.
      const slug = (district || province || 'nepal').toLowerCase().replace(/\s+/g, '-');
      link.setAttribute('download', `mango-census-${year}-${slug}.csv`);
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

  const hasRecords = census?.totals?.farmers > 0;

  return (
    <div className="dashboard-container">
      <PageBanner
        variant="admin"
        eyebrow="Admin dashboard"
        title="National Mango Census"
        subtitle="Production figures for the whole country, compiled from verified farmer surveys. Open a province, then a district, to see how the national total is made up."
      />

      {/* ---------- Breadcrumb ---------- */}
      <nav className="census-crumbs" aria-label="Census location">
        <button
          className={`census-crumb ${!province ? 'census-crumb--current' : ''}`}
          onClick={goNational}
          disabled={!province}
        >
          Nepal
        </button>
        {province && (
          <>
            <FiChevronRight className="census-crumb-sep" />
            <button
              className={`census-crumb ${!district ? 'census-crumb--current' : ''}`}
              onClick={goProvince}
              disabled={!district}
            >
              {province}
            </button>
          </>
        )}
        {district && (
          <>
            <FiChevronRight className="census-crumb-sep" />
            <span className="census-crumb census-crumb--current">{district}</span>
          </>
        )}
      </nav>

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
          <label>Viewing</label>
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
          {(district || province) && ` in ${district || province}`}
          {status && ` with status "${STATUS_OPTIONS.find((o) => o.value === status)?.label}"`}.
        </p>
      ) : (
        <CensusReport census={census} onDrill={handleDrill} />
      )}
    </div>
  );
}
