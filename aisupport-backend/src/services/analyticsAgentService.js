const { loadRoleDataset } = require('./csvDatasetService');
const { average, buildDashboardMetrics, countBy, isTrue, sumBy } = require('./dashboardMetricsService');
const { detectIntent, extractEmail, extractTicketId, normalizeRole } = require('./intentDetectionService');

const unavailable = (role, intent, sourceDataset = '') => ({
  reply: 'Dataset is not available. Please upload the required CSV file.',
  role,
  intent,
  source: 'dataset_unavailable',
  sourceDataset,
  confidence: 0,
  matchedRows: 0,
  metrics: {},
  records: [],
  suggestedActions: ['Upload the required CSV file', 'Check dataset management', 'Try again after upload'],
  suggestedQuestions: ['Upload the required CSV file', 'Check dataset management', 'Try again after upload'],
});

const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
const top = (rows, field, limit = 5) => countBy(rows, field).slice(0, limit);
const sample = (rows, keys, limit = 5) => rows.slice(0, limit).map((row) => keys.reduce((acc, key) => {
  acc[key] = row[key];
  return acc;
}, {}));

const includes = (value, query) => String(value || '').toLowerCase().includes(String(query || '').toLowerCase());
const exactTicket = (rows, ticketId) => rows.find((row) => String(row.ticket_id).toLowerCase() === ticketId.toLowerCase());
const priorityRank = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
const isOpenWork = (row) => ['Open', 'In Progress'].includes(row.status);
const isHighPriority = (row) => ['High', 'Urgent'].includes(row.priority);
const isNegativeSentiment = (row) => includes(row.ai_sentiment, 'negative');
const hasSlaRisk = (row) => isTrue(row.sla_breached) || ['Breached', 'At Risk'].includes(row.sla_status);

const applyTextFilters = (rows, message) => {
  const text = String(message).toLowerCase();
  let filtered = rows;
  if (/payment|billing|invoice|refund/.test(text)) {
    filtered = filtered.filter((row) => /payment|billing|invoice|refund/.test([
      row.issue_category,
      row.issue_description,
      row.ticket_description,
      row.subject,
      row.product,
    ].join(' ').toLowerCase()));
  }
  if (/login|auth|password|sso|mfa/.test(text)) {
    filtered = filtered.filter((row) => /login|auth|password|sso|mfa/.test([
      row.issue_category,
      row.issue_description,
      row.ticket_description,
      row.subject,
      row.product,
    ].join(' ').toLowerCase()));
  }
  for (const field of ['region', 'product', 'team', 'agent_name', 'assigned_agent', 'customer_email']) {
    const values = [...new Set(rows.map((row) => row[field]).filter(Boolean))];
    const match = values.find((value) => includes(text, value));
    if (match) filtered = filtered.filter((row) => row[field] === match);
  }
  return filtered;
};

const applySupportConstraints = (rows, message) => {
  const text = String(message).toLowerCase();
  let filtered = rows;

  if (/high[-\s]?priority|urgent|critical/.test(text)) filtered = filtered.filter(isHighPriority);
  if (/open|unresolved|in progress|active queue/.test(text)) filtered = filtered.filter(isOpenWork);
  if (/negative|angry|frustrated|unhappy|poor sentiment/.test(text)) filtered = filtered.filter(isNegativeSentiment);
  if (/sla|breach|breached|at risk|overdue/.test(text)) filtered = filtered.filter(hasSlaRisk);

  return filtered.sort((a, b) => (
    Number(hasSlaRisk(b)) - Number(hasSlaRisk(a))
    || priorityRank[b.priority] - priorityRank[a.priority]
    || Number(b.ai_urgency_score || 0) - Number(a.ai_urgency_score || 0)
    || Number(b.revenue_risk || 0) - Number(a.revenue_risk || 0)
  ));
};

const buildSuggestedQuestions = ({ role, intent, message }) => {
  const text = `${intent} ${message}`.toLowerCase();
  if (/sla|breach|compliance/.test(text)) {
    return ['Show SLA breached tickets', 'Which team has highest SLA risk?', 'What is the average resolution time?', 'Show escalation trend'];
  }
  if (/revenue|business|financial/.test(text)) {
    return ['Show revenue risk by region', 'What issue causes highest revenue risk?', 'Show churn risk customers', 'Give strategic recommendation'];
  }
  if (/ticket|reply|customer|summary/.test(text)) {
    return ['Summarize this ticket', 'Suggest customer reply', 'Find similar tickets', 'Show customer history'];
  }
  if (role === 'team_manager') {
    return ['Show overloaded teams', 'Which agent resolved most tickets?', 'Which team has most SLA breaches?', 'What is average resolution time?'];
  }
  if (role === 'business_executive') {
    return ['Give executive summary', 'Show revenue risk by region', 'What is causing churn?', 'Show CSAT trend'];
  }
  return ['Show high priority open tickets', 'Which tickets breached SLA?', 'Show negative sentiment tickets', 'Suggest reply for a ticket'];
};

