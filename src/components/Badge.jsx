const STATUS_CLASS = {
  'Pending': 'badge-pending',
  'In Progress': 'badge-progress',
  'Resolved': 'badge-resolved',
  'Closed': 'badge-closed'
};

const PRIORITY_CLASS = {
  Low: 'badge-low',
  Medium: 'badge-medium',
  High: 'badge-high',
  Critical: 'badge-critical'
};

export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASS[status] || ''}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge ${PRIORITY_CLASS[priority] || ''}`}>{priority}</span>;
}
