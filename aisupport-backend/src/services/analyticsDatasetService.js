const { loadDatasetIfNeeded } = require('./datasetRegistryService');

const MAX_ANALYTICS_ROWS = Number(process.env.MAX_ANALYTICS_ROWS || 5000);
const SUMMARY_TTL_MS = Number(process.env.ANALYTICS_SUMMARY_TTL_MS || 5 * 60 * 1000);
const summaryCache = {};

const logAnalytics = (message, meta = {}) => {
  console.info(`[ANALYTICS_SERVICE] ${message} ${JSON.stringify({ timestamp: new Date().toISOString(), ...meta })}`);
};

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const number = Number(String(value).replace(/[^0-9.-]+/g, ''));
  return Number.isNaN(number) ? 0 : number;
};

const countBy = (rows, field) => rows.reduce((acc, row) => {
  const key = String(row[field] || 'Unknown');
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const sortCounts = (counts) => Object.entries(counts)
  .map(([name, value]) => ({ name, value }))
  .sort((a, b) => b.value - a.value);

const cachedSummary = async (key, loader) => {
  const cached = summaryCache[key];
  if (cached && Date.now() - cached.createdAt < SUMMARY_TTL_MS) return cached.value;
  logAnalytics('Before analytics processing', { key });
  const startedAt = Date.now();
  const value = await loader();
  summaryCache[key] = { value, createdAt: Date.now(), durationMs: Date.now() - startedAt };
  logAnalytics('After analytics processing', { key, durationMs: summaryCache[key].durationMs });
  return value;
};

const rowsOf = async (datasetName) => {
  const dataset = await loadDatasetIfNeeded(datasetName, { limit: MAX_ANALYTICS_ROWS });
  return dataset.rows || [];
};

const getSupportAgentMetrics = async () => cachedSummary('supportAgent', async () => {
  const rows = await rowsOf('supportTickets');
  const openTickets = rows.filter((row) => String(row.status || '').toLowerCase() === 'open').length;
  const highPriority = rows.filter((row) => ['high', 'urgent'].includes(String(row.priority || '').toLowerCase())).length;

  return {
    totalTickets: rows.length,
    openTickets,
    highPriority,
    byStatus: sortCounts(countBy(rows, 'status')),
    byPriority: sortCounts(countBy(rows, 'priority')),
    byIssueCategory: sortCounts(countBy(rows, 'issue_category')),
    sampleRows: rows.slice(0, 20),
    cached: true,
  };
});

const getTeamManagerMetrics = async () => cachedSummary('teamManager', async () => {
  const [slaRows, ticketRows] = await Promise.all([rowsOf('slaAnalytics'), rowsOf('supportTickets')]);
  const slaBreaches = slaRows.filter((row) => String(row.sla_status || row.sla_breached || '').toLowerCase().includes('breach')).length;
  const byTeam = sortCounts(countBy(slaRows, 'team_name'));
  const byAgent = sortCounts(countBy(ticketRows, 'assigned_agent'));
  const avgResolution = slaRows.length ? slaRows.reduce((sum, row) => sum + toNumber(row.resolution_time || row.avg_resolution_time), 0) / slaRows.length : 0;

  return {
    totalEvents: slaRows.length,
    slaBreaches,
    averageResolutionTime: Number(avgResolution.toFixed(1)),
    byTeam,
    byAgent,
    topSlaIssues: byTeam.slice(0, 6),
    cached: true,
  };
});

const getBusinessExecutiveMetrics = async () => cachedSummary('businessExecutive', async () => {
  const [rows, feedbackRows, workflowRows] = await Promise.all([
    rowsOf('ordersProducts'),
    rowsOf('customerFeedback'),
    rowsOf('agentWorkflows'),
  ]);
  const paymentIssues = rows.filter((row) => String(row.payment_status || '').toLowerCase() !== 'paid').length;
  const deliveryIssues = rows.filter((row) => String(row.delivery_status || '').toLowerCase() !== 'delivered').length;

  return {
    totalOrders: rows.length,
    paymentIssues,
    deliveryIssues,
    topProducts: sortCounts(countBy(rows, 'product_name')).slice(0, 6),
    sentimentDistribution: sortCounts(countBy(feedbackRows, 'sentiment')),
    workflowVolume: sortCounts(countBy(workflowRows, 'status')),
    customerFeedbackSamples: feedbackRows.slice(0, 10),
    cached: true,
  };
});

const getConversationalBIContext = async () => cachedSummary('conversationalBIContext', async () => {
  const datasets = (await Promise.all([
    rowsOf('supportTickets'),
    rowsOf('slaAnalytics'),
    rowsOf('customerFeedback'),
    rowsOf('ordersProducts'),
    rowsOf('agentWorkflows'),
  ])).flatMap((rows) => rows.slice(0, 25));
  return {
    totalRows: datasets.length,
    sampleContext: datasets.slice(0, 50),
  };
});

const getRootCauseContext = async () => cachedSummary('rootCauseContext', async () => {
  const [tickets, slaRows, feedbackRows] = await Promise.all([
    rowsOf('supportTickets'),
    rowsOf('slaAnalytics'),
    rowsOf('customerFeedback'),
  ]);
  return {
    totalTickets: tickets.length,
    slaRecords: slaRows.length,
    feedbackRecords: feedbackRows.length,
    commonSources: sortCounts(countBy(tickets, 'issue_category')).slice(0, 5),
    slaBreachTeams: sortCounts(countBy(slaRows, 'team_name')).slice(0, 5),
    sentimentBreakdown: sortCounts(countBy(feedbackRows, 'sentiment')).slice(0, 5),
  };
});

const getAnalyticsCacheStats = () => Object.entries(summaryCache).map(([key, value]) => ({
  key,
  ageMs: Date.now() - value.createdAt,
  durationMs: value.durationMs,
}));

module.exports = {
  getAnalyticsCacheStats,
  getBusinessExecutiveMetrics,
  getConversationalBIContext,
  getRootCauseContext,
  getSupportAgentMetrics,
  getTeamManagerMetrics,
};
