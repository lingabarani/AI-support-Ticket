const { evaluateDecision, getConfidence, getRiskScore } = require('./decisionEngine');
const { analyzeRootCause } = require('./rootCauseAnalyzer');

const textOf = (ticket = {}) => [
  ticket.subject,
  ticket.description,
  ticket.ticket_description,
  ticket.issue_category,
  ticket.category,
  ticket.ai_summary,
].filter(Boolean).join(' ').toLowerCase();

const detectDuplicates = (ticket = {}, tickets = []) => {
  const text = textOf(ticket);
  const tokens = new Set(text.split(/[^a-z0-9]+/).filter((token) => token.length > 4));
  return tickets
    .filter((item) => item.ticket_id !== ticket.ticket_id)
    .map((item) => {
      const itemTokens = textOf(item).split(/[^a-z0-9]+/).filter((token) => tokens.has(token));
      return { ticketId: item.ticket_id || item.ticketId, overlap: itemTokens.length };
    })
    .filter((item) => item.overlap >= 3)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 5);
};

const predictPriority = (ticket = {}) => {
  const text = textOf(ticket);
  if (/fraud|security|breach|outage|cannot login|payment failed|critical/.test(text)) return 'Critical';
  if (/refund|invoice|blocked|urgent|failed|negative/.test(text)) return 'High';
  if (/question|how do|faq|status/.test(text)) return 'Low';
  return ticket.priority || 'Medium';
};

const predictChurn = (ticket = {}) => {
  const risk = getRiskScore(ticket);
  if (risk >= 75 || /cancel|churn|angry|refund|terrible/i.test(textOf(ticket))) return 'High';
  if (risk >= 45) return 'Medium';
  return 'Low';
};

const detectFraud = (ticket = {}) => /fraud|stolen|chargeback|identity theft|suspicious|fake/i.test(textOf(ticket));

const suggestReply = (ticket = {}, decision = evaluateDecision(ticket)) => {
  const customer = ticket.customer_name || 'Customer';
  if (decision.decision === 'auto_resolve') {
    return `Hi ${customer}, we found this is covered by our support guidance and applied the recommended resolution. Please reply if the issue continues.`;
  }
  if (decision.decision === 'auto_reply') {
    return `Hi ${customer}, thanks for reaching out. We checked your request and will share the relevant status or reset steps shortly.`;
  }
  if (decision.escalationRequired) {
    return `Hi ${customer}, your request needs priority review. We have escalated it to the right team and will update you as soon as ownership is confirmed.`;
  }
  return `Hi ${customer}, we reviewed your request and are checking the next best action. We will keep you updated within the SLA window.`;
};

const buildAutomationInsights = ({ ticket = {}, tickets = [] } = {}) => {
  const decision = evaluateDecision(ticket);
  const rootCause = analyzeRootCause(ticket, tickets);
  const priority = predictPriority(ticket);
  const churnRisk = predictChurn({ ...ticket, priority });
  const fraudDetected = detectFraud(ticket);
  const duplicates = detectDuplicates(ticket, tickets);

  return {
    autoRefund: decision.decision === 'auto_reply' && /refund status|where is my refund/i.test(textOf(ticket)),
    autoApproval: decision.autoResolved || decision.decision === 'auto_reply',
    autoEscalation: decision.escalationRequired,
    autoRouting: decision.assignedTeam,
    suggestedReply: suggestReply(ticket, decision),
    knowledgeSearch: rootCause.recommendedInvestigation,
    duplicateTickets: duplicates,
    priorityPrediction: priority,
    churnPrediction: churnRisk,
    fraudDetection: fraudDetected ? 'Suspected' : 'Not detected',
    sentimentDetection: ticket.ai_sentiment || ticket.sentiment || 'Neutral',
    escalationPrediction: decision.escalationRequired ? 'Likely' : getRiskScore(ticket) >= 55 ? 'Watch' : 'Unlikely',
    confidence: getConfidence(ticket),
    decision,
  };
};

module.exports = {
  buildAutomationInsights,
  detectDuplicates,
  detectFraud,
  predictChurn,
  predictPriority,
  suggestReply,
};
