const statusClass = {
  Open: 'badge-open',
  'In Progress': 'badge-progress',
  'Pending Customer': 'badge-medium',
  Resolved: 'badge-resolved',
  Closed: 'badge-resolved',
};

export default function StatusBadge({ status = 'Open' }) {
  return <span className={statusClass[status] || 'badge-open'}>{status}</span>;
}