const supportAnswer = ({ rows, intent, message, sourceDataset, role }) => {
  const ticketId = extractTicketId(message);
  const email = extractEmail(message);
  const ticket = exactTicket(rows, ticketId);
  let matches = rows;
  const scopedRows = applyTextFilters(rows, message);
  const hasTopicFilter = scopedRows.length !== rows.length;

  if (role === 'customer' && !ticketId && !email) matches = [];
  else if (ticketId && !ticket) matches = [];
  else if (ticket) matches = [ticket];
  else if (email) matches = rows.filter((row) => row.customer_email === email);
  else if (/high[-\s]?priority|urgent|critical|open|unresolved|negative|angry|frustrated|unhappy|sla|breach|breached|at risk|overdue/.test(String(message).toLowerCase())) matches = applySupportConstraints(scopedRows, message);
  else if (intent === 'high_priority_tickets') matches = scopedRows.filter((row) => isHighPriority(row) && isOpenWork(row));
  else if (intent === 'open_tickets') matches = scopedRows.filter(isOpenWork);
  else if (intent === 'sla_breaches') matches = scopedRows.filter(hasSlaRisk);
  else if (intent === 'sentiment_analysis') matches = scopedRows.filter((row) => isNegativeSentiment(row) || includes(message, row.ai_sentiment));
  else matches = scopedRows;

  const metrics = buildDashboardMetrics('support_agent', matches);
  const requestedTop = String(message).match(/\btop\s+(\d{1,2})\b/i)?.[1];
  const recordLimit = requestedTop ? Math.min(Number(requestedTop), 10) : 5;
  const records = sample(matches, ['ticket_id', 'customer_name', 'issue_category', 'priority', 'status', 'ai_sentiment', 'sla_breached', 'sla_status', 'next_best_action'], recordLimit);
  const selected = matches[0];
  if ((ticketId || role === 'customer') && !selected) {
    return {
      reply: [
        role === 'customer' ? 'Ticket Status:' : 'Finding:',
        `- Ticket ID: ${ticketId || 'This information is not available in the current dataset.'}`,
        '- Status: This information is not available in the current dataset.',
        '- Priority: This information is not available in the current dataset.',
        '- Assigned team: This information is not available in the current dataset.',
        '- Latest update: This information is not available in the current dataset.',
        '- Expected resolution: This information is not available in the current dataset.',
      ].join('\n'),
      metrics,
      records: [],
      matchedRows: 0,
      confidence: 0.2,
    };
  }

  if (!matches.length) {
    return {
      reply: "I couldn't find matching records for that request. Try refining the ticket ID, customer name, or issue category.",
      metrics,
      records: [],
      matchedRows: 0,
      confidence: 0.35,
    };
  }

  const finding = (ticket || (intent === 'ticket_summary' && !hasTopicFilter) || role === 'customer')
    ? [
      role === 'customer' ? 'Ticket Status:' : 'Finding:',
      `- Ticket ID: ${selected?.ticket_id || ticketId || 'Not found'}`,
      `- Status: ${selected?.status || 'This information is not available in the current dataset.'}`,
      `- Priority: ${selected?.priority || 'This information is not available in the current dataset.'}`,
      `- Assigned team: ${selected?.assigned_team || 'This information is not available in the current dataset.'}`,
      `- Latest update: ${selected?.resolution_summary || selected?.issue_description || 'This information is not available in the current dataset.'}`,
      `- Expected resolution: ${selected?.resolution_time_hours ? `${selected.resolution_time_hours} hours` : 'This information is not available in the current dataset.'}`,
    ]
    : [
      'Finding:',
      `- I found relevant tickets for this request.`,
      `- Key tickets: ${records.map((row) => `${row.ticket_id} (${row.priority}, ${row.status})`).join('; ') || 'None'}`,
      `- Risk: ${metrics.slaBreaches} SLA breached, ${metrics.highPriorityOpenTickets} high/urgent open tickets`,
      `- Recommended action: ${records[0]?.next_best_action || 'This information is not available in the current dataset.'}`,
    ];

  return {
    reply: finding.join('\n'),
    metrics,
    records,
    matchedRows: matches.length,
    confidence: matches.length ? 0.94 : 0.45,
  };
};

