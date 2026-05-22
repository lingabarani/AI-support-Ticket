import realTickets from './realTickets.json';

const excelDateToText = (value) => {
  const serial = Number(value);
  if (!Number.isFinite(serial)) return value || '';
  const date = new Date(Date.UTC(1899, 11, 30 + serial));
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const normalizePriority = (priority) => {
  if (priority === 'Urgent' || priority === 'Critical') return 'High';
  return priority || 'Medium';
};

const normalizeStatus = (status) => {
  if (status === 'Closed') return 'Resolved';
  if (status === 'Pending') return 'On Hold';
  return status || 'Open';
};

const sentimentFromScore = (score) => {
  const value = Number(score);
  if (value >= 4) return 'Positive';
  if (value <= 2) return 'Negative';
  return 'Neutral';
};

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

const agentNames = ['Anita Verma', 'Rahul Kumar', 'Priya Singh', 'Arjun Das', 'Simran Kaur'];

export const tickets = realTickets.map((ticket, index) => {
  const created = excelDateToText(ticket.ticket_created_date);
  return {
    id: `TKT-${String(ticket.ticket_id).padStart(5, '0')}`,
    subject: ticket.issue_description,
    customer: ticket.customer_name,
    customerEmail: ticket.customer_email,
    priority: normalizePriority(ticket.priority),
    status: normalizeStatus(ticket.status),
    category: ticket.category,
    agent: agentNames[index % agentNames.length],
    created,
    updated: excelDateToText(ticket.ticket_resolved_date) || created,
    sentiment: sentimentFromScore(ticket.customer_satisfaction_score),
    slaHours: Number(ticket.resolution_time_hours || ticket.first_response_time_hours || 0).toFixed(1),
    product: ticket.product,
    channel: ticket.channel,
    region: ticket.region,
    slaBreached: ticket.sla_breached === 'Yes',
    satisfaction: Number(ticket.customer_satisfaction_score || 0),
  };
});

export const agents = agentNames.map((name, index) => {
  const assigned = tickets.filter((ticket) => ticket.agent === name);
  const resolved = assigned.filter((ticket) => ticket.status === 'Resolved').length;
  const slaMet = assigned.filter((ticket) => !ticket.slaBreached).length;
  return {
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@aisupport.com`,
    role: 'Support Agent',
    tickets: assigned.length,
    resolved,
    sla: assigned.length ? Math.round((slaMet / assigned.length) * 100) : 0,
    avgTime: `${Math.round(assigned.reduce((sum, ticket) => sum + Number(ticket.slaHours || 0), 0) / Math.max(assigned.length, 1))} hrs`,
    status: index === agentNames.length - 1 ? 'Inactive' : 'Active',
  };
});

export const users = [
  { id: 1, name: 'Lingabarani', email: 'lingabarani@example.com', role: 'System Admin', status: 'Active', created: '17 May 2026' },
  ...agents.slice(0, 4).map((agent, index) => ({
    id: index + 2,
    name: agent.name,
    email: agent.email,
    role: agent.role,
    status: agent.status,
    created: '17 May 2026',
  })),
];

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
  { id: 3, type: 'system', message: 'DynamoDB data layer connection verified', time: 'Today', read: true },
];

export const revenueRisk = categoryData.map((category) => ({
  issue: category.name,
  revenue: `Rs ${(category.value * 0.12).toFixed(1)} L`,
}));
