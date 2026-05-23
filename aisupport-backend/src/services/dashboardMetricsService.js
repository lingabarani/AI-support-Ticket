const toNumber = (value, fallback = 0) => {
  const number = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(number) ? number : fallback;
};

const clean = (value, fallback = 'Unknown') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const normalizeDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const normalizeMonth = (value) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}$/.test(String(value))) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 7);
};

const isTrue = (value) => {
  if (typeof value === 'boolean') return value;
  return ['true', 'yes', '1', 'y', 'breached'].includes(String(value ?? '').trim().toLowerCase());
};

const isResolved = (status) => ['resolved', 'closed'].includes(String(status || '').toLowerCase());

const sum = (rows, field) => rows.reduce((total, row) => total + toNumber(row[field]), 0);

const average = (rows, field) => {
  const values = rows
    .map((row) => toNumber(row[field], NaN))
    .filter(Number.isFinite);
  return values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : 0;
};

const countBy = (rows, field, limit) => {
  const grouped = Object.entries(rows.reduce((acc, row) => {
    const key = clean(row[field]);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}))
    .map(([name, value]) => ({ name, value, count: value }))
    .sort((a, b) => b.value - a.value);
  return limit ? grouped.slice(0, limit) : grouped;
};

const sumBy = (rows, groupField, valueField, limit) => {
  const grouped = Object.entries(rows.reduce((acc, row) => {
    const key = clean(row[groupField]);
    acc[key] = (acc[key] || 0) + toNumber(row[valueField]);
    return acc;
  }, {}))
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)), count: Number(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);
  return limit ? grouped.slice(0, limit) : grouped;
};

const averageBy = (rows, groupField, valueField, limit) => {
  const grouped = Object.values(rows.reduce((acc, row) => {
    const key = clean(row[groupField]);
    acc[key] = acc[key] || { name: key, total: 0, rows: 0 };
    acc[key].total += toNumber(row[valueField]);
    acc[key].rows += 1;
    return acc;
  }, {}))
    .map((item) => ({ name: item.name, value: Number((item.total / item.rows).toFixed(1)) }))
    .sort((a, b) => b.value - a.value);
  return limit ? grouped.slice(0, limit) : grouped;
};

const booleanCountBy = (rows, groupField, boolField, limit) => {
  const grouped = Object.entries(rows.reduce((acc, row) => {
    const key = clean(row[groupField]);
    acc[key] = (acc[key] || 0) + (isTrue(row[boolField]) || row.sla_status === 'Breached' ? 1 : 0);
    return acc;
  }, {}))
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  return limit ? grouped.slice(0, limit) : grouped;
};

const latestDate = (rows, fields) => rows
  .map((row) => fields.map((field) => normalizeDate(row[field])).find(Boolean))
  .filter(Boolean)
  .sort()
  .at(-1) || '';

const groupStatusTrend = (rows) => {
  const byDate = rows.reduce((acc, row) => {
    const date = normalizeDate(row.ticket_updated_date || row.updated_at || row.ticket_created_date || row.created_at);
    if (!date) return acc;
    const status = String(row.status || '').toLowerCase().replace(/\s+/g, '_');
    acc[date] = acc[date] || { date, open: 0, inProgress: 0, resolved: 0, pending: 0, closed: 0, total: 0 };
    if (status === 'open') acc[date].open += 1;
    else if (status === 'in_progress') acc[date].inProgress += 1;
    else if (status === 'resolved') acc[date].resolved += 1;
    else if (status === 'closed') acc[date].closed += 1;
    else acc[date].pending += 1;
    acc[date].total += 1;
    return acc;
  }, {});
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
};

const groupMonthlyAverage = (rows, dateField, valueField, outputKey) => Object.values(rows.reduce((acc, row) => {
  const month = clean(row.month, '') || normalizeMonth(row[dateField]);
  if (!month) return acc;
  acc[month] = acc[month] || { date: month, total: 0, rows: 0 };
  acc[month].total += toNumber(row[valueField]);
  acc[month].rows += 1;
  return acc;
}, {}))
  .map((item) => ({ date: item.date, [outputKey]: Number((item.total / item.rows).toFixed(2)) }))
  .sort((a, b) => a.date.localeCompare(b.date));

const groupMonthlySum = (rows, dateField, valueField, outputKey) => Object.values(rows.reduce((acc, row) => {
  const month = clean(row.month, '') || normalizeMonth(row[dateField]);
  if (!month) return acc;
  acc[month] = acc[month] || { date: month, [outputKey]: 0 };
  acc[month][outputKey] += toNumber(row[valueField]);
  return acc;
}, {}))
  .map((item) => ({ ...item, [outputKey]: Number(item[outputKey].toFixed(2)) }))
  .sort((a, b) => a.date.localeCompare(b.date));

