import React from 'react';
export default function PageBanner({ variant, eyebrow, title, subtitle, children }) {
  return (
    <div className={`page-banner page-banner--${variant}`}>
      <div className="page-banner__content">
        {eyebrow && <span className="page-banner__eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p className="page-banner__subtitle">{subtitle}</p>}
        {children && <div className="page-banner__actions">{children}</div>}
      </div>
    </div>
  );
}
