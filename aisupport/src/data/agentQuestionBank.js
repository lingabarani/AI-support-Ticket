const BANK_SIZE = 100000;

const roleConfig = {
  customer: {
    topics: [
      'ticket status', 'refund status', 'login help', 'billing issue', 'password reset',
      'open tickets', 'ticket update', 'attachment requirements', 'SLA timeline', 'support next step',
      'payment failure', 'account access', 'delivery delay', 'subscription cancellation', 'knowledge base article',
    ],
    actions: [
      'track', 'explain', 'summarize', 'show', 'find help for', 'recommend next steps for',
      'check progress for', 'clarify', 'give a simple update on', 'tell me what to do for',
    ],
    scopes: [
      'my latest request', 'my open case', 'today', 'with a short answer', 'with clear next steps',
      'for a non-technical customer', 'with expected resolution', 'with required documents',
    ],
    formats: [
      ({ action, topic, scope }) => `${action} ${topic} for ${scope}`,
      ({ topic, scope }) => `What is happening with ${topic} for ${scope}?`,
      ({ topic }) => `Why is my ${topic} still not resolved?`,
      ({ action, topic }) => `${action} ${topic} and tell me what I should do next`,
    ],
  },
  support_agent: {
    topics: [
      'high-priority open tickets', 'negative sentiment tickets', 'SLA breached tickets',
      'urgent in-progress tickets', 'billing dispute tickets', 'refund request tickets',
      'login issue tickets', 'API error tickets', 'data sync failure tickets', 'payment failure tickets',
      'tickets with high churn risk', 'tickets with high revenue risk', 'open tickets by region',
      'tickets pending customer response', 'escalation-required tickets', 'similar tickets',
      'customer reply drafts', 'root cause analysis', 'priority prediction', 'sentiment detection',
    ],
    actions: [
      'show', 'summarize', 'rank', 'prioritize', 'compare', 'find exceptions in',
      'recommend next actions for', 'draft a reply for', 'explain the risk in',
      'identify patterns in', 'triage', 'find top 3', 'find top 5', 'analyze',
    ],
    scopes: [
      'by urgency', 'by SLA risk', 'by sentiment', 'by revenue impact', 'for today',
      'for the current queue', 'with ownership recommendation', 'with escalation recommendation',
      'with customer-safe language', 'with confidence level', 'for enterprise accounts',
      'for breached SLA cases', 'for negative sentiment cases', 'for high churn accounts',
    ],
    formats: [
      ({ action, topic, scope }) => `${action} ${topic} ${scope}`,
      ({ topic, scope }) => `Which ${topic} should be handled first ${scope}?`,
      ({ topic, scope }) => `Find ${topic} and explain the operational risk ${scope}`,
      ({ action, topic }) => `${action} ${topic} and recommend the next best action`,
      ({ topic, scope }) => `Create a concise support plan for ${topic} ${scope}`,
    ],
  },
  team_manager: {
    topics: [
      'team SLA breaches', 'overloaded agents', 'open workload by team', 'average resolution time by team',
      'escalation trend', 'agent productivity', 'team utilization', 'recurring issues',
      'urgent ticket distribution', 'first response risk', 'queue pressure', 'resolution bottlenecks',
      'team performance', 'agent workload balance', 'SLA compliance gaps', 'daily operations summary',
      'team capacity risk', 'handoff delays', 'agent outliers', 'manager action plan',
    ],
    actions: [
      'show', 'summarize', 'compare', 'rank', 'explain', 'recommend', 'forecast',
      'find outliers in', 'diagnose', 'prioritize', 'build a same-day plan for',
      'identify root causes in', 'review', 'give manager actions for',
    ],
    scopes: [
      'for today', 'for this week', 'by team', 'by agent', 'by SLA impact',
      'by workload risk', 'with top 3 actions', 'with staffing recommendation',
      'with escalation reduction plan', 'with operational risk score', 'for the daily standup',
      'for leadership review', 'for overloaded queues', 'for breach prevention',
    ],
    formats: [
      ({ action, topic, scope }) => `${action} ${topic} ${scope}`,
      ({ topic, scope }) => `Which team is most exposed by ${topic} ${scope}?`,
      ({ topic, scope }) => `What is driving ${topic} ${scope}?`,
      ({ action, topic }) => `${action} ${topic} and recommend a workload rebalance`,
      ({ topic, scope }) => `Create a manager action plan for ${topic} ${scope}`,
    ],
  },
  business_executive: {
    topics: [
      'revenue risk by region', 'churn risk by issue', 'CSAT trend', 'sentiment trend',
      'revenue risk by product', 'business risk by department', 'ticket volume trend',
      'strategic recommendations', 'impacted accounts', 'customer retention risk',
      'regional performance', 'product performance', 'executive summary', 'financial exposure',
      'board update', 'customer sentiment impact', 'enterprise account risk', 'growth risk',
      'service recovery priority', 'quarterly support strategy',
    ],
    actions: [
      'show', 'summarize', 'compare', 'rank', 'explain', 'recommend', 'forecast',
      'identify', 'connect', 'prioritize', 'prepare', 'give executive actions for',
      'find the biggest opportunity in', 'analyze', 'create a board-ready view of',
    ],
    scopes: [
      'by region', 'by product', 'for this quarter', 'for leadership review',
      'with top 3 actions', 'with financial impact', 'with retention actions',
      'for board summary', 'with strategic recommendation', 'with customer impact',
      'with revenue and churn together', 'by business unit', 'for high-risk accounts',
    ],
    formats: [
      ({ action, topic, scope }) => `${action} ${topic} ${scope}`,
      ({ topic, scope }) => `What is the business impact of ${topic} ${scope}?`,
      ({ topic, scope }) => `Which area should leadership prioritize based on ${topic} ${scope}?`,
      ({ action, topic }) => `${action} ${topic} and give strategic recommendations`,
      ({ topic, scope }) => `Create an executive briefing for ${topic} ${scope}`,
    ],
  },
};

const at = (items, index) => items[index % items.length];

const buildQuestion = (config, index) => {
  const action = at(config.actions, index);
  const topic = at(config.topics, Math.floor(index / config.actions.length));
  const scope = at(config.scopes, Math.floor(index / (config.actions.length * config.topics.length)));
  const format = at(config.formats, Math.floor(index / (config.actions.length * config.topics.length * config.scopes.length)));
  const question = format({ action, topic, scope });
  return question.charAt(0).toUpperCase() + question.slice(1);
};

const generateBank = (role) => {
  const config = roleConfig[role] || roleConfig.support_agent;
  return Array.from({ length: BANK_SIZE }, (_, index) => buildQuestion(config, index));
};

export const agentQuestionBank = {
  customer: generateBank('customer'),
  support_agent: generateBank('support_agent'),
  team_manager: generateBank('team_manager'),
  business_executive: generateBank('business_executive'),
};

export const getAgentQuestionSample = (role = 'support_agent', page = 0, size = 4) => {
  const bank = agentQuestionBank[role] || agentQuestionBank.support_agent;
  const start = (page * size) % bank.length;
  return Array.from({ length: Math.min(size, bank.length) }, (_, index) => bank[(start + index) % bank.length]);
};
