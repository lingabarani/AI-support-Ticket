const HIGH_RISK_CATEGORIES = /billing|refund|payment|security|suspension|fraud|privacy|compliance/i;
const ENTERPRISE_TYPES = /enterprise|government|healthcare|finance|bank|strategic/i;

const asText = (value = '') => String(value || '').trim();
const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const includesHighRiskCategory = (ticket) => HIGH_RISK_CATEGORIES.test([
  ticket.issue_category,
  ticket.category,
  ticket.subject,
  ticket.ticket_description,
  ticket.description,
].filter(Boolean).join(' '));

const isEnterpriseCustomer = (ticket) => ENTERPRISE_TYPES.test([
  ticket.customer_type,
  ticket.subscription_type,
  ticket.account_company,
].filter(Boolean).join(' '));

const hasSlaRisk = (ticket) => ticket.sla_breached === true
  || asText(ticket.sla_status).toLowerCase() === 'breached'
  || (ticket.sla_due_at && new Date(ticket.sla_due_at).getTime() < Date.now());

const hasHighChurnRisk = (ticket) => /high|critical/i.test(asText(ticket.ai_customer_churn_risk || ticket.ai_churn_risk));

const hasHighRevenueRisk = (ticket) => asNumber(ticket.revenue_risk) >= 25000;

const isLowRisk = (ticket) => {
  const priority = asText(ticket.priority) || 'Medium';
  const sentiment = asText(ticket.ai_sentiment || ticket.sentiment) || 'Neutral';
  const confidence = asNumber(ticket.ai_confidence_score, 0.82);
  return ['Low', 'Medium'].includes(priority)
    && !/negative/i.test(sentiment)
    && !includesHighRiskCategory(ticket)
    && !hasSlaRisk(ticket)
    && !isEnterpriseCustomer(ticket)
    && !hasHighChurnRisk(ticket)
    && !hasHighRevenueRisk(ticket)
    && confidence >= 0.75;
};

const evaluateAutoResolution = (ticket = {}) => {
  const reasons = [];

  if (isEnterpriseCustomer(ticket)) reasons.push('Enterprise, government, healthcare, finance, or strategic customer requires manager approval.');
  if (hasHighChurnRisk(ticket)) reasons.push('High churn risk requires manager approval.');
  if (hasHighRevenueRisk(ticket)) reasons.push('High revenue risk requires manager approval.');

  if (reasons.length) {
    return {
      decision: 'manager_approval_required',
      canAutoResolve: false,
      nextStatus: 'Pending Customer',
      reasons,
      recommendation: 'Route to manager for approval before resolution.',
    };
  }

  if (includesHighRiskCategory(ticket)) reasons.push('Billing, refund, payment, security, or compliance category requires human approval.');
  if (hasSlaRisk(ticket)) reasons.push('SLA breach or SLA-at-risk ticket requires human approval.');
  if (['Urgent', 'High'].includes(asText(ticket.priority))) reasons.push('High or urgent priority requires human approval.');
  if (/negative/i.test(asText(ticket.ai_sentiment || ticket.sentiment))) reasons.push('Negative customer sentiment requires agent review.');

  if (reasons.length) {
    return {
      decision: 'approval_required',
      canAutoResolve: false,
      nextStatus: 'Pending Customer',
      reasons,
      recommendation: 'Require support agent approval before marking resolved.',
    };
  }

  if (isLowRisk(ticket)) {
    return {
      decision: 'auto_resolve_allowed',
      canAutoResolve: true,
      nextStatus: 'Resolved',
      reasons: ['Low-risk ticket with sufficient AI confidence and no policy blockers.'],
      recommendation: 'Auto-resolve and add an audit note.',
    };
  }

  return {
    decision: 'approval_required',
    canAutoResolve: false,
    nextStatus: 'Pending Customer',
    reasons: ['Ticket does not meet all low-risk auto-resolution conditions.'],
    recommendation: 'Request human review before resolving.',
  };
};

const buildResolutionNote = (ticket, evaluation) => [
  `Auto-resolution decision: ${evaluation.decision}.`,
  `Recommendation: ${evaluation.recommendation}`,
  `Reasons: ${evaluation.reasons.join(' ')}`,
  `Suggested resolution: ${ticket.ai_suggested_resolution || ticket.resolution_summary || 'Review and confirm customer outcome.'}`,
].join('\n');

module.exports = {
  buildResolutionNote,
  evaluateAutoResolution,
};
