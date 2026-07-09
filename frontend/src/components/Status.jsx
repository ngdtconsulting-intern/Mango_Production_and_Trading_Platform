import React from 'react';

export function Loading({ label = 'Loading...' }) {
  return <div className="status status--loading">{label}</div>;
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return <div className="status status--error">{message}</div>;
}

export function EmptyState({ message }) {
  return <div className="status status--empty">{message}</div>;
}