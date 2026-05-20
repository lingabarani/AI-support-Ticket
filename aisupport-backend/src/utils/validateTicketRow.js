const negativeWords = ['failed', 'error', 'refund', 'delayed', 'unable', 'issue', 'problem'];
const positiveWords = ['thanks', 'resolved', 'good'];
const urgentWords = ['urgent', 'security', 'breach', 'fraud'];
const highWords = ['failed', 'payment', 'unable', 'refund'];

const rootCauseByCategory = {
  'Login Issue': 'Authentication or session validation needs review.',
  'Payment Failure': 'Payment reconciliation or gateway status needs review.',
  'Refund Request': 'Refund workflow or bank settlement needs review.',
  'Account Suspension': 'Account policy or verification status needs review.',
  'Security Concern': 'Account security signal requires investigation.',
  'Performance Issue': 'Application latency or resource usage needs review.',
  'Bug Report': 'Application defect needs reproduction and engineering triage.',
  'Subscription Cancellation': 'Customer value or service experience needs review.',
  'Feature Request': 'Product capability request needs roadmap review.',
  'Data Sync Issue': 'Integration token, sync job, or data pipeline needs review.',
  'Delivery Delay': 'Fulfillment or partner status needs review.',
  'Billing Clarification': 'Invoice or plan mapping needs review.',
};

const resolutionByCategory = {
  'Login Issue': 'Reset access, clear active sessions, and verify successful sign-in.',
  'Payment Failure': 'Verify transaction reference, reconcile payment status, and update access.',
  'Refund Request': 'Confirm refund eligibility, share timeline, and monitor completion.',
  'Account Suspension': 'Review policy trigger and request verification details.',
  'Security Concern': 'Secure the account, rotate credentials, and review login activity.',
  'Performance Issue': 'Capture timestamp, trace latency, and escalate if slow queries continue.',
  'Bug Report': 'Collect reproduction steps, logs, and route to engineering.',
  'Subscription Cancellation': 'Confirm intent, share options, and process the plan change.',
  'Feature Request': 'Log product feedback and share an available workaround.',
  'Data Sync Issue': 'Reconnect integration, refresh token, and trigger sync validation.',
  'Delivery Delay': 'Check latest tracking, update ETA, and escalate overdue items.',
  'Billing Clarification': 'Explain invoice line items and correct mismatched plan labels.',
};

const asText = (value) => String(value || '').trim();
const includesAny = (text, words) => words.some((word) => text.includes(word));

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  return ['true', 'yes', '1', 'y'].includes(asText(value).toLowerCase());
};

const normalizeDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizeAttachments = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((attachment) => ({
      filename: asText(attachment.filename || attachment.name),
      url: asText(attachment.url || attachment.dataUrl),
      uploadedAt: normalizeDate(attachment.uploadedAt) || new Date(),
    }))
    .filter((attachment) => attachment.filename && attachment.url)
    .slice(0, 5);
};

const inferSentiment = (description) => {
  const text = description.toLowerCase();
  if (includesAny(text, negativeWords)) return 'Negative';
  if (includesAny(text, positiveWords)) return 'Positive';
  return 'Neutral';
};

const inferPriority = (description, fallback = 'Medium') => {
  const text = description.toLowerCase();
  if (includesAny(text, urgentWords)) return 'Urgent';
  if (includesAny(text, highWords)) return 'High';
  return fallback || 'Medium';
};

const normalizePriority = (priority, description) => {
  const value = asText(priority);
  if (['Urgent', 'High', 'Medium', 'Low'].includes(value)) return value;
  return inferPriority(description, 'Medium');
};

const normalizeStatus = (status) => {
  const value = asText(status);
  if (['Open', 'In Progress', 'Pending Customer', 'Resolved', 'Closed'].includes(value)) return value;
  if (value === 'Pending') return 'Pending Customer';
  return 'Open';
};

const summarize = (description) => {
  const text = asText(description);
  if (!text) return 'Support request requires review.';
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
};

