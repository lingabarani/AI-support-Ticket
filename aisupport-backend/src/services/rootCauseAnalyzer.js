const CATEGORY_PATTERNS = [
  ['Authentication', /login|password|mfa|otp|sso|auth|account locked|sign[ -]?in/i],
  ['Payment', /payment|billing|invoice|refund|card|upi|charge|subscription/i],
  ['Performance', /slow|latency|timeout|loading|performance|lag|crash/i],
  ['Integration', /api|webhook|integration|sync|connector|import|export/i],
  ['Access', /permission|role|access|unauthorized|forbidden|privilege/i],
  ['Data Quality', /missing data|duplicate|incorrect|mismatch|report|dashboard|analytics/i],
  ['Notification', /email|sms|notification|alert|delivery/i],
];

const ROOT_CAUSE_LIBRARY = {
  Authentication: 'Credential, session, or identity-provider flow is preventing normal access.',
  Payment: 'Payment authorization, invoice state, or subscription entitlement needs verification.',
  Performance: 'Application latency, resource saturation, or client-side runtime failure is likely.',
  Integration: 'External integration, API contract, or sync pipeline is failing or delayed.',
  Access: 'Role permissions or account policy are blocking the requested action.',
  'Data Quality': 'Dataset freshness, transformation rules, or duplicate records may be affecting output.',
  Notification: 'Message delivery configuration, provider throttling, or contact data may be invalid.',
  General: 'The ticket needs more evidence before a specific root cause can be confirmed.',
};

const evidenceText = (ticket = {}) => [
  ticket.subject,
  ticket.description,
  ticket.category,
  ticket.issue_category,
  ticket.ticket_description,
  ticket.resolution_summary,
  ticket.ai_summary,
  ticket.ai_root_cause,
  ...(Array.isArray(ticket.tags) ? ticket.tags : []),
].filter(Boolean).join(' ');

const classifyRootCause = (ticket = {}) => {
  const text = evidenceText(ticket);
  const match = CATEGORY_PATTERNS.find(([, pattern]) => pattern.test(text));
  return match ? match[0] : 'General';
};

const analyzeRootCause = (ticket = {}, relatedTickets = []) => {
  const category = classifyRootCause(ticket);
  const relatedInCategory = relatedTickets.filter((item) => classifyRootCause(item) === category);
  const repeatedCustomer = relatedTickets.filter((item) => (
    item.customer_email && ticket.customer_email && item.customer_email === ticket.customer_email
  ));
  const confidence = Math.min(0.95, 0.55 + (relatedInCategory.length ? 0.2 : 0) + (repeatedCustomer.length ? 0.1 : 0));

  return {
    category,
    rootCause: ticket.ai_root_cause || ticket.aiRootCause || ROOT_CAUSE_LIBRARY[category],
    confidence: Number(confidence.toFixed(2)),
    evidence: {
      relatedCategoryCount: relatedInCategory.length,
      repeatedCustomerCount: repeatedCustomer.length,
      source: ticket.ai_root_cause || ticket.aiRootCause ? 'ticket_ai_field' : 'rules_engine',
    },
    recommendedInvestigation: [
      `Validate ${category.toLowerCase()} evidence from ticket details.`,
      relatedInCategory.length ? 'Compare with recent similar tickets before replying.' : 'Collect logs, screenshots, or account context if missing.',
    ],
  };
};

module.exports = {
  analyzeRootCause,
  classifyRootCause,
};