const managerAnswer = ({ rows, intent, sourceDataset }) => {
  const metrics = buildDashboardMetrics('team_manager', rows);
  const totalEscalations = rows.reduce((sum, row) => sum + Number(row.escalation_queue || 0), 0);
  let records = sample(rows, ['team', 'agent_name', 'open_tickets', 'sla_breached_tickets', 'avg_resolution_hours', 'team_utilization_pct', 'agent_overloaded']);
  let lines;

  if (intent === 'sla_compliance' || intent === 'sla_breaches') {
    const grouped = metrics.byTeamSlaBreaches;
    records = grouped.slice(0, 5);
    lines = [
      'SLA Risk Insight:',
      `- Highest risk team: ${grouped[0]?.name || 'Unknown'} with ${grouped[0]?.value || 0} breached tickets`,
      `- Next teams: ${grouped.slice(1, 4).map((row) => `${row.name} (${row.value})`).join(', ') || 'No secondary breach cluster'}`,
      `- Queue context: ${metrics.openTickets} open tickets and ${metrics.inProgressTickets} in progress`,
      '- Recommendation: Put the top breached team on recovery review and assign owners for aged breaches.',
    ];
  } else if (intent === 'escalations') {
    records = metrics.escalationTrend.slice(-6);
    const peak = [...metrics.escalationTrend].sort((a, b) => b.escalations - a.escalations)[0];
    lines = [
      'Escalation Trend:',
      `- Total escalations: ${totalEscalations}`,
      `- Peak period: ${peak?.date || 'Unknown'} with ${peak?.escalations || 0} escalations`,
      `- Recent trend: ${records.map((row) => `${row.date}: ${row.escalations}`).join('; ') || 'No escalation history available'}`,
      '- Recommendation: Review peak-period drivers and add manager approval before repeated escalations move to engineering.',
    ];
  } else if (intent === 'overloaded_team') {
    const overloaded = rows.filter((row) => row.agent_overloaded === true || row.agent_overloaded === 'True' || Number(row.team_utilization_pct) >= 90);
    records = sample(overloaded, ['team', 'agent_name', 'open_tickets', 'team_utilization_pct', 'agent_overloaded']);
    const byTeam = countBy(overloaded, 'team', 5);
    lines = [
      'Workload Overload Insight:',
      `- Overloaded agent rows: ${overloaded.length}`,
      `- Most exposed teams: ${byTeam.map((row) => `${row.name} (${row.value})`).join(', ') || 'No overloaded teams detected'}`,
      `- Average utilization: ${metrics.averageUtilization}%`,
      '- Recommendation: Reassign low-complexity tickets away from overloaded agents and protect high-severity queues first.',
    ];
  } else if (intent === 'agent_performance') {
    records = metrics.byAgentResolved.slice(0, 5);
    lines = [
      'Agent Performance Insight:',
      `- Top resolved agent: ${records[0]?.name || 'Unknown'} with ${records[0]?.value || 0} resolved tickets`,
      `- Top performers: ${records.map((row) => `${row.name} (${row.value})`).join(', ')}`,
      `- Resolved workload: ${metrics.resolvedTickets} total resolved tickets`,
      '- Recommendation: Pair top performers with overloaded queues for coaching and short-term ticket distribution.',
    ];
  } else if (intent === 'average_resolution_time') {
    records = metrics.avgResolutionByTeam.slice(0, 5);
    lines = [
      'Resolution Time Insight:',
      `- Overall average resolution time: ${metrics.averageResolutionTime} hours`,
      `- Slowest teams: ${records.map((row) => `${row.name} (${row.value}h)`).join(', ')}`,
      `- Fastest team: ${metrics.avgResolutionByTeam.at(-1)?.name || 'Unknown'}`,
      '- Recommendation: Audit handoff delays for the slowest teams and reuse playbooks from the fastest queue.',
    ];
  } else if (intent === 'workload_analysis' || intent === 'team_summary') {
    records = metrics.byTeamWorkload.slice(0, 5);
    lines = [
      'Team Workload Insight:',
      `- Open workload: ${metrics.openTickets} open and ${metrics.inProgressTickets} in progress`,
      `- Busiest teams: ${records.map((row) => `${row.name} (${row.value})`).join(', ')}`,
      `- Urgent/high mix: ${metrics.urgentTickets} urgent and ${metrics.highPriorityTickets} high-priority tickets`,
      '- Recommendation: Rebalance the busiest team first, then reserve capacity for urgent SLA-sensitive work.',
    ];
  } else {
    records = metrics.byTeamWorkload.slice(0, 5);
    lines = [
      'Operations Insight:',
      `- Current workload: ${metrics.openTickets} open, ${metrics.inProgressTickets} in progress, ${metrics.resolvedTickets} resolved`,
      `- SLA exposure: ${metrics.slaBreachedTickets} breached tickets; top team ${metrics.byTeamSlaBreaches[0]?.name || 'Unknown'}`,
      `- Escalations: ${totalEscalations}`,
      '- Recommendation: Ask about SLA risk, escalation trend, overloaded teams, or agent performance for a focused manager view.',
    ];
  }

  return { reply: lines.join('\n'), metrics, records, matchedRows: rows.length, confidence: 0.93 };
};

