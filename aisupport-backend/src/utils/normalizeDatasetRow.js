const aliases = {
  ticket_id: ['ticket_id', 'ticket id', 'ticketid', 'id', 'case id', 'case_id'],
  ticket_description: ['ticket_description', 'ticket description', 'description', 'issue description', 'issue_description', 'subject', 'summary'],
  customer_name: ['customer_name', 'customer name', 'name', 'client name'],
  customer_email: ['customer_email', 'customer email', 'email', 'client email'],
  team_name: ['team_name', 'team name', 'team', 'assigned_team', 'assigned team'],
  department: ['department', 'dept'],
  total_tickets: ['total_tickets', 'total tickets', 'ticket_count', 'ticket count', 'tickets'],
  open_tickets: ['open_tickets', 'open tickets'],
  resolved_tickets: ['resolved_tickets', 'resolved tickets'],
  sla_compliance: ['sla_compliance', 'sla compliance', 'sla %', 'sla_pct', 'sla percent'],
  sla_breached: ['sla_breached', 'sla breached', 'sla breach', 'breached'],
  sla_breach_count: ['sla_breach_count', 'sla breach count', 'sla_breached_tickets', 'sla breached tickets'],
  region: ['region', 'area', 'geo'],
  product: ['product', 'affected_product', 'affected product', 'service'],
  revenue_risk: ['revenue_risk', 'revenue risk', 'revenue_impact', 'revenue impact', 'business_impact', 'business impact', 'revenue_risk_usd'],
  churn_risk: ['churn_risk', 'churn risk', 'retention risk', 'retention_risk_score'],
  churn_risk_customers: ['churn_risk_customers', 'churn risk customers', 'at risk customers'],
  customer_satisfaction: ['customer_satisfaction', 'customer satisfaction', 'csat', 'csat_score', 'csat score', 'avg_csat'],
};

const aliasLookup = Object.entries(aliases).reduce((acc, [canonical, names]) => {
  names.forEach((name) => {
    acc[name.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')] = canonical;
  });
  return acc;
}, {});

const normalizeKey = (key) => {
  const normalized = String(key || '')
    .trim()
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return aliasLookup[normalized] || normalized;
};

const normalizeValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return value;
  return value.trim();
};

const normalizeDatasetRow = (row = {}) => Object.entries(row).reduce((acc, [key, value]) => {
  const normalizedKey = normalizeKey(key);
  if (acc[normalizedKey] === undefined || acc[normalizedKey] === '') {
    acc[normalizedKey] = normalizeValue(value);
  }
  return acc;
}, {});

const hasAny = (row, fields) => fields.some((field) => row[field] !== undefined && row[field] !== null && String(row[field]).trim() !== '');

module.exports = {
  hasAny,
  normalizeDatasetRow,
  normalizeKey,
};
