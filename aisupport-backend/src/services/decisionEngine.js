const { evaluateAutoResolution } = require('./autoResolutionService');
const { evaluateSla } = require('./slaEngine');

const priorityWeight = { Critical: 48, Urgent: 44, High: 32, Medium: 14, Low: 5 };
const sentimentWeight = { Negative: 18, Neutral: 6, Positive: 0 };
const DEFAULT_CONFIDENCE = 0.78;

const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getRiskScore = (ticket = {}) => {
  const sla = evaluateSla(ticket);
  const priority = priorityWeight[ticket.priority] || priorityWeight.Medium;
  const sentiment = sentimentWeight[ticket.ai_sentiment || ticket.sentiment] || 0;
  const churn = /high|critical/i.test(String(ticket.ai_customer_churn_risk || ticket.ai_churn_risk || '')) ? 15 : 0;
  const revenue = Math.min(18, Math.floor(asNumber(ticket.revenue_risk) / 5000));
  const complexity = Math.min(12, asNumber(ticket.issue_complexity_score) * 2);
  const slaRisk = sla.breached ? 25 : sla.atRisk ? 14 : 0;

  return Math.min(100, Math.round(priority + sentiment + churn + revenue + complexity + slaRisk));
};

const textOf = (ticket = {}) => [
  ticket.subject,
  ticket.description,
  ticket.category,
  ticket.issue_category,
  ticket.ticket_description,
  ticket.ai_summary,
  ...(Array.isArray(ticket.tags) ? ticket.tags : []),
].filter(Boolean).join(' ').toLowerCase();

const getConfidence = (ticket = {}) => {
  const confidence = asNumber(ticket.ai_confidence_score ?? ticket.confidence, DEFAULT_CONFIDENCE);
  return Math.max(0, Math.min(1, confidence > 1 ? confidence / 100 : confidence));
};

const evaluateDecision = (ticket = {}) => {
  const text = textOf(ticket);
  const sla = evaluateSla(ticket);
  const confidence = getConfidence(ticket);
  const lowRiskKnownIssue = /password reset|reset password|forgot password|invoice request|invoice copy|refund status|where is my refund|refund update|faq|how do i|how to|basic troubleshooting|clear cache|restart|troubleshoot/.test(text);
  const mediumRiskIssue = /payment failure|payment failed|payment deducted|order failed|transaction failed|product mismatch|wrong product|wrong item|delivery delay|late delivery|card declined/.test(text);
  const highRiskIssue = /fraud suspicion|fraud|account compromise|account compromised|account takeover|unauthorized|high-value refund|high value refund|legal complaint|lawsuit|stolen|identity theft|chargeback|security breach/.test(text);

  if (confidence < 0.6) {
    return {
      decision: 'supervisor_review',
      action: 'Escalate to supervisor for low-confidence validation',
      assignedTeam: 'Team Manager',
      autoResolved: false,
      escalationRequired: true,
      reason: 'Low AI confidence requires supervisor escalation.',
      confidence,
    };
  }

  if (highRiskIssue) {
    return {
      decision: 'supervisor_review',
      action: 'Hold automation and request supervisor review',
      assignedTeam: 'Risk Operations',
      autoResolved: false,
      escalationRequired: true,
      reason: 'Fraud suspicion requires supervisor review.',
      confidence,
    };
  }

  if (/security|breach|account takeover|unauthorized|compromised/.test(text)) {
    return {
      decision: 'security_escalation',
      action: 'Escalate to security team',
      assignedTeam: 'Security Team',
      autoResolved: false,
      escalationRequired: true,
      reason: 'Account security issue requires escalation.',
      confidence,
    };
  }

  if (sla.escalationTriggered) {
    return {
      decision: 'manager_escalation',
      action: 'Escalate to team manager',
      assignedTeam: 'Team Manager',
      autoResolved: false,
      escalationRequired: true,
      reason: sla.breached ? 'SLA is breached.' : sla.stale ? 'Ticket is stale and approaching SLA risk.' : 'Ticket is at SLA breach risk.',
      confidence,
    };
  }

  if (mediumRiskIssue) {
    return {
      decision: 'route_to_billing',
      action: /product mismatch|wrong product|wrong item/.test(text)
        ? 'Route to Product Support Team'
        : /delivery delay|late delivery/.test(text)
          ? 'Route to Logistics Team'
          : 'Route to Billing Team',
      assignedTeam: /product mismatch|wrong product|wrong item/.test(text)
        ? 'Product Support Team'
        : /delivery delay|late delivery/.test(text)
          ? 'Logistics Team'
          : 'Billing Team',
      autoResolved: false,
      escalationRequired: false,
      reason: 'Medium-risk ticket requires assignment to the correct operating team.',
      confidence,
    };
  }

  if (lowRiskKnownIssue) {
    return {
      decision: 'auto_resolve',
      action: 'Auto resolve with approved support guidance',
      assignedTeam: 'Automation',
      autoResolved: true,
      escalationRequired: false,
      reason: 'Low-risk known issue is eligible for auto-resolution.',
      confidence,
    };
  }

  if (/faq|how do i|how to|where can i|knowledge base|help article/.test(text)
    && ['Low', 'Medium'].includes(ticket.priority || 'Medium')) {
    return {
      decision: 'auto_resolve',
      action: 'Auto resolve with FAQ article',
      assignedTeam: 'Automation',
      autoResolved: true,
      escalationRequired: false,
      reason: 'Low-risk FAQ issue is eligible for auto-resolution.',
      confidence,
    };
  }

  return {
    decision: 'agent_review',
    action: 'Assign to support agent',
    assignedTeam: ticket.assigned_team || 'Customer Support',
    autoResolved: false,
    escalationRequired: false,
    reason: 'Ticket requires standard support review.',
    confidence,
  };
};

