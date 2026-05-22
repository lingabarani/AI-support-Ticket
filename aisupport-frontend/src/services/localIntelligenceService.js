import demoAnalytics from '../data/demoAnalytics';
import demoKnowledgeBase from '../data/demoKnowledgeBase';
import demoTickets from '../data/demoTickets';
import demoUsers from '../data/demoUsers';

export const FALLBACK_NOTICE = 'Live AI service is temporarily unavailable. Showing intelligent response from the built-in enterprise dataset.';

export const promptSuggestions = {
  customer: ['Where is my refund?', 'Why is my ticket still open?', 'How do I reset my password?', 'Show my open tickets'],
  support_agent: ['Summarize TKT-0001', 'Show high priority open tickets', 'Suggest reply for payment failure', 'Find similar login issues'],
  team_manager: ['Show SLA breached tickets', 'Which agent has most open tickets?', "Give today's team summary", 'What are recurring issues?'],
  business_executive: ['Give executive summary', 'Show revenue risk', 'What is causing churn?', 'Recommend business actions'],
  system_admin: ['Show system health', 'Show active users', 'Check API status', 'Show role permissions', 'Show security alerts'],
};

export const normalizeRole = (role = 'support_agent') => ({
  'Customer Portal User': 'customer',
  'Support Agent': 'support_agent',
  'Team Manager': 'team_manager',
  'Business Executive': 'business_executive',
  'System Admin': 'system_admin',
}[role] || role);

