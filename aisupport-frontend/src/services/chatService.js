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
  } catch (error) {
    const fallback = generateLocalChatResponse({ role, message, includeNotice: false });
    return sanitizeReply({
      ...fallback,
      reply: [
        'Backend server is not reachable, so Amazon Bedrock AI cannot be called from the UI.',
        'Start the backend with: cd "E:\\ML Models\\AI-support-Ticket-main\\aisupport-backend" && node src\\server.js',
        '',
        fallback.reply,
      ].join('\n'),
      source: 'frontend_backend_offline',
      error: error.message,
    });
  }
};
