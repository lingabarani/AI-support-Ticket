const demoAnalytics = {
  supportAgentAnalytics: {
    openTickets: 42,
    inProgressTickets: 28,
    resolvedToday: 16,
    latestDate: '23 May 2026',
    slaCompliance: 91.4,
    priorityDistribution: [
      { name: 'Urgent', value: 8 },
      { name: 'High', value: 18 },
      { name: 'Medium', value: 34 },
      { name: 'Low', value: 22 },
    ],
    statusTrend: [
      { date: 'Mon', open: 22, inProgress: 16, resolved: 18, closed: 10 },
      { date: 'Tue', open: 28, inProgress: 20, resolved: 24, closed: 12 },
      { date: 'Wed', open: 25, inProgress: 26, resolved: 29, closed: 18 },
      { date: 'Thu', open: 31, inProgress: 24, resolved: 33, closed: 21 },
      { date: 'Fri', open: 42, inProgress: 28, resolved: 38, closed: 24 },
    ],
    categoryTrends: [
      { name: 'Login', value: 31 },
      { name: 'Billing', value: 24 },
      { name: 'Performance', value: 19 },
      { name: 'Integrations', value: 14 },
    ],
    recentTickets: [
      { ticket_id: 'TKT-0001', issue_category: 'Login issue', customer_name: 'Aarav Mehta', priority: 'High', status: 'Open' },
      { ticket_id: 'TKT-0004', issue_category: 'Billing mismatch', customer_name: 'Priya Shah', priority: 'Medium', status: 'In Progress' },
    ],
  },
  teamManagerAnalytics: {
    openTickets: 70,
    slaBreachedTickets: 9,
    averageResolutionTime: 11.8,
    averageUtilization: 83.5,
    categoryTrends: [
      { name: 'Login', value: 31 },
      { name: 'Billing', value: 24 },
      { name: 'Performance', value: 19 },
    ],
    teamPerformance: [
      { name: 'Tier 1', value: 4 },
      { name: 'Billing', value: 3 },
      { name: 'Platform', value: 2 },
    ],
    agentWorkload: [
      { name: 'Neha', value: 28 },
      { name: 'Kiran', value: 24 },
      { name: 'Ravi', value: 21 },
    ],
    escalationTrend: [
      { date: 'Mon', escalations: 4 },
      { date: 'Tue', escalations: 6 },
      { date: 'Wed', escalations: 5 },
      { date: 'Thu', escalations: 7 },
      { date: 'Fri', escalations: 9 },
    ],
  },
  businessExecutiveAnalytics: {
    revenueRisk: 1260000,
    churnRiskCustomers: 18,
    customerSatisfaction: 4.2,
    totalTickets: 420,
    revenueRiskByRegion: [
      { name: 'India', value: 520000 },
      { name: 'US', value: 410000 },
      { name: 'EU', value: 330000 },
    ],
    csatTrend: [
      { date: 'Jan', csat: 4.0 },
      { date: 'Feb', csat: 4.1 },
      { date: 'Mar', csat: 4.3 },
      { date: 'Apr', csat: 4.2 },
    ],
    churnByIssue: [
      { name: 'Billing', value: 8 },
      { name: 'Downtime', value: 6 },
      { name: 'Onboarding', value: 4 },
    ],
  },
};

export default demoAnalytics;
