import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFarms } from '../api/farms';
import { getSurveys, getSurveyStats } from '../api/surveys';
import { getBuyingRequirements } from '../api/trader';
import { getDashboardStats } from '../api/admin';
import { Loading, ErrorBox } from '../components/Status';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        if (user.role === 'farmer') {
          const [farmsRes, surveysRes] = await Promise.all([
            getFarms({ limit: 5 }),
            getSurveys({ limit: 5 }),
          ]);
          if (!cancelled) {
            setData({
              farmCount: farmsRes.data.total,
              recentFarms: farmsRes.data.farms,
              surveyCount: surveysRes.data.total,
              recentSurveys: surveysRes.data.surveys,
            });
          }
        } else if (user.role === 'trader') {
          const reqRes = await getBuyingRequirements({ limit: 5 });
          if (!cancelled) {
            setData({ requirementCount: reqRes.data.total, recentRequirements: reqRes.data.requirements });
          }
        } else if (user.role === 'surveyor') {
          const statsRes = await getSurveyStats();
          if (!cancelled) setData({ stats: statsRes.data.stats });
        } else if (user.role === 'admin') {
          const statsRes = await getDashboardStats();
          if (!cancelled) setData(statsRes.data);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load dashboard data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user.role]);

  return (
    <div className="page">
      <h1>Welcome back, {user.name.split(' ')[0]}</h1>
      <p className="page__subtitle">Here's what's happening on your account.</p>

      {loading && <Loading label="Loading dashboard..." />}
      <ErrorBox message={error} />

      {!loading && !error && user.role === 'farmer' && data && (
        <>
          <div className="stat-grid">
            <StatCard label="Farms registered" value={data.farmCount} />
            <StatCard label="Surveys submitted" value={data.surveyCount} />
          </div>
          <QuickLinks
            links={[
              { to: '/farms', label: 'Manage farms' },
              { to: '/surveys', label: 'Manage surveys' },
              { to: '/requirements', label: 'View buyer requests' },
              { to: '/market', label: 'Check market prices' },
            ]}
          />
        </>
      )}

      {!loading && !error && user.role === 'trader' && data && (
        <>
          <div className="stat-grid">
            <StatCard label="Open buying requirements" value={data.requirementCount} />
          </div>
          <QuickLinks
            links={[
              { to: '/requirements', label: 'Manage buying requirements' },
              { to: '/market', label: 'Check market prices' },
            ]}
          />
        </>
      )}

      {!loading && !error && user.role === 'surveyor' && data && (
        <>
          <div className="stat-grid">
            <StatCard label="Total surveys" value={data.stats?.totalSurveys ?? 0} />
            <StatCard label="Avg. production (kg)" value={round(data.stats?.averageProduction)} />
            <StatCard label="Avg. satisfaction" value={round(data.stats?.averageSatisfaction)} />
          </div>
          <QuickLinks links={[{ to: '/surveys', label: 'Manage surveys' }]} />
        </>
      )}

      {!loading && !error && user.role === 'admin' && data && (
        <>
          <div className="stat-grid">
            <StatCard label="Total users" value={data.stats?.totalUsers} />
            <StatCard label="Farmers" value={data.stats?.totalFarmers} />
            <StatCard label="Traders" value={data.stats?.totalTraders} />
            <StatCard label="Total surveys" value={data.stats?.totalSurveys} />
            <StatCard label="Verified surveys" value={data.stats?.completedSurveys} />
            <StatCard label="Open buying requirements" value={data.stats?.totalBuyingRequirements} />
          </div>
          <QuickLinks links={[{ to: '/admin', label: 'Open admin panel' }]} />
        </>
      )}
    </div>
  );
}

function round(n) {
  return typeof n === 'number' ? Math.round(n * 100) / 100 : '—';
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-card__value">{value ?? '—'}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  );
}

function QuickLinks({ links }) {
  return (
    <div className="quick-links">
      {links.map((l) => (
        <Link key={l.to} to={l.to} className="quick-link">{l.label} →</Link>
      ))}
    </div>
  );
}