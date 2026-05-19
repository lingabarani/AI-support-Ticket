const router = require('express').Router();
const Ticket = require('../models/Ticket');
const { getDemoAnalytics, getPrimaryTickets } = require('../services/datasetService');

const roleMap = {
  customer: 'supportAgentAnalytics',
  support_agent: 'supportAgentAnalytics',
  team_manager: 'teamManagerAnalytics',
  business_executive: 'businessExecutiveAnalytics',
  system_admin: 'systemAdminAnalytics',
};

const countBy = (tickets, field) => Object.entries(tickets.reduce((acc, ticket) => {
  const key = ticket[field] || 'Unknown';
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {})).map(([name, value]) => ({ name, value, _id: name, count: value })).sort((a, b) => b.value - a.value);

const sourceOf = async () => ((await Ticket.estimatedDocumentCount().maxTimeMS(4000)) > 0 ? 'mongodb' : 'support_fallback');

const buildAnalyticsFromTickets = (tickets) => {
  const openTickets = tickets.filter((ticket) => ticket.status === 'Open').length;
  const inProgressTickets = tickets.filter((ticket) => ticket.status === 'In Progress').length;
  const resolvedToday = tickets.filter((ticket) => ['Resolved', 'Closed'].includes(ticket.status)).length;
  const slaBreaches = tickets.filter((ticket) => ticket.sla_breached);
  const revenueRisk = tickets.reduce((sum, ticket) => sum + Number(ticket.revenue_risk || 0), 0);
  const satisfaction = tickets.length
    ? Number((tickets.reduce((sum, ticket) => sum + Number(ticket.customer_satisfaction || 0), 0) / tickets.length).toFixed(1))
    : 0;
  const priorityDistribution = countBy(tickets, 'priority');
  const categoryTrends = countBy(tickets, 'issue_category').slice(0, 6);
  const agentWorkload = countBy(tickets, 'assigned_agent').slice(0, 8).map((item) => ({
    agent: item.name,
    assigned: item.value,
    open: tickets.filter((ticket) => ticket.assigned_agent === item.name && !['Resolved', 'Closed'].includes(ticket.status)).length,
    sla: 90,
  }));

  const supportAgentAnalytics = {
    openTickets,
    inProgressTickets,
    resolvedToday,
    slaCompliance: tickets.length ? Math.round(((tickets.length - slaBreaches.length) / tickets.length) * 100) : 100,
    averageResolutionTime: tickets.length ? Number((tickets.reduce((sum, ticket) => sum + Number(ticket.resolution_time_hours || 0), 0) / tickets.length).toFixed(1)) : 0,
    priorityDistribution,
    statusTrend: [],
    recentTickets: tickets.slice(0, 8),
    personalPerformance: agentWorkload,
  };

  return {
    supportAgentAnalytics,
    teamManagerAnalytics: {
      totalTickets: tickets.length,
      openTickets,
      resolvedToday,
      slaCompliance: supportAgentAnalytics.slaCompliance,
      teamPerformance: countBy(tickets, 'assigned_team').map((item) => ({ team: item.name, tickets: item.value, sla: 90 })),
      agentWorkload,
      slaBreaches: slaBreaches.slice(0, 20),
      escalationTrends: [],
      categoryTrends,
    },
    businessExecutiveAnalytics: {
      totalTickets: tickets.length,
      customerSatisfaction: satisfaction,
      churnRiskCustomers: tickets.filter((ticket) => ticket.ai_customer_churn_risk === 'High').length,
      revenueRisk,
      sentimentTrend: [],
      churnRiskTrend: [],
      topRevenueImpactingIssues: categoryTrends.map((item) => ({
        issue: item.name,
        revenueRisk: tickets.filter((ticket) => ticket.issue_category === item.name).reduce((sum, ticket) => sum + Number(ticket.revenue_risk || 0), 0),
      })),
      strategicRecommendations: ['Prioritize SLA recovery for high-risk tickets.', 'Review recurring categories and update support playbooks.', 'Monitor high-revenue customers with negative sentiment.'],
      customerSegmentInsights: countBy(tickets, 'customer_type').map((item) => ({ segment: item.name, tickets: item.value, satisfaction })),
    },
    systemAdminAnalytics: getDemoAnalytics().systemAdminAnalytics,
  };
};

router.get('/summary', async (req, res) => {
  const tickets = await getPrimaryTickets();
  const analytics = buildAnalyticsFromTickets(tickets);
  res.json({
    success: true,
    source: await sourceOf(),
    summary: {
      totalTickets: tickets.length,
      openTickets: tickets.filter((ticket) => ticket.status === 'Open').length,
      slaBreaches: tickets.filter((ticket) => ticket.sla_breached).length,
      highPriority: tickets.filter((ticket) => ['High', 'Urgent'].includes(ticket.priority)).length,
      revenueRisk: analytics.businessExecutiveAnalytics.revenueRisk,
    },
    analytics,
  });
});

router.get('/role/:role', async (req, res) => {
  const analytics = buildAnalyticsFromTickets(await getPrimaryTickets());
  const key = roleMap[req.params.role] || 'supportAgentAnalytics';
  res.json({
    success: true,
    source: await sourceOf(),
    role: req.params.role,
    analytics: analytics[key] || {},
  });
});

router.get('/overview', async (req, res) => {
  const tickets = await getPrimaryTickets();
  res.json({
    success: true,
    source: await sourceOf(),
    overview: {
      open: tickets.filter((ticket) => ticket.status === 'Open').length,
      inProgress: tickets.filter((ticket) => ticket.status === 'In Progress').length,
      resolved: tickets.filter((ticket) => ['Resolved', 'Closed'].includes(ticket.status)).length,
      total: tickets.length,
    },
    byPriority: countBy(tickets, 'priority'),
    byCategory: countBy(tickets, 'issue_category'),
  });
});

router.get('/sentiment', async (req, res) => {
  const tickets = await getPrimaryTickets();
  res.json({ success: true, source: await sourceOf(), data: countBy(tickets, 'ai_sentiment') });
});

module.exports = router;
