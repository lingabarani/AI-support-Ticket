const { categorizeTicket } = require('./categorizationAgent');
const { calculateSlaDueAt } = require('../slaEngine');

const agentResponse = ({ status = 'completed', confidence = 0.86, input, output, recommendation, nextAction }) => ({
  agentName: 'Intake Agent',
  status,
  confidence,
  input,
  output,
  recommendation,
  nextAction,
});

const normalizeTicketInput = (input = {}) => {
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

  const categorized = categorizeTicket(ticket);
  const categorizedOutput = categorized.output || {};
  const enriched = {
    ...(categorizedOutput.ticket || ticket),
    sla_due_at: ticket.sla_due_at || ticket.slaDueAt || calculateSlaDueAt({
      createdAt: ticket.ticket_created_date,
      priority: categorizedOutput.priority || ticket.priority,
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
      categorization: categorized.output || categorized,
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
