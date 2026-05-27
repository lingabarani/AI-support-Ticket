const priorityClass = {
  Urgent: 'badge-high',
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
};

export default function PriorityBadge({ priority = 'Medium' }) {
  return (
    <span className={priorityClass[priority] || 'badge-medium'}>
      {priority}
    </span>
  );
}
