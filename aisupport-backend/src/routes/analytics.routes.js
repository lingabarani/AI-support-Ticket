const router = require('express').Router();
const Ticket = require('../models/Ticket');
const { getDemoAnalytics, getPrimaryTickets } = require('../services/datasetService');
const { loadRoleDataset } = require('../services/csvDatasetService');
const { buildDashboardMetrics } = require('../services/dashboardMetricsService');

const roleMap = {
  customer: 'supportAgentAnalytics',
  support_agent: 'supportAgentAnalytics',
  team_manager: 'teamManagerAnalytics',
  business_executive: 'businessExecutiveAnalytics',
  system_admin: 'systemAdminAnalytics',
};

const roleEndpointMap = {
  'support-agent': 'support_agent',
  'team-manager': 'team_manager',
  'business-executive': 'business_executive',
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
  const supportDataset = await loadRoleDataset('support_agent');
  const managerDataset = await loadRoleDataset('team_manager');
  const executiveDataset = await loadRoleDataset('business_executive');

  if (supportDataset.available && supportDataset.rows.length) {
    const support = buildDashboardMetrics('support_agent', supportDataset.rows);
    const manager = buildDashboardMetrics('team_manager', managerDataset.rows || []);
    const executive = buildDashboardMetrics('business_executive', executiveDataset.rows || []);
    return res.json({
      success: true,
      source: 'dataset_grounded',
      sourceDataset: supportDataset.sourceDataset,
      summary: {
        totalTickets: support.totalTickets,
        openTickets: support.openTickets,
        slaBreaches: support.slaBreaches,
        highPriority: support.highPriorityOpenTickets,
        revenueRisk: executive.revenueRisk,
      },
      analytics: {
        supportAgentAnalytics: {
          totalTickets: support.totalTickets,
          latestDate: support.latestDate,
          openTickets: support.openTickets,
          inProgressTickets: support.inProgressTickets,
          resolvedToday: support.resolvedToday,
          slaCompliance: support.slaCompliance,
          slaBreaches: support.slaBreaches,
          averageResolutionTime: support.averageResolutionTime,
          averageCsat: support.averageCsat,
          priorityDistribution: support.byPriority,
          sentimentDistribution: support.sentimentDistribution,
          slaBreachByRegion: support.slaBreachByRegion,
          resolutionTimeByTeam: support.resolutionTimeByTeam,
          statusDistribution: support.byStatus,
          statusTrend: support.statusTrend,
          categoryTrends: support.byIssueCategory.slice(0, 6),
          recentTickets: support.recentTickets,
        },
        teamManagerAnalytics: {
          totalTickets: manager.openTickets + manager.inProgressTickets + manager.resolvedTickets,
          openTickets: manager.openTickets,
          resolvedToday: manager.resolvedTickets,
          slaBreachedTickets: manager.slaBreachedTickets,
          averageResolutionTime: manager.averageResolutionTime,
          averageUtilization: manager.averageUtilization,
          averageCsat: manager.averageCsat,
          teamPerformance: manager.byTeamSlaBreaches,
          agentWorkload: manager.byAgentResolved,
          workloadByTeam: manager.byTeamWorkload,
          escalationTrend: manager.escalationTrend,
          utilizationByTeam: manager.utilizationByTeam,
          productivityByTeam: manager.productivityByTeam,
          avgResolutionByTeam: manager.avgResolutionByTeam,
          categoryTrends: support.byIssueCategory.slice(0, 6),
        },
        businessExecutiveAnalytics: {
          totalTickets: executive.ticketVolume,
          customerSatisfaction: executive.averageCsat,
          churnRiskCustomers: executive.churnRiskCustomers,
          revenueRisk: executive.revenueRisk,
          impactedAccounts: executive.impactedAccounts,
          averageSlaCompliance: executive.averageSlaCompliance,
          revenueRiskByRegion: executive.revenueRiskByRegion,
          revenueRiskByProduct: executive.revenueRiskByProduct,
          churnByIssue: executive.churnByIssue,
          churnTrend: executive.churnTrend,
          sentimentByProduct: executive.sentimentByProduct,
          businessRiskByDepartment: executive.businessRiskByDepartment,
          sentimentTrend: executive.sentimentTrend,
          csatTrend: executive.csatTrend,
          revenueTrend: executive.revenueTrend,
          topBusinessIssues: executive.topBusinessIssues,
          topRevenueImpactingIssues: executive.revenueRiskByProduct.map((item) => ({ issue: item.name, revenueRisk: item.value })),
          strategicRecommendations: executiveDataset.rows.slice(0, 3).map((row) => row.strategic_recommendation || row.action_recommendation).filter(Boolean),
        },
        systemAdminAnalytics: getDemoAnalytics().systemAdminAnalytics,
      },
    });
  }

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
  const dataset = await loadRoleDataset(req.params.role);
  if (dataset.available && dataset.rows.length) {
    return res.json({
      success: true,
      source: 'dataset_grounded',
      sourceDataset: dataset.sourceDataset,
      role: req.params.role,
      analytics: buildDashboardMetrics(req.params.role, dataset.rows),
    });
  }

  const analytics = buildAnalyticsFromTickets(await getPrimaryTickets());
  const key = roleMap[req.params.role] || 'supportAgentAnalytics';
  res.json({
    success: true,
    source: await sourceOf(),
    role: req.params.role,
    analytics: analytics[key] || {},
  });
});

router.get('/:roleKey(support-agent|team-manager|business-executive)', async (req, res) => {
  const role = roleEndpointMap[req.params.roleKey];
  const dataset = await loadRoleDataset(role);
  const metrics = dataset.available && dataset.rows.length
    ? buildDashboardMetrics(role, dataset.rows)
    : {};

  res.json({
    success: true,
    role,
    kpis: metrics,
    charts: metrics,
    tables: {
      recentTickets: metrics.recentTickets || [],
      topAgents: metrics.byAgentResolved || [],
      topIssues: metrics.byIssueCategory || metrics.topBusinessIssues || [],
    },
    insights: [
      role === 'team_manager' ? 'Review teams with the highest SLA breach counts first.' : null,
      role === 'business_executive' ? 'Prioritize regions and products with the highest revenue exposure.' : null,
      role === 'support_agent' ? 'Prioritize high or urgent open tickets with SLA risk.' : null,
    ].filter(Boolean),
    generatedAt: new Date().toISOString(),
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