const supportMetrics = (rows) => {
  const latest = latestDate(rows, ['ticket_updated_date', 'updated_at', 'ticket_created_date', 'created_at']);
  const resolvedToday = rows.filter((row) => (
    isResolved(row.status)
    && normalizeDate(row.ticket_updated_date || row.updated_at || row.ticket_created_date || row.created_at) === latest
  )).length;
  const slaBreaches = rows.filter((row) => isTrue(row.sla_breached) || row.sla_status === 'Breached').length;
  const recentTickets = [...rows]
    .sort((a, b) => String(b.ticket_updated_date || b.updated_at || b.ticket_created_date || '').localeCompare(String(a.ticket_updated_date || a.updated_at || a.ticket_created_date || '')))
    .slice(0, 8);

  return {
    totalTickets: rows.length,
    latestDate: latest,
    openTickets: rows.filter((row) => row.status === 'Open').length,
    inProgressTickets: rows.filter((row) => row.status === 'In Progress').length,
    resolvedToday,
    highPriorityOpenTickets: rows.filter((row) => ['High', 'Urgent'].includes(row.priority) && ['Open', 'In Progress'].includes(row.status)).length,
    slaBreaches,
    slaCompliance: rows.length ? Number((((rows.length - slaBreaches) / rows.length) * 100).toFixed(1)) : 0,
    averageResolutionTime: average(rows, 'resolution_time_hours'),
    averageCsat: average(rows, 'customer_satisfaction'),
    byStatus: countBy(rows, 'status'),
    byPriority: countBy(rows, 'priority'),
    sentimentDistribution: countBy(rows, 'ai_sentiment'),
    byIssueCategory: countBy(rows, 'issue_category', 8),
    slaBreachByRegion: booleanCountBy(rows, 'region', 'sla_breached', 8),
    resolutionTimeByTeam: averageBy(rows, 'assigned_team', 'resolution_time_hours', 8),
    statusTrend: groupStatusTrend(rows),
    recentTickets,
  };
};

const managerMetrics = (rows) => ({
  totalRows: rows.length,
  openTickets: sum(rows, 'open_tickets'),
  inProgressTickets: sum(rows, 'in_progress_tickets'),
  resolvedTickets: sum(rows, 'resolved_tickets'),
  slaBreachedTickets: sum(rows, 'sla_breached_tickets'),
  urgentTickets: sum(rows, 'urgent_tickets'),
  highPriorityTickets: sum(rows, 'high_priority_tickets'),
  averageResolutionTime: average(rows, 'avg_resolution_hours'),
  averageCsat: average(rows, 'avg_csat'),
  averageUtilization: average(rows, 'team_utilization_pct'),
  byTeamWorkload: sumBy(rows, 'team', 'open_tickets', 8),
  byTeamSlaBreaches: sumBy(rows, 'team', 'sla_breached_tickets', 8),
  byAgentResolved: sumBy(rows, 'agent_name', 'resolved_tickets', 8),
  productivityByTeam: averageBy(rows, 'team', 'resolution_rate_pct', 8),
  avgResolutionByTeam: averageBy(rows, 'team', 'avg_resolution_hours', 8),
  escalationTrend: groupMonthlySum(rows, 'snapshot_date', 'escalation_queue', 'escalations'),
  utilizationByTeam: Object.values(rows.reduce((acc, row) => {
    const team = clean(row.team);
    acc[team] = acc[team] || { name: team, total: 0, rows: 0 };
    acc[team].total += toNumber(row.team_utilization_pct);
    acc[team].rows += 1;
    return acc;
  }, {})).map((item) => ({ name: item.name, value: Number((item.total / item.rows).toFixed(1)) })).sort((a, b) => b.value - a.value),
});

const executiveMetrics = (rows) => ({
  totalRows: rows.length,
  ticketVolume: sum(rows, 'ticket_volume'),
  revenueRisk: sum(rows, 'revenue_risk_usd') || sum(rows, 'revenue_risk') || sum(rows, 'revenue_impact'),
  churnRiskCustomers: sum(rows, 'churn_risk_customers') || sum(rows, 'churn_risk'),
  impactedAccounts: sum(rows, 'impacted_accounts'),
  averageCsat: average(rows, 'avg_csat') || average(rows, 'customer_satisfaction'),
  averageSlaCompliance: average(rows, 'sla_compliance_pct'),
  revenueRiskByRegion: sumBy(rows, 'region', 'revenue_risk_usd', 8),
  revenueRiskByProduct: sumBy(rows, 'product', 'revenue_risk_usd', 8),
  churnByIssue: sumBy(rows, 'top_issue_category', 'churn_risk_customers', 8),
  churnTrend: groupMonthlySum(rows, 'report_date', 'churn_risk_customers', 'churnRisk'),
  sentimentByProduct: averageBy(rows, 'product', 'negative_sentiment_pct', 8),
  businessRiskByDepartment: sumBy(rows, 'department', 'revenue_risk_usd', 8),
  topBusinessIssues: countBy(rows, 'top_issue_category', 8),
  sentimentTrend: groupMonthlyAverage(rows, 'report_date', 'negative_sentiment_pct', 'negative'),
  csatTrend: groupMonthlyAverage(rows, 'report_date', 'avg_csat', 'csat'),
  revenueTrend: groupMonthlySum(rows, 'report_date', 'revenue_risk_usd', 'revenueRisk'),
  byRegion: countBy(rows, 'region'),
  byProduct: countBy(rows, 'product'),
});

const buildDashboardMetrics = (role, rows = []) => {
  if (role === 'team_manager') return managerMetrics(rows);
  if (role === 'business_executive') return executiveMetrics(rows);
  return supportMetrics(rows);
};

module.exports = {
  average,
  buildDashboardMetrics,
  countBy,
  isTrue,
  normalizeDate,
  sum,
  sumBy,
  averageBy,
  toNumber,
};
