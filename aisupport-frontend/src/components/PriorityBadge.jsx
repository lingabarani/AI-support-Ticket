const priorityClass = {
  Low: 'badge-low',
  Medium: 'badge-medium',
  High: 'badge-high',
  Urgent: 'badge-high',
};

export default function PriorityBadge({ priority = 'Medium' }) {
  return <span className={priorityClass[priority] || 'badge-medium'}>{priority}</span>;
}