const validateAndNormalizeTicketRow = (row, index, uploadId) => {
  const ticketDescription = asText(row.ticket_description);
  const ticketId = asText(row.ticket_id) || `TKT-UPLOAD-${String(index + 1).padStart(4, '0')}`;
  const issueCategory = asText(row.issue_category) || 'Bug Report';
  const priority = normalizePriority(row.priority, ticketDescription);
  const sentiment = asText(row.ai_sentiment) || inferSentiment(ticketDescription);

  const errors = [];
  if (!ticketDescription) errors.push({ row: index + 1, field: 'ticket_description', message: 'Ticket description is required.' });
  if (!asText(row.customer_email) && !asText(row.customer_name)) {
    errors.push({ row: index + 1, field: 'customer', message: 'Customer name or email is required.' });
  }

  const churnRisk = priority === 'Urgent' || (priority === 'High' && sentiment === 'Negative')
    ? 'High'
    : priority === 'Medium'
      ? 'Medium'
      : 'Low';

  return {
    valid: errors.length === 0,
    errors,
    ticket: {
      ticket_id: ticketId,
      ticketId,
      customer_name: asText(row.customer_name) || 'Unknown Customer',
      customer_email: asText(row.customer_email),
      product: asText(row.product) || 'Support Platform',
      issue_category: issueCategory,
      category: issueCategory,
      ticket_description: ticketDescription,
      description: ticketDescription,
      subject: summarize(ticketDescription),
      resolution_summary: asText(row.resolution_summary),
      priority,
      status: normalizeStatus(row.status),
      channel: asText(row.channel) || 'Web',
      region: asText(row.region),
      customer_age: toNumber(row.customer_age, undefined),
      customer_gender: asText(row.customer_gender),
      subscription_type: asText(row.subscription_type) || 'Basic',
      previous_tickets: toNumber(row.previous_tickets, 0),
      issue_complexity_score: toNumber(row.issue_complexity_score, 5),
      customer_satisfaction: toNumber(row.customer_satisfaction, 3),
      resolution_time_hours: toNumber(row.resolution_time_hours, 0),
      ticket_created_date: normalizeDate(row.ticket_created_date) || new Date(),
      ticket_updated_date: normalizeDate(row.ticket_updated_date) || new Date(),
      escalation_required: row.escalation_required !== undefined ? toBoolean(row.escalation_required) : priority === 'Urgent',
      sla_breached: toBoolean(row.sla_breached),
      device: asText(row.device),
      browser: asText(row.browser),
      payment_method: asText(row.payment_method),
      language: asText(row.language) || 'English',
      time_of_day: asText(row.time_of_day),
      customer_type: asText(row.customer_type),
      assigned_agent: asText(row.assigned_agent),
      assigned_team: asText(row.assigned_team),
      ai_summary: asText(row.ai_summary) || summarize(ticketDescription),
      ai_sentiment: sentiment,
      sentiment,
      ai_urgency_score: toNumber(row.ai_urgency_score, priority === 'Urgent' ? 95 : priority === 'High' ? 78 : priority === 'Medium' ? 52 : 24),
      ai_root_cause: asText(row.ai_root_cause) || rootCauseByCategory[issueCategory] || 'Support workflow requires review.',
      ai_suggested_resolution: asText(row.ai_suggested_resolution) || resolutionByCategory[issueCategory] || 'Review ticket details and provide next best action.',
      ai_customer_churn_risk: asText(row.ai_customer_churn_risk) || churnRisk,
      ai_confidence_score: toNumber(row.ai_confidence_score, Number((0.75 + ((index % 21) / 100)).toFixed(2))),
      revenue_risk: toNumber(row.revenue_risk, priority === 'Urgent' ? 25000 : priority === 'High' ? 12000 : priority === 'Medium' ? 5000 : 1000),
      tags: Array.isArray(row.tags) ? row.tags : asText(row.tags).split(/[|,]/).map((tag) => tag.trim()).filter(Boolean),
      attachments: normalizeAttachments(row.attachments),
      source: 'upload',
      uploadId,
    },
  };
};

module.exports = {
  validateAndNormalizeTicketRow,
};
