import { chatApi } from './api';
import { generateLocalChatResponse } from './localIntelligenceService';

const sanitizeReply = (response) => ({
  ...response,
  reply: String(response.reply || '')
    .replace(/\*\*/g, '')
    .replace(/^\s*\*\s+/gm, '- ')
    .replace(/^(Sure|Certainly|Here is|Here's)[^\n]*\n+/i, '')
    .trim(),
});

export const sendChatMessage = async ({ role, message, sessionId }) => {
  try {
    const response = await chatApi.send({ role, message, sessionId });
    if (response?.reply) return sanitizeReply(response);
    return sanitizeReply(generateLocalChatResponse({ role, message, includeNotice: true }));
  } catch {
    return sanitizeReply(generateLocalChatResponse({ role, message, includeNotice: true }));
  }
};
