import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Home() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="home">
      <header className="home__nav">
        <div className="navbar__brand">
          <span className="navbar__logo">🥭</span>
          <span>Aam Bazaar</span>
        </div>
        <div className="home__nav-actions">
          {user ? (
            <Link to={`/${user.role}/dashboard`} className="btn btn--primary">Go to dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost">Log in</Link>
              <Link to="/register" className="btn btn--primary">Register</Link>
            </>
          )}
        </div>
      </header>

      <section className="home__hero">
        <div className="home__hero-glow" />
        <span className="home__eyebrow">🌱 Farm to market, in one platform</span>
        <h1>
          Connecting mango <span className="text-gradient">farmers</span>,{' '}
          <span className="text-gradient">traders</span>, and markets in one place
        </h1>
        <p className="home__hero-subtitle">
          Register your orchard, track production surveys, check live market prices,
          and match directly with buyers — all in a single platform built for
          Nepal's mango supply chain.
        </p>
        {!user && (
          <div className="home__hero-actions">
            <Link to="/register" className="btn btn--primary btn--lg">Get started — it's free</Link>
            <Link to="/login" className="btn btn--ghost btn--lg">I already have an account</Link>
          </div>
        )}
        <div className="home__hero-badges">
          <span>🔒 Secure accounts</span>
          <span>📊 Live analytics</span>
          <span>🤝 No middleman</span>
        </div>
      </section>

      <section className="home__stats">
        <div className="home__stat">
          <div className="home__stat-value">7+</div>
          <div className="home__stat-label">Markets tracked</div>
        </div>
        <div className="home__stat">
          <div className="home__stat-value">3</div>
          <div className="home__stat-label">User roles supported</div>
        </div>
        <div className="home__stat">
          <div className="home__stat-value">100%</div>
          <div className="home__stat-label">Direct farmer–trader matching</div>
        </div>
      </section>

      <section className="home__section">
        <span className="home__section-tag">Why Aam Bazaar</span>
        <h2 className="home__section-title">Built for every role in the chain</h2>
        <p className="home__section-subtitle">Each account type gets a dashboard tailored to what they actually need to do.</p>

        <div className="home__features">
          <div className="card card--hover">
            <div className="card__icon card__icon--green">🌳</div>
            <h3>For Farmers</h3>
            <p className="card__meta">
              Register your farms with location and orchard details, submit production
              surveys, and respond directly to buyer requirements with your own price offers.
            </p>
          </div>
          <div className="card card--hover">
            <div className="card__icon card__icon--orange">📦</div>
            <h3>For Traders</h3>
            <p className="card__meta">
              Post buying requirements by variety, quantity, quality, and budget —
              then review offers as farmers respond, without a middleman.
            </p>
          </div>
          <div className="card card--hover">
            <div className="card__icon card__icon--blue">⚙️</div>
            <h3>For Admin</h3>
            <p className="card__meta">
              Oversee the whole platform: verify farmer surveys, monitor aggregate
              production and pricing reports, and manage user accounts.
            </p>
          </div>
        </div>
      </section>

      <section className="home__section home__section--muted">
        <span className="home__section-tag">Simple process</span>
        <h2 className="home__section-title">How it works</h2>
        <div className="home__steps">
          <div className="home__step">
            <div className="home__step-number">1</div>
            <h3>Create your account</h3>
            <p className="card__meta">Register in under a minute and choose the role that fits you — farmer, trader, or admin.</p>
          </div>
          <div className="home__step">
            <div className="home__step-number">2</div>
            <h3>Set up your profile</h3>
            <p className="card__meta">Farmers register orchards and surveys; traders post what they're looking to buy.</p>
          </div>
          <div className="home__step">
            <div className="home__step-number">3</div>
            <h3>Connect and trade</h3>
            <p className="card__meta">Respond to requirements, check live prices, and close deals directly on the platform.</p>
          </div>
        </div>
      </section>

      {!user && (
        <section className="home__cta">
          <h2>Ready to get started?</h2>
          <p>Join as a farmer, trader, or admin — it only takes a minute.</p>
          <Link to="/register" className="btn btn--white btn--lg">Create your account</Link>
        </section>
      )}

      <footer className="home__footer">
        <div className="navbar__brand">
          <span className="navbar__logo">🥭</span>
          <span>Aam Bazaar</span>
        </div>
        <p className="home__footer-copy">© {new Date().getFullYear()} Mango Production and Trading Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}