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
  product_name: ['product_name', 'product name', 'name'],
  product_category: ['product_category', 'product category', 'category'],
  revenue_risk: ['revenue_risk', 'revenue risk', 'revenue_impact', 'revenue impact', 'business_impact', 'business impact', 'revenue_risk_usd'],
  churn_risk: ['churn_risk', 'churn risk', 'retention risk', 'retention_risk_score'],
  churn_risk_customers: ['churn_risk_customers', 'churn risk customers', 'at risk customers'],
  customer_satisfaction: ['customer_satisfaction', 'customer satisfaction', 'csat', 'csat_score', 'csat score', 'avg_csat'],
  sentiment: ['sentiment', 'sentiment_score', 'sentiment_rating', 'rating'],
  status: ['status', 'ticket_status', 'case_status'],
  step_name: ['step_name', 'step name', 'agent_stage', 'agent stage', 'workflow_stage', 'workflow stage'],
  confidence: ['confidence', 'confidence_score', 'ai_confidence_score', 'image_confidence_score'],
  workflow_status: ['workflow_status', 'workflow status'],
  priority: ['priority', 'ticket_priority'],
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

const normalizeDate = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toISOString();
};

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  const text = String(value || '').trim().toLowerCase();
  if (['yes', 'true', 'y', '1'].includes(text)) return true;
  if (['no', 'false', 'n', '0'].includes(text)) return false;
  return value;
};

const normalizeNumber = (value) => {
  if (typeof value === 'number') return value;
  const text = String(value || '').trim().replace(/,/g, '');
  if (!text || !/^[-+]?\d+(\.\d+)?$/.test(text)) return value;
  return Number(text);
};

const normalizePriority = (value) => {
  const text = String(value || '').trim().toLowerCase();
  if (['urgent', 'critical'].includes(text)) return 'Urgent';
  if (['high', 'hi'].includes(text)) return 'High';
  if (['medium', 'med', 'normal'].includes(text)) return 'Medium';
  if (['low', 'lo'].includes(text)) return 'Low';
  return value;
};

const normalizeStatus = (value) => {
  const text = String(value || '').trim().toLowerCase();
  if (['open', 'new', 'pending'].includes(text)) return 'Open';
  if (['in progress', 'in_progress', 'working', 'ongoing'].includes(text)) return 'In Progress';
  if (['pending customer', 'pending_customer', 'waiting on customer', 'customer_pending'].includes(text)) return 'Pending Customer';
  if (['resolved', 'closed', 'completed'].includes(text)) return 'Resolved';
  if (['escalated', 'escalation'].includes(text)) return 'Escalated';
  return value;
};

const normalizeSentiment = (value) => {
  const text = String(value || '').trim().toLowerCase();
  if (['positive', 'pos', 'good', 'happy'].includes(text)) return 'Positive';
  if (['neutral', 'nil', 'none', 'medium', 'mixed'].includes(text)) return 'Neutral';
  if (['negative', 'neg', 'bad', 'unhappy'].includes(text)) return 'Negative';
  return value;
};

const normalizeValue = (value, key) => {
  if (value === null || value === undefined) return '';
  const normalizedKey = String(key || '').toLowerCase();
  if (['created_date', 'resolved_at', 'ticket_created_date', 'created_at', 'date', 'timestamp'].includes(normalizedKey)) {
    return normalizeDate(value);
  }
  if (['priority'].includes(normalizedKey)) return normalizePriority(value);
  if (['status', 'workflow_status'].includes(normalizedKey)) return normalizeStatus(value);
  if (['sentiment'].includes(normalizedKey)) return normalizeSentiment(value);
  if (typeof value === 'string' && /^[-+]?\d+(\.\d+)?$/.test(value.replace(/,/g, '').trim())) return normalizeNumber(value);
  if (typeof value === 'string' && ['yes', 'no', 'true', 'false', 'y', 'n', '0', '1'].includes(value.trim().toLowerCase())) return normalizeBoolean(value);
  return typeof value === 'string' ? value.trim() : value;
};

const normalizeDatasetRow = (row = {}) => Object.entries(row).reduce((acc, [key, value]) => {
  const normalizedKey = normalizeKey(key);
  if (acc[normalizedKey] === undefined || acc[normalizedKey] === '') {
    acc[normalizedKey] = normalizeValue(value, normalizedKey);
  }
  return acc;
}, {});

const hasAny = (row, fields) => fields.some((field) => row[field] !== undefined && row[field] !== null && String(row[field]).trim() !== '');

module.exports = {
  hasAny,
  normalizeDatasetRow,
  normalizeKey,
};
