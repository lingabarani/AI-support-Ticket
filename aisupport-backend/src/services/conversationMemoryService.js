const sessions = new Map();
const MAX_SESSIONS = 500;

const casualPatterns = {
  greeting: /^(hi|hello|hey|hai|hii|good\s+(morning|afternoon|evening)|namaste)\b[!. ]*$/i,
  confirmation: /^(yes|yeah|yep|sure|ok|okay|continue|go on|tell me more|more|please do)\b[!. ]*$/i,
  rejection: /^(no|nope|not now|cancel|stop)\b[!. ]*$/i,
  wellbeing: /how are you|what'?s up|who are you/i,
};

const getSession = (sessionId = 'default') => sessions.get(sessionId) || {
  lastRole: 'support_agent',
  lastIntent: '',
  lastMessage: '',
  lastReply: '',
  lastTopic: '',
  lastTicketId: '',
  lastIssueCategory: '',
  lastRecords: [],
};

const saveSession = (sessionId = 'default', patch = {}) => {
  if (sessions.size > MAX_SESSIONS) sessions.delete(sessions.keys().next().value);
  const current = getSession(sessionId);
  const next = { ...current, ...patch, updatedAt: Date.now() };
  sessions.set(sessionId, next);
  return next;
};

const detectConversationIntent = (message = '') => {
  const text = String(message || '').trim();
  if (casualPatterns.greeting.test(text)) return 'Greeting';
  if (casualPatterns.confirmation.test(text)) return 'Confirmation';
  if (casualPatterns.rejection.test(text)) return 'Rejection';
  if (casualPatterns.wellbeing.test(text)) return 'General conversation';
  return '';
};

const extractTopic = (message = '') => {
  const text = String(message || '').toLowerCase();
  if (/payment|billing|invoice|refund/.test(text)) return 'payment issues';
  if (/login|auth|password|sso|mfa/.test(text)) return 'login issues';
  if (/sla|breach|overdue/.test(text)) return 'SLA risk';
  if (/revenue|churn|csat|region|product/.test(text)) return 'business analytics';
  const ticket = text.match(/\bTKT[-\s]?\d+\b/i)?.[0]?.toUpperCase().replace(/\s+/, '-');
  if (ticket) return ticket;
  return '';
};

const buildConversationalReply = ({ role, message, memory }) => {
  const intent = detectConversationIntent(message);
  if (intent === 'Greeting') {
    return {
      reply: "Hi. I can help with ticket triage, SLA risk, customer issues, or support analytics. What would you like to check?",
      intent,
      suggestedQuestions: ['Show open tickets', 'Summarize a ticket', 'Check SLA risks'],
    };
  }
  if (intent === 'Rejection') {
    return {
      reply: "No problem. Let me know if you'd like to check ticket status, SLA details, customer history, or suggested resolution steps.",
      intent,
      suggestedQuestions: ['Check ticket status', 'Show SLA details', 'Find customer history'],
    };
  }
  if (intent === 'Confirmation') {
    const topic = memory.lastTopic || memory.lastTicketId || 'that request';
    return {
      reply: `Okay. For ${topic}, would you like a concise summary, related incidents, or suggested resolution steps?`,
      intent,
      suggestedQuestions: ['Summarize the issue', 'Find similar incidents', 'Suggest resolution steps'],
    };
  }
  if (intent === 'General conversation') {
    return {
      reply: "I'm ready to help with tickets, analytics, or support operations. What would you like to check?",
      intent,
      suggestedQuestions: ['Show open tickets', 'Check SLA performance', 'Look up a customer issue'],
    };
  }
  return null;
};

module.exports = {
  buildConversationalReply,
  detectConversationIntent,
  extractTopic,
  getSession,
  saveSession,
};
