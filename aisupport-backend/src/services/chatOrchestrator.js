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

const sendProviderMessage = async ({ role, message, sessionId }) => {
  if (getProvider() === 'groq') {
    return generateGroqResponse({ role, message });
  }

  return sendChatMessage({ role, message, sessionId });
};

const generateChatReply = async ({ role, message, sessionId }) => {
  const normalizedRole = normalizeRole(role);

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