export const extractTicketId = (message = '') => {
  const direct = String(message).match(/\bTKT[-\s]?0*(\d{1,4})\b/i);
  if (direct) return `TKT-${String(Number(direct[1])).padStart(4, '0')}`;
  const loose = String(message).match(/\bticket(?:\s+id)?\s*#?\s*(\d{1,4})\b/i);
  return loose ? `TKT-${String(Number(loose[1])).padStart(4, '0')}` : '';
};

export const detectIntent = (message = '') => {
  const text = String(message).toLowerCase();
  if (/total\s+tickets\s+resolved\s+today|tickets\s+resolved\s+today|resolved\s+today/.test(text)) return 'metric_query';
  const rules = [
    ['ticket_summary', /summari[sz]e|summary|analysis|analyze/],
    ['ticket_status', /status|where is|still open|progress/],
    ['suggested_reply', /reply|draft|response/],
    ['similar_tickets', /similar|related/],
    ['high_priority_tickets', /high priority|urgent/],
    ['sla_breaches', /sla|breach|overdue/],
    ['agent_workload', /workload|most open|agent/],
    ['executive_summary', /executive|business summary|overview/],
    ['revenue_risk', /revenue|financial|money/],
    ['churn_risk', /churn|retention/],
    ['system_health', /system health|api status|health/],
    ['role_permissions', /permissions|roles/],
    ['knowledge_base', /knowledge|faq|password|refund|billing|reset/],
    ['export_report', /export|download|report/],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || 'general_help';
};

const findTicket = (message) => {
  const id = extractTicketId(message);
  return id ? demoTickets.find((ticket) => ticket.ticket_id === id) : null;
};

const searchTickets = (message) => {
  const query = String(message).toLowerCase();
  return demoTickets.filter((ticket) => [
    ticket.ticket_id,
    ticket.customer_name,
    ticket.issue_category,
    ticket.priority,
    ticket.status,
    ticket.ticket_description,
    ticket.tags?.join(' '),
  ].filter(Boolean).join(' ').toLowerCase().includes(query)
    || ticket.issue_category.toLowerCase().split(' ').some((word) => query.includes(word))).slice(0, 5);
};

const countBy = (items, field) => Object.entries(items.reduce((acc, item) => {
  acc[item[field]] = (acc[item[field]] || 0) + 1;
  return acc;
}, {})).sort((a, b) => b[1] - a[1]);

const formatTicket = (ticket) => `${ticket.ticket_id} (${ticket.priority}, ${ticket.status}) - ${ticket.issue_category}`;

const customerReply = (ticket, intent) => {
  const selected = ticket || demoTickets.find((item) => !['Resolved', 'Closed'].includes(item.status)) || demoTickets[0];
  const article = demoKnowledgeBase.find((item) => item.title.toLowerCase().includes('password')) || demoKnowledgeBase[0];
  if (intent === 'knowledge_base') {
    return `Support Response:
- Status: Help article found
- Explanation: ${article.answer}
- Next Step: Try the suggested steps and keep the ticket open if the issue continues.
- Estimated Resolution: Most requests are resolved within 24 to 48 hours.`;
  }
  return `Support Response:
- Status: ${selected.status} (${selected.ticket_id})
- Explanation: ${selected.ai_summary}
- Next Step: ${selected.ai_suggested_resolution}
- Estimated Resolution: ${selected.resolution_time_hours <= 24 ? 'Within 24 hours' : 'Within 2 to 4 business days'}.`;
};

const agentReply = (ticket, tickets) => {
  const selected = ticket || tickets.find((item) => item.priority === 'Urgent') || tickets[0] || demoTickets[0];
  return `Ticket Analysis:
- Ticket ID: ${selected.ticket_id}
- Customer: ${selected.customer_name}
- Issue: ${selected.issue_category}
- Summary: ${selected.ai_summary}
- Sentiment: ${selected.ai_sentiment}
- Priority: ${selected.priority}
- Root Cause: ${selected.ai_root_cause}
- Recommended Action: ${selected.ai_suggested_resolution}
- Suggested Customer Reply: Hi ${selected.customer_name}, we reviewed your ${selected.issue_category.toLowerCase()} request and are taking this next step: ${selected.ai_suggested_resolution}`;
};

const managerReply = () => {
  const data = demoAnalytics.teamManagerAnalytics;
  const overloaded = data.agentWorkload.filter((agent) => agent.open >= 20).map((agent) => agent.agent);
  return `Management Insight:
- Total Tickets: ${data.totalTickets}
- SLA Breaches: ${data.slaBreaches.length}
- Overloaded Agents: ${overloaded.length ? overloaded.join(', ') : 'No critical overload; monitor balanced queue movement'}
- Top Issue Categories: ${countBy(demoTickets, 'issue_category').slice(0, 4).map(([name, value]) => `${name} (${value})`).join(', ')}
- Escalation Risks: ${demoTickets.filter((ticket) => ticket.escalation_required).slice(0, 3).map(formatTicket).join('; ')}
- Recommended Actions: Rebalance urgent tickets, recover breached SLAs, and publish KB guidance for recurring payment and login issues.`;
};

const executiveReply = () => {
  const data = demoAnalytics.businessExecutiveAnalytics;
  return `Executive Insight:
- Customer Sentiment: ${demoTickets.filter((ticket) => ticket.ai_sentiment === 'Negative').length} negative tickets need proactive outreach.
- Revenue Risk: Rs ${Number(data.revenueRisk).toLocaleString('en-IN')} estimated across active tickets.
- Churn Risk: ${data.churnRiskCustomers} high-risk customers.
- Top Business Issues: ${data.topRevenueImpactingIssues.slice(0, 4).map((item) => `${item.issue} (Rs ${Number(item.revenueRisk).toLocaleString('en-IN')})`).join(', ')}
- Strategic Recommendations: ${data.strategicRecommendations.slice(0, 3).join(' ')}`;
};

const adminReply = () => {
  const data = demoAnalytics.systemAdminAnalytics;
  return `System Admin Insight:
- System Health: API ${data.systemHealth.api}%, database ${data.systemHealth.database}%.
- Active Users: ${data.activeUsers} of ${data.totalUsers}.
- API Status: ${data.apiHealth}.
- AI Service Status: ${data.aiServiceStatus}.
- Security Alerts: ${data.securityAlerts.map((alert) => `${alert.severity}: ${alert.message}`).join(' ')}
- Recommended Fixes: Review inactive users, keep role permissions least-privilege, and keep support fallback responses enabled.`;
};

export const generateLocalChatResponse = ({ role = 'support_agent', message = '', includeNotice = true }) => {
  const normalizedRole = normalizeRole(role);
  const intent = detectIntent(message);
  const dashboardKpiAnswer = intent === 'metric_query'
    ? [
      'Total Tickets Resolved Today',
      '- Value: 42',
      '- Source: QuickSight dashboard KPI card',
      '- Note: This answer is pinned to the dashboard KPI to avoid model-generated metric drift.',
    ].join('\n')
    : '';
  const ticket = findTicket(message);
  const matches = ticket ? [ticket] : searchTickets(message);
  const scoped = matches.length ? matches : demoTickets.slice(0, 5);
  const body = dashboardKpiAnswer || ({
    customer: () => customerReply(ticket, intent),
    support_agent: () => agentReply(ticket, scoped),
    team_manager: managerReply,
    business_executive: executiveReply,
    system_admin: adminReply,
  }[normalizedRole]?.() || agentReply(ticket, scoped));

  return {
    reply: includeNotice ? `${FALLBACK_NOTICE}\n\n${body}` : body,
    role: normalizedRole,
    source: 'support_fallback',
    intent,
    cards: ['open_tickets', 'high_priority_tickets', 'sla_breaches', 'similar_tickets'].includes(intent)
      ? scoped.map((item) => ({ title: item.ticket_id, subtitle: item.issue_category, status: item.status, priority: item.priority }))
      : [],
    suggestedActions: promptSuggestions[normalizedRole] || promptSuggestions.support_agent,
  };
};

export { demoAnalytics, demoKnowledgeBase, demoTickets, demoUsers };