const executiveAnswer = ({ rows, intent, sourceDataset }) => {
  const metrics = buildDashboardMetrics('business_executive', rows);
  let records = sample(rows, ['region', 'product', 'ticket_volume', 'revenue_risk_usd', 'churn_risk_customers', 'avg_csat', 'strategic_recommendation']);
  let lines = [
    'Executive Insight:',
    `- Revenue risk: ${formatMoney(metrics.revenueRisk)}`,
    `- Churn risk: ${metrics.churnRiskCustomers} customers`,
    `- CSAT: ${metrics.averageCsat}`,
    `- Region/Product impact: top region ${metrics.revenueRiskByRegion[0]?.name || 'Unknown'}, top product ${metrics.revenueRiskByProduct[0]?.name || 'Unknown'}`,
    `- Strategic recommendation: ${rows[0]?.strategic_recommendation || rows[0]?.action_recommendation || 'This information is not available in the current dataset.'}`,
  ];

  if (intent === 'revenue_risk' || intent === 'region_performance') {
    records = metrics.revenueRiskByRegion.slice(0, 5);
    lines[5] = `- Region/Product impact: ${records.map((row) => `${row.name}: ${formatMoney(row.value)}`).join('; ')}`;
  } else if (intent === 'product_performance') {
    records = metrics.revenueRiskByProduct.slice(0, 5);
    lines[5] = `- Region/Product impact: ${records.map((row) => `${row.name}: ${formatMoney(row.value)}`).join('; ')}`;
  } else if (intent === 'churn_risk') {
    records = metrics.churnByIssue.slice(0, 5);
    lines[3] = `- Churn risk: ${metrics.churnRiskCustomers} customers; top causes ${records.map((row) => `${row.name} (${row.value})`).join(', ')}`;
  } else if (intent === 'csat_trend') {
    records = sumBy(rows, 'month', 'avg_csat').slice(0, 12);
    lines[4] = `- CSAT: average ${metrics.averageCsat}; monthly rows available ${records.length}`;
  }

  return { reply: lines.join('\n'), metrics, records, matchedRows: rows.length, confidence: 0.93 };
};

const generateAnalyticsAgentResponse = async ({ role = 'support_agent', message = '' } = {}) => {
  const normalizedRole = normalizeRole(role);
  const intent = detectIntent({ role: normalizedRole, message });
  const datasetRole = normalizedRole === 'customer' ? 'customer' : normalizedRole;
  const dataset = await loadRoleDataset(datasetRole);

  if (!dataset.available || !dataset.rows.length) return unavailable(normalizedRole, intent, dataset.sourceDataset);
  if (!dataset.validation.valid) {
    return {
      ...unavailable(normalizedRole, intent, dataset.sourceDataset),
      reply: `Dataset is not available. Please upload the required CSV file. Missing fields: ${dataset.validation.missing.join(', ')}`,
    };
  }

  const builder = normalizedRole === 'team_manager'
    ? managerAnswer
    : normalizedRole === 'business_executive'
      ? executiveAnswer
      : supportAnswer;
  const answer = builder({ rows: dataset.rows, intent, message, sourceDataset: dataset.sourceDataset, role: normalizedRole });

  return {
    ...answer,
    role: normalizedRole,
    intent,
    source: 'dataset_grounded',
    sourceDataset: dataset.sourceDataset,
    sourceType: dataset.sourceType,
    suggestedQuestions: buildSuggestedQuestions({ role: normalizedRole, intent, message }),
    suggestedActions: buildSuggestedQuestions({ role: normalizedRole, intent, message }),
  };
};

module.exports = {
  generateAnalyticsAgentResponse,
};
