const { sendChatMessage } = require('./bedrockService');
const { generateGroqResponse } = require('./groqService');
const { detectIntent, generateLocalResponse, normalizeRole } = require('./localIntelligenceService');

const shouldTryExternalAi = () => process.env.ENABLE_EXTERNAL_AI === 'true';

const getProvider = () => String(process.env.AI_PROVIDER || 'bedrock').toLowerCase();

const RELIABLE_ROLE_INTENTS = {
  customer: new Set([
    'customer_ticket_volume',
    'customer_resolved_tickets',
    'ticket_status',
    'ticket_summary',
    'open_tickets',
    'knowledge_base',
    'recommended_action',
    'dashboard_explanation',
  ]),
  support_agent: new Set([
    'ticket_summary',
    'ticket_status',
    'ticket_priority',
    'ticket_sentiment',
    'suggested_reply',
    'recommended_action',
    'similar_tickets',
    'open_tickets',
    'high_priority_tickets',
    'sla_breaches',
  ]),
  team_manager: new Set([
    'team_performance',
    'agent_workload',
    'open_tickets',
    'sla_breaches',
    'ticket_summary',
    'escalation_risk',
    'priority_queue',
    'csat_risk',
    'first_response',
  ]),
  business_executive: new Set([
    'executive_summary',
    'revenue_risk',
    'churn_risk',
    'sentiment_trend',
    'dashboard_explanation',
  ]),
  system_admin: new Set([
    'system_health',
    'user_management',
    'role_permissions',
    'security_alerts',
    'dashboard_explanation',
  ]),
};

const sanitizeReply = (reply) => String(reply || '')
  .replace(/\*\*/g, '')
  .replace(/^\s*\*\s+/gm, '- ')
  .replace(/^(Sure|Certainly|Here is|Here's)[^\n]*\n+/i, '')
  .trim();

const GREETING_PATTERN = /^(hi|hello|hey|hai|hii|good\s+(morning|afternoon|evening)|namaste)\b[!. ]*$/i;
const isLikelyGibberish = (message) => {
  const compact = String(message || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (compact.length < 8) return false;
  const vowels = (compact.match(/[aeiou]/g) || []).length;
  const consonantRuns = compact.match(/[bcdfghjklmnpqrstvwxyz]{6,}/g) || [];
  return vowels / compact.length < 0.25 || consonantRuns.length > 0;
};

const getInputGuardReply = ({ role, message }) => {
  const text = String(message || '').trim();
  if (GREETING_PATTERN.test(text)) {
    return {
      reply: 'Hi. What would you like to do: summarize tickets, draft a reply, check sentiment, predict priority, or review next actions?',
      role,
      source: 'assistant_guard',
      cards: [],
      suggestedActions: ['Summarize open tickets', 'Draft a customer reply', 'Check SLA risks'],
    };
  }

  if (isLikelyGibberish(text)) {
    return {
      reply: 'I could not understand that request. Please ask a clear question or enter a ticket ID, customer issue, or support action.',
      role,
      source: 'assistant_guard',
      cards: [],
      suggestedActions: ['Summarize open tickets', 'Analyze TKT-0001', 'Draft a reply'],
    };
  }

  return null;
};

const sendProviderMessage = async ({ role, message, sessionId }) => {
  if (getProvider() === 'groq') {
    return generateGroqResponse({ role, message });
  }

  return sendChatMessage({ role, message, sessionId });
};

const generateChatReply = async ({ role, message, sessionId }) => {
  const normalizedRole = normalizeRole(role);
  const guarded = getInputGuardReply({ role: normalizedRole, message });

  if (guarded) {
    return { ...guarded, sessionId };
  }

  const intent = detectIntent(message);
  if (RELIABLE_ROLE_INTENTS[normalizedRole]?.has(intent)) {
    return generateLocalResponse({ role: normalizedRole, message, includeNotice: false });
  }

  if (!shouldTryExternalAi()) {
    return generateLocalResponse({ role: normalizedRole, message, includeNotice: true });
  }

  try {
    const ai = await sendProviderMessage({ role: normalizedRole, message, sessionId });
    return {
      reply: sanitizeReply(ai.reply),
      role: normalizedRole,
      source: 'ai',
      cards: [],
      suggestedActions: [],
      sessionId: ai.sessionId || sessionId,
    };
  } catch {
    return generateLocalResponse({ role: normalizedRole, message, includeNotice: true });
  }
};

module.exports = { generateChatReply };
