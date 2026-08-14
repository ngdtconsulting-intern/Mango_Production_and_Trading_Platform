import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ size = 'sm', dark = false, markOnly = false, to = '/', className = '', onClick }) {
  const classes = ['nmmb-logo', size === 'lg' ? 'nmmb-logo--lg' : '', dark ? 'nmmb-logo--dark' : '', markOnly ? 'nmmb-logo--mark' : '', className]
    .filter(Boolean)
    .join(' ');

  if (markOnly) {
    return (
      <Link to={to} className={classes} onClick={onClick} aria-label="National Mango Marketing Board, home">
        <span className="nmmb-logo__bar" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link to={to} className={classes} onClick={onClick} aria-label="National Mango Marketing Board, home">
      <span className="nmmb-logo__bar" aria-hidden="true" />
      <span className="nmmb-logo__text">
        <span className="nmmb-logo__top">
          National <span className="nmmb-logo__accent">Mango</span>
        </span>
        <span className="nmmb-logo__bottom">Marketing Board</span>
      </span>
    </Link>
  );
}
