const { loadRoleDataset } = require('./csvDatasetService');
const { summarizeSlaQueue } = require('./slaEngine');

const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const countBy = (rows = [], field) => Object.entries(rows.reduce((acc, row) => {
  const key = row[field] || 'Unknown';
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {}))
  .map(([name, value]) => ({ name, value }))
  .sort((a, b) => b.value - a.value);

const sumBy = (rows = [], field) => rows.reduce((sum, row) => sum + asNumber(row[field]), 0);

const averageBy = (rows = [], field) => {
  const values = rows.map((row) => asNumber(row[field], NaN)).filter(Number.isFinite);
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
};

const detectBIIntent = (message = '') => {
  const text = String(message).toLowerCase();
  if (/sla|breach|overdue|at risk/.test(text)) return 'sla';
  if (/revenue|risk|churn|executive|business/.test(text)) return 'business_risk';
  if (/agent|team|workload|queue|overload/.test(text)) return 'operations';
  if (/category|issue|root cause|recurring/.test(text)) return 'issue_mix';
  return 'overview';
};

const getRowsForRole = async (role) => {
  const dataset = await loadRoleDataset(role);
  return {
    rows: dataset.available && dataset.validation.valid ? dataset.rows : [],
    source: dataset.sourceDataset,
    sourceType: dataset.sourceType,
    validation: dataset.validation,
  };
};

const buildBIAnswer = async ({ role = 'support_agent', message = '' } = {}) => {
  const intent = detectBIIntent(message);
  const { rows, source, sourceType, validation } = await getRowsForRole(role);

  if (!rows.length) {
    return {
      reply: validation?.missing?.length
        ? `Analytics dataset is missing required fields: ${validation.missing.join(', ')}.`
        : 'No uploaded or database analytics rows are available for BI analysis.',
      intent,
      source,
      sourceType,
      metrics: {},
      records: [],
      recommendations: ['Upload the required CSV dataset or connect the live database collection.'],
    };
  }

  if (intent === 'sla') {
    const metrics = summarizeSlaQueue(rows);
    return {
      reply: [
        'SLA BI Insight:',
        `- Open tickets: ${metrics.open}`,
        `- Breached tickets: ${metrics.breached}`,
        `- At-risk tickets: ${metrics.atRisk}`,
        `- Stale tickets: ${metrics.stale}`,
        `- Average remaining hours: ${metrics.averageRemainingHours}`,
        '- Recommendation: Move at-risk and stale tickets into manager escalation before breach.',
      ].join('\n'),
      intent,
      source,
      sourceType,
      metrics,
      records: metrics.highestRisk,
      recommendations: ['Prioritize stale tickets.', 'Rebalance teams with highest breach counts.', 'Trigger EventBridge alert rules for at-risk queues.'],
    };
  }

  if (intent === 'business_risk') {
    const revenue = sumBy(rows, 'revenue_risk_usd') || sumBy(rows, 'revenue_risk');
    const churn = sumBy(rows, 'churn_risk_customers');
    const records = rows
      .slice()
      .sort((a, b) => (asNumber(b.revenue_risk_usd) + asNumber(b.revenue_risk)) - (asNumber(a.revenue_risk_usd) + asNumber(a.revenue_risk)))
      .slice(0, 5);
    return {
      reply: [
        'Business Risk BI Insight:',
        `- Revenue risk: Rs ${revenue.toLocaleString('en-IN')}`,
        `- Churn risk customers: ${churn}`,
        `- Average CSAT: ${averageBy(rows, 'avg_csat') || averageBy(rows, 'customer_satisfaction')}`,
        `- Top issue group: ${countBy(rows, 'top_issue_category')[0]?.name || countBy(rows, 'issue_category')[0]?.name || 'Unknown'}`,
      ].join('\n'),
      intent,
      source,
      sourceType,
      metrics: { revenue, churn },
      records,
      recommendations: ['Focus recovery outreach on high-revenue segments.', 'Create QuickSight drilldowns by product and region.'],
    };
  }

  if (intent === 'operations') {
    const openTickets = sumBy(rows, 'open_tickets') || rows.filter((row) => row.status === 'Open').length;
    const records = rows
      .slice()
      .sort((a, b) => asNumber(b.open_tickets) - asNumber(a.open_tickets))
      .slice(0, 5);
    return {
      reply: [
        'Operations BI Insight:',
        `- Open workload: ${openTickets}`,
        `- Average resolution hours: ${averageBy(rows, 'avg_resolution_hours') || averageBy(rows, 'resolution_time_hours')}`,
        `- Top team: ${countBy(rows, 'team')[0]?.name || countBy(rows, 'assigned_team')[0]?.name || 'Unknown'}`,
        `- Most common status: ${countBy(rows, 'status')[0]?.name || 'Unknown'}`,
      ].join('\n'),
      intent,
      source,
      sourceType,
      metrics: { openTickets },
      records,
      recommendations: ['Reassign work from overloaded agents.', 'Use SQS queue depth as an operational alert signal.'],
    };
  }

  const issueMix = countBy(rows, 'issue_category').slice(0, 5);
  return {
    reply: [
      'Support BI Overview:',
      `- Dataset rows: ${rows.length}`,
      `- Top categories: ${issueMix.map((item) => `${item.name} (${item.value})`).join(', ') || 'Unknown'}`,
      `- Average resolution hours: ${averageBy(rows, 'resolution_time_hours') || averageBy(rows, 'avg_resolution_hours')}`,
      `- Average satisfaction: ${averageBy(rows, 'customer_satisfaction') || averageBy(rows, 'avg_csat')}`,
    ].join('\n'),
    intent,
    source,
    sourceType,
    metrics: { rows: rows.length, issueMix },
    records: issueMix,
    recommendations: ['Investigate the highest-volume issue category.', 'Publish or update knowledge articles for repeat drivers.'],
  };
};

module.exports = {
  buildBIAnswer,
  detectBIIntent,
};
