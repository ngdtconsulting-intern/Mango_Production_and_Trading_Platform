import React from 'react';
import { FiCheckCircle, FiXCircle, FiClock, FiRefreshCw, FiCircle } from 'react-icons/fi';

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: FiClock, className: 'pending' },
  submitted: { label: 'Submitted', icon: FiClock, className: 'pending' },
  open: { label: 'Open', icon: FiCircle, className: 'open' },
  'in-progress': { label: 'In Progress', icon: FiRefreshCw, className: 'in-progress' },
  accepted: { label: 'Accepted', icon: FiCheckCircle, className: 'accepted' },
  verified: { label: 'Verified', icon: FiCheckCircle, className: 'accepted' },
  active: { label: 'Active', icon: FiCheckCircle, className: 'accepted' },
  resolved: { label: 'Resolved', icon: FiCheckCircle, className: 'accepted' },
  completed: { label: 'Completed', icon: FiCheckCircle, className: 'completed' },
  rejected: { label: 'Rejected', icon: FiXCircle, className: 'rejected' },
  inactive: { label: 'Inactive', icon: FiXCircle, className: 'rejected' },
  cancelled: { label: 'Cancelled', icon: FiXCircle, className: 'rejected' },
  expired: { label: 'Expired', icon: FiClock, className: 'expired' },
  draft: { label: 'Draft', icon: FiCircle, className: 'expired' },
};

export default function StatusBadge({ status, label }) {
  const config = STATUS_CONFIG[status] || { label: status, icon: FiCircle, className: '' };
  const Icon = config.icon;

  return (
    <span className={`status-badge ${config.className}`}>
      <Icon className="status-badge__icon" />
      {label || config.label}
    </span>
  );
}
