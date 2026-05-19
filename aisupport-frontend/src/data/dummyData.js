import demoTickets from './demoTickets';
import demoUsers from './demoUsers';

const countBy = (items, selector) => items.reduce((acc, item) => {
  const key = selector(item);
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const statusKey = (status) => {
  if (status === 'Resolved') return 'resolved';
  if (status === 'In Progress') return 'inProgress';
  return 'open';
};

const dateText = (value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const tickets = demoTickets.map((ticket) => ({
  ...ticket,
  id: ticket.ticket_id,
  subject: ticket.ticket_description,
  customer: ticket.customer_name,
  customerEmail: ticket.customer_email,
  category: ticket.issue_category,
  agent: ticket.assigned_agent,
  created: dateText(ticket.ticket_created_date),
  updated: dateText(ticket.ticket_updated_date),
  sentiment: ticket.ai_sentiment,
  slaHours: Number(ticket.resolution_time_hours || 0).toFixed(1),
  slaBreached: Boolean(ticket.sla_breached),
  satisfaction: Number(ticket.customer_satisfaction || 0),
}));

export const agents = demoUsers.filter((user) => user.role === 'Support Agent').map((user) => {
  const assigned = tickets.filter((ticket) => ticket.agent === user.name);
  const resolved = assigned.filter((ticket) => ticket.status === 'Resolved').length;
  const slaMet = assigned.filter((ticket) => !ticket.slaBreached).length;
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    tickets: assigned.length,
    resolved,
    sla: assigned.length ? Math.round((slaMet / assigned.length) * 100) : user.sla_score,
    avgTime: `${Math.round(assigned.reduce((sum, ticket) => sum + Number(ticket.slaHours || 0), 0) / Math.max(assigned.length, 1))} hrs`,
    status: user.status,
  };
});

export const users = demoUsers.map((user, index) => ({
  id: index + 1,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  created: dateText(user.last_login),
  permissions: user.permissions,
}));

const priorityCounts = countBy(tickets, (ticket) => ticket.priority);
export const priorityData = [
  { name: 'High', value: priorityCounts.High || 0, color: '#f87171' },
  { name: 'Medium', value: priorityCounts.Medium || 0, color: '#fbbf24' },
  { name: 'Low', value: priorityCounts.Low || 0, color: '#4ade80' },
];

const categoryCounts = countBy(tickets, (ticket) => ticket.category || 'Other');
export const categoryData = Object.entries(categoryCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([name, value]) => ({ name, value }));

const trendMap = tickets.reduce((acc, ticket) => {
  const date = ticket.created;
  acc[date] = acc[date] || { date, open: 0, resolved: 0, inProgress: 0 };
  acc[date][statusKey(ticket.status)] += 1;
  return acc;
}, {});

export const ticketTrendData = Object.values(trendMap).slice(-7);

const sentimentMap = tickets.reduce((acc, ticket) => {
  const date = ticket.created;
  acc[date] = acc[date] || { date, positive: 0, neutral: 0, negative: 0 };
  acc[date][ticket.sentiment.toLowerCase()] += 1;
  return acc;
}, {});

export const sentimentTrend = Object.values(sentimentMap).slice(-7);

export const churnData = Object.values(tickets.reduce((acc, ticket) => {
  const date = ticket.created;
  acc[date] = acc[date] || { date, risk: 0, churned: 0 };
  if (ticket.slaBreached || ticket.sentiment === 'Negative') acc[date].risk += 1;
  if (ticket.satisfaction <= 2) acc[date].churned += 1;
  return acc;
}, {})).slice(-7);

export const slaData = Object.values(tickets.reduce((acc, ticket) => {
  const date = ticket.created;
  acc[date] = acc[date] || { date, total: 0, met: 0 };
  acc[date].total += 1;
  if (!ticket.slaBreached) acc[date].met += 1;
  return acc;
}, {})).slice(-7).map((row) => ({ date: row.date, compliance: Math.round((row.met / row.total) * 100) }));

export const notifications = [
  { id: 1, type: 'ticket', message: `${tickets.length} real support tickets loaded`, time: 'Now', read: false },
  { id: 2, type: 'ai', message: 'Bedrock analysis pipeline connected to AWS', time: 'Now', read: false },
  { id: 3, type: 'system', message: 'MongoDB Atlas connection verified', time: 'Today', read: true },
];

export const revenueRisk = categoryData.map((category) => ({
  issue: category.name,
  revenue: `Rs ${(category.value * 0.12).toFixed(1)} L`,
}));
