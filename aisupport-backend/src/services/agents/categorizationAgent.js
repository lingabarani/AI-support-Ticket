const { getRiskScore } = require('../decisionEngine');
const { classifyRootCause } = require('../rootCauseAnalyzer');
const { evaluateSla } = require('../slaEngine');
const { invokeBedrock, BEDROCK_FALLBACK_MESSAGE } = require('../bedrockService');

const agentResponse = ({ status = 'completed', confidence = 0.84, input, output, recommendation, nextAction }) => ({
  agentName: 'Categorization Agent',
  status,
  confidence,
  input,
  output,
  recommendation,
  nextAction,
});

const CATEGORY_RULES = [
  ['Authentication', /login|password|mfa|otp|sso|auth|locked/i],
  ['Billing', /billing|payment|invoice|refund|subscription|card|charge/i],
  ['Technical Issue', /error|bug|crash|slow|timeout|loading|api|sync/i],
  ['Access Request', /permission|access|role|unauthorized|forbidden/i],
  ['Product Question', /how do|where can|feature|usage|guide|help/i],
];

const textOf = (ticket = {}) => [
  ticket.subject,
  ticket.description,
  ticket.ticket_description,
  ticket.category,
  ticket.issue_category,
].filter(Boolean).join(' ');

const inferCategory = (ticket = {}) => {
  if (ticket.issue_category || ticket.category) return ticket.issue_category || ticket.category;
  const text = textOf(ticket);
  return CATEGORY_RULES.find(([, pattern]) => pattern.test(text))?.[0] || 'General Support';
};

const inferSentiment = (ticket = {}) => {
  if (ticket.ai_sentiment || ticket.sentiment) return ticket.ai_sentiment || ticket.sentiment;
  const text = textOf(ticket);
  if (/angry|frustrated|terrible|bad|not working|failed|urgent|complaint/i.test(text)) return 'Negative';
  if (/thanks|great|resolved|helpful|good/i.test(text)) return 'Positive';
  return 'Neutral';
};

const inferPriority = (ticket = {}) => {
  if (ticket.priority) return ticket.priority;
  const text = textOf(ticket);
  if (/urgent|critical|outage|security|breach|payment failed|payment failure|payment deducted|order failed|fraud|account compromise|cannot login/i.test(text)) return 'High';
  if (/question|how do|request|minor/i.test(text)) return 'Low';
  return 'Medium';
};

const extractJson = (text = '') => {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || '').match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      return JSON.parse(match[0]);
    } catch {
      return {};
    }
  }
};

const runBedrockCategorization = async (ticket = {}) => {
  const response = await invokeBedrock([
    'You are the Categorization Agent for an MSP helpdesk SaaS platform.',
    'Return strict JSON with keys: category, priority, sentiment, tags, recommendation.',
    'Priority must be Critical, High, Medium, or Low. Sentiment must be Positive, Neutral, or Negative.',
    `Ticket: ${JSON.stringify({
      subject: ticket.subject,
      description: ticket.description || ticket.ticket_description,
      category: ticket.category || ticket.issue_category,
    })}`,
  ].join('\n'));
  return response?.fallback || response === BEDROCK_FALLBACK_MESSAGE ? {} : extractJson(response);
};

const categorizeTicket = async (ticket = {}) => {
  const ai = await runBedrockCategorization(ticket);
  const enriched = {
    ...ticket,
    issue_category: ai.category || inferCategory(ticket),
    ai_sentiment: ai.sentiment || inferSentiment(ticket),
    priority: ai.priority || inferPriority(ticket),
  };

  const output = {
    category: enriched.issue_category,
    priority: enriched.priority,
    sentiment: enriched.ai_sentiment,
    sla: evaluateSla(enriched),
    rootCauseCategory: classifyRootCause(enriched),
    riskScore: getRiskScore(enriched),
    tags: [
      enriched.issue_category,
      enriched.priority,
      enriched.ai_sentiment,
      ...(Array.isArray(ai.tags) ? ai.tags : []),
    ].filter(Boolean),
    aiRecommendation: ai.recommendation || '',
    ticket: enriched,
  };

  return agentResponse({
    input: ticket,
    output,
    confidence: ai.category || ai.priority ? 0.88 : 0.76,
    recommendation: output.sla.escalationTriggered
      ? 'Escalate SLA-sensitive ticket before resolution automation.'
      : ai.recommendation || 'Proceed to resolution analysis.',
    nextAction: output.sla.escalationTriggered ? 'supervisor_agent' : 'resolution_agent',
  });
};

module.exports = {
  agentResponse,
  categorizeTicket,
  inferCategory,
  inferPriority,
  inferSentiment,
};
