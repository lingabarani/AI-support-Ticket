const { calculateSlaDueAt } = require('../slaEngine');
const { invokeBedrock, BEDROCK_FALLBACK_MESSAGE } = require('../bedrockService');
const { inferCategory, inferPriority, inferSentiment } = require('./categorizationAgent');

const agentResponse = ({ status = 'completed', confidence = 0.86, input, output, recommendation, nextAction }) => ({
  agentName: 'Intake Agent',
  status,
  confidence,
  input,
  output,
  recommendation,
  nextAction,
});

const runBedrockIntake = async (ticket) => {
  const response = await invokeBedrock([
    'You are the Intake Agent for an MSP helpdesk SaaS platform.',
    'Validate and summarize the submitted ticket in one concise sentence.',
    'Do not expose AWS details. Return practical support language only.',
    `Ticket: ${JSON.stringify({
      subject: ticket.subject,
      description: ticket.description,
      customer: ticket.customer_name,
    })}`,
  ].join('\n'));
  return response?.fallback || response === BEDROCK_FALLBACK_MESSAGE ? '' : response;
};

const normalizeTicketInput = async (input = {}) => {
  const now = new Date();
  const ticket = {
    ...input,
    ticket_id: input.ticket_id || input.ticketId,
    customer_name: input.customer_name || input.customerName || input.customer?.name || 'Customer',
    customer_email: input.customer_email || input.customerEmail || input.customer?.email || '',
    subject: input.subject || input.title || input.issue_category || input.category || 'Support request',
    description: input.description || input.ticket_description || input.message || '',
    status: input.status || 'Open',
    ticket_created_date: input.ticket_created_date || input.created_at || input.createdAt || now,
  };

  const aiSummary = await runBedrockIntake(ticket);
  const quickCategory = inferCategory(ticket);
  const quickPriority = inferPriority(ticket);
  const quickSentiment = inferSentiment(ticket);
  const enriched = {
    ...ticket,
    issue_category: ticket.issue_category || quickCategory,
    ai_sentiment: ticket.ai_sentiment || quickSentiment,
    priority: ticket.priority || quickPriority,
    ai_summary: ticket.ai_summary || aiSummary,
    sla_due_at: ticket.sla_due_at || ticket.slaDueAt || calculateSlaDueAt({
      createdAt: ticket.ticket_created_date,
      priority: ticket.priority || quickPriority,
    }),
  };

  const intake = {
      accepted: Boolean(enriched.description || enriched.subject),
      missingFields: ['customer_email', 'description'].filter((field) => !enriched[field]),
      normalizedAt: now.toISOString(),
  };

  return agentResponse({
    status: intake.accepted ? 'completed' : 'needs_input',
    confidence: intake.missingFields.length ? 0.64 : 0.9,
    input,
    output: {
      ticket: enriched,
      intake,
      aiSummary: aiSummary || 'Rule-based intake summary used.',
    },
    recommendation: intake.missingFields.length
      ? `Request missing fields: ${intake.missingFields.join(', ')}.`
      : 'Proceed to categorization.',
    nextAction: 'categorization_agent',
  });
};

const normalizeTicketFromIntake = (result) => {
  if (result?.output?.ticket) return result.output.ticket;
  return result?.ticket || result || {};
};

module.exports = {
  agentResponse,
  normalizeTicketFromIntake,
  normalizeTicketInput,
};
