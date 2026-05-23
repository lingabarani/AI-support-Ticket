const roleAliases = {
  'Customer Portal User': 'customer',
  'Support Agent': 'support_agent',
  'Team Manager': 'team_manager',
  'Business Executive': 'business_executive',
  'System Admin': 'system_admin',
};

const normalizeRole = (role = 'support_agent') => roleAliases[role] || role;

const extractTicketId = (message = '') => {
  const match = String(message).match(/\bTKT[-\s]?0*(\d{1,6})\b/i);
  if (!match) return '';
  return `TKT-${String(Number(match[1])).padStart(4, '0')}`;
};

const extractEmail = (message = '') => String(message).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';

const detectIntent = ({ role = 'support_agent', message = '' } = {}) => {
  const normalizedRole = normalizeRole(role);
  const text = String(message).toLowerCase();
  if (normalizedRole === 'customer' && /track|status|ticket/.test(text)) return 'ticket_tracking';
  if (normalizedRole === 'business_executive' && /executive summary|business summary|overview/.test(text)) return 'executive_summary';
  if (/high priority|urgent|critical/.test(text)) return 'high_priority_tickets';

  const checks = [
    ['ticket_summary', /summari[sz]e|summary|analy[sz]e/],
    ['ticket_status', /status|track|where is|progress/],
    ['ticket_priority', /priority|urgent|severity/],
    ['customer_history', /customer history|history|email/],
    ['high_priority_tickets', /high priority|urgent|critical/],
    ['open_tickets', /open tickets|show open|in progress/],
    ['sla_breaches', /sla|breach|breached|overdue/],
    ['sentiment_analysis', /sentiment|negative|positive|neutral|angry|frustrated/],
    ['issue_category_summary', /issue categor|top issue|recurring issue|category/],
    ['suggested_reply', /suggest|reply|draft|response|next action|recommended action/],
    ['similar_tickets', /similar|related|same issue/],
    ['team_summary', /team summary|team workload|workload|operations summary/],
    ['sla_compliance', /sla compliance|most sla|highest sla|sla breaches/],
    ['workload_analysis', /workload|open tickets|in progress|queue/],
    ['agent_performance', /agent.*resolved|resolved most|agent performance|which agent/],
    ['escalations', /escalation|escalated/],
    ['productivity_score', /productivity|resolution rate|utilization/],
    ['average_resolution_time', /average resolution|avg resolution|resolution time/],
    ['overloaded_team', /overloaded|overload|agent overloaded/],
    ['recurring_issues', /recurring|common issue|top issue/],
    ['executive_summary', /executive summary|business summary|overview/],
    ['revenue_risk', /revenue risk|revenue|financial impact|money/],
    ['churn_risk', /churn|retention|causing churn/],
    ['csat_trend', /csat|satisfaction/],
    ['region_performance', /region|by region/],
    ['product_performance', /product|by product/],
    ['business_risk', /business risk|risk/],
    ['strategic_recommendation', /strategic|recommendation|recommend/],
    ['monthly_trend', /month|monthly|trend/],
  ];
  const detected = checks.find(([, pattern]) => pattern.test(text))?.[0];

  return detected || (
    normalizedRole === 'team_manager' ? 'team_summary'
      : normalizedRole === 'business_executive' ? 'executive_summary'
        : 'ticket_summary'
  );
};

module.exports = {
  detectIntent,
  extractEmail,
  extractTicketId,
  normalizeRole,
};
