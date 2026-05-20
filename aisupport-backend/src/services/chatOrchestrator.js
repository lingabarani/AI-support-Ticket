const { sendChatMessage } = require('./bedrockService');
const { generateGroqResponse } = require('./groqService');
const { generateLocalResponse, normalizeRole } = require('./localIntelligenceService');

const shouldTryExternalAi = () => process.env.ENABLE_EXTERNAL_AI === 'true';

const getProvider = () => String(process.env.AI_PROVIDER || 'bedrock').toLowerCase();

const sanitizeReply = (reply) => String(reply || '')
  .replace(/\*\*/g, '')
  .replace(/^\s*\*\s+/gm, '- ')
  .replace(/^(Sure|Certainly|Here is|Here's)[^\n]*\n+/i, '')
  .trim();

const GREETING_PATTERN = /^(hi|hello|hey|hai|hii|good\s+(morning|afternoon|evening)|namaste)\b[!. ]*$/i;
const SUPPORT_SIGNAL_PATTERN = /\b(ticket|tkt|case|customer|issue|problem|error|bug|login|payment|refund|status|priority|sentiment|summary|summari[sz]e|analy[sz]e|reply|draft|recommend|next action|sla|dashboard|report|agent|team|churn|revenue|security|user|permission|health)\b/i;

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

  if (isLikelyGibberish(text) || (!SUPPORT_SIGNAL_PATTERN.test(text) && text.split(/\s+/).filter(Boolean).length <= 3)) {
    return {
      reply: 'I could not understand that request. Please enter a ticket ID, customer issue, or an action like summarize, draft reply, sentiment, priority, or next steps.',
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
