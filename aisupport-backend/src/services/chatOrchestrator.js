const { sendChatMessage } = require('./bedrockService');
const { generateGroqResponse } = require('./groqService');
const { detectIntent, generateLocalResponse, normalizeRole } = require('./localIntelligenceService');
const { generateAnalyticsAgentResponse } = require('./analyticsAgentService');
const {
  buildConversationalReply,
  detectConversationIntent,
  extractTopic,
  getSession,
  saveSession,
} = require('./conversationMemoryService');

const shouldTryExternalAi = () => process.env.ENABLE_EXTERNAL_AI === 'true' || getProvider() === 'bedrock';

const getProvider = () => String(process.env.AI_PROVIDER || 'bedrock').toLowerCase();

const shouldUseDatasetFirst = (intent) => intent !== 'general_help';

const hasUsableDatasetAnswer = (answer) => {
  if (!answer || answer.source !== 'dataset_grounded') return false;
  if (Number(answer.confidence || 0) < 0.6) return false;
  if (Number(answer.matchedRows || 0) <= 0) return false;
  return true;
};

const shouldFallbackToExternal = (answer) => (
  !answer
  || answer.source === 'dataset_unavailable'
  || Number(answer.confidence || 0) < 0.6
  || Number(answer.matchedRows || 0) <= 0
);

const inferAnalyticsRole = ({ role, message }) => {
  const text = String(message || '').toLowerCase();
  if (/\b(team|agent|agents|workload|overloaded|utilization|escalation trend|escalations|manager|resolved most|average resolution time)\b/.test(text)) {
    return 'team_manager';
  }
  if (/\b(executive|revenue|churn|csat|board|strategic|region|product performance|business risk|retention)\b/.test(text)) {
    return 'business_executive';
  }
  return role;
};

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
  .replace(/\b[\w-]+_\d+\.csv\b/gi, 'enterprise support data')
  .replace(/- Source:\s.*(?:csv|dataset).*$/gim, '- Source: enterprise support intelligence')
  .replace(/\bQuickSight role dataset\b/gi, 'enterprise support intelligence')
  .replace(/^(Sure|Certainly|Here is|Here's)[^\n]*\n+/i, '')
  .trim();

const GREETING_PATTERN = /^(hi|hello|hey|hai|hii|good\s+(morning|afternoon|evening)|namaste)\b[!. ]*$/i;
const isLikelyGibberish = (message) => {
  if (/\b(ticket|tkt|draft|reply|summarize|status|priority|sla|customer|agent|team|revenue|churn|csat)\b/i.test(String(message || ''))) {
    return false;
  }

  const compact = String(message || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (compact.length < 8) return false;
  const vowels = (compact.match(/[aeiou]/g) || []).length;
  const consonantRuns = compact.match(/[bcdfghjklmnpqrstvwxyz]{6,}/g) || [];
  return vowels / compact.length < 0.12 || consonantRuns.length > 2;
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

const buildExternalReply = async ({ role, message, sessionId, fallbackBase = {}, intent }) => {
  const external = await sendProviderMessage({ role, message, sessionId });
  return {
    ...fallbackBase,
    reply: sanitizeReply(external.reply),
    intent,
    sessionId: external.sessionId || sessionId,
    source: getProvider(),
    mode: external.mode || 'chat',
  };
};

const generateChatReply = async ({ role, message, sessionId }) => {
  const normalizedRole = normalizeRole(role);
  const memory = getSession(sessionId);
  const conversational = buildConversationalReply({ role: normalizedRole, message, memory });
  if (conversational) {
    saveSession(sessionId, {
      lastRole: normalizedRole,
      lastIntent: conversational.intent,
      lastMessage: message,
      lastReply: conversational.reply,
    });
    return {
      ...conversational,
      role: normalizedRole,
      source: 'conversation',
      sessionId,
      records: [],
    };
  }

  const guarded = getInputGuardReply({ role: normalizedRole, message });

  if (guarded) {
    return { ...guarded, sessionId };
  }

  const intent = detectIntent(message);
  if (shouldTryExternalAi()) {
    try {
      const externalFirst = await buildExternalReply({
        role: normalizedRole,
        message,
        sessionId,
        intent,
      });
      saveSession(sessionId, {
        lastRole: normalizedRole,
        lastIntent: intent,
        lastMessage: message,
        lastReply: externalFirst.reply,
        lastTopic: extractTopic(message),
      });
      return externalFirst;
    } catch {
      // Continue to local intelligence fallback.
    }
  }

  const topic = extractTopic(message) || memory.lastTopic;
  const contextualMessage = topic && !extractTopic(message)
    ? `${memory.lastMessage || ''} ${message} ${topic}`
    : message;
  const shouldUseDataset = !detectConversationIntent(message) && shouldUseDatasetFirst(intent);
  const analyticsRole = inferAnalyticsRole({ role: normalizedRole, message: contextualMessage });
  const datasetGrounded = shouldUseDataset
    ? await generateAnalyticsAgentResponse({
      role: analyticsRole,
      message: contextualMessage,
      memory,
    })
    : null;
  if (hasUsableDatasetAnswer(datasetGrounded)) {
    saveSession(sessionId, {
      lastRole: normalizedRole,
      lastIntent: datasetGrounded.intent || intent,
      lastMessage: message,
      lastReply: datasetGrounded.reply,
      lastTopic: topic || extractTopic(message),
      lastTicketId: datasetGrounded.records?.[0]?.ticket_id || memory.lastTicketId,
      lastIssueCategory: datasetGrounded.records?.[0]?.issue_category || memory.lastIssueCategory,
      lastRecords: datasetGrounded.records || [],
    });
    return {
      ...datasetGrounded,
      reply: sanitizeReply(datasetGrounded.reply),
      intent: datasetGrounded.intent || intent,
      sessionId,
    };
  }

  const verified = await generateLocalResponse({ role: normalizedRole, message, includeNotice: false });
  const shouldUseVerifiedAnswer = intent === 'metric_query'
    || verified.source === 'dataset_verified'
    || RELIABLE_ROLE_INTENTS[normalizedRole]?.has(intent);

  if (shouldUseVerifiedAnswer && !shouldFallbackToExternal(datasetGrounded)) {
    return {
      ...verified,
      reply: sanitizeReply(verified.reply),
      intent,
      sessionId,
      source: verified.source || 'dataset_verified',
    };
  }

  if (shouldTryExternalAi()) {
    try {
      return await buildExternalReply({
        role: normalizedRole,
        message,
        sessionId,
        fallbackBase: verified,
        intent,
      });
    } catch (error) {
      const fallback = datasetGrounded || verified;
      return {
        ...fallback,
        reply: sanitizeReply(fallback.reply),
        intent,
        sessionId,
        source: 'support_fallback',
        providerStatus: 'unavailable',
      };
    }
  }

  return { ...verified, reply: sanitizeReply(verified.reply), intent, sessionId, source: 'local_intelligence' };
};

module.exports = { generateChatReply };