const decideNextAction = (ticket = {}) => {
  const riskScore = getRiskScore(ticket);
  const sla = evaluateSla(ticket);
  const autoResolution = evaluateAutoResolution(ticket);
  const status = String(ticket.status || 'Open');
  const policy = evaluateDecision(ticket);

  if (['Resolved', 'Closed'].includes(status)) {
    return {
      decision: 'monitor',
      owner: 'system',
      riskScore,
      sla,
      reasons: ['Ticket is already resolved or closed.'],
      nextActions: ['Keep audit history available for reporting.'],
    };
  }

  if (policy.escalationRequired || sla.breached || riskScore >= 75) {
    return {
      decision: policy.decision === 'supervisor_review' ? 'supervisor_review' : 'escalate',
      owner: policy.assignedTeam,
      riskScore,
      sla,
      policy,
      reasons: [policy.reason],
      nextActions: [policy.action, 'Record audit event.', 'Send customer status update.'],
    };
  }

  if (policy.autoResolved || autoResolution.canAutoResolve) {
    return {
      decision: 'auto_resolve',
      owner: policy.assignedTeam,
      riskScore,
      sla,
      policy,
      reasons: [policy.reason, ...autoResolution.reasons].filter(Boolean),
      nextActions: [policy.action, 'Record an audit note.', 'Notify customer.'],
    };
  }

  return {
    decision: policy.decision,
    owner: policy.assignedTeam,
    riskScore,
    sla,
    policy,
    reasons: [policy.reason, ...autoResolution.reasons].filter(Boolean),
    nextActions: [policy.action, 'Send next-step response.', 'Update ticket status.'],
  };
};

const rankTicketsForAction = (tickets = []) => tickets
  .map((ticket) => ({ ticket, decision: decideNextAction(ticket) }))
  .sort((a, b) => b.decision.riskScore - a.decision.riskScore);

module.exports = {
  decideNextAction,
  evaluateDecision,
  getConfidence,
  getRiskScore,
  rankTicketsForAction,
};
