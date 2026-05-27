const statusClass = {
  Open: 'badge-open',
  'In Progress': 'badge-progress',
  'Pending Customer': 'badge-progress',
  Resolved: 'badge-resolved',
  Closed: 'badge-resolved',
};

export default function StatusBadge({ status = 'Open' }) {
  return (
    <span className={statusClass[status] || 'badge-open'}>
      {status}
    </span>
  );
}
