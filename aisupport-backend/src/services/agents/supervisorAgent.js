const { buildAutomationPlan, recordAutomationPlan, runAutomationAgent } = require('./automationAgent');
const { categorizeTicket } = require('./categorizationAgent');
const { normalizeTicketFromIntake, normalizeTicketInput } = require('./intakeAgent');
const { resolveTicket } = require('./resolutionAgent');
const { invokeBedrock, BEDROCK_FALLBACK_MESSAGE } = require('../bedrockService');

const agentResponse = ({ status = 'completed', confidence = 0.82, input, output, recommendation, nextAction }) => ({
  agentName: 'Supervisor Agent',
  status,
  confidence,
  input,
  output,
  recommendation,
  nextAction,
});

const runBedrockSupervisorReview = async ({ ticket = {}, decision = {}, requiresReview = false } = {}) => {
  if (!requiresReview) return '';
  const response = await invokeBedrock([
    'You are the Supervisor Agent for an MSP helpdesk SaaS platform.',
    'Review the decision and provide one concise escalation recommendation.',
    'Never expose AWS errors or model internals.',
    `Context: ${JSON.stringify({
      ticketId: ticket.ticket_id || ticket.ticketId,
      subject: ticket.subject,
      category: ticket.issue_category || ticket.category,
      priority: ticket.priority,
      decision,
    })}`,
  ].join('\n'));
  return response?.fallback || response === BEDROCK_FALLBACK_MESSAGE ? '' : response;
};

const runSupervisorWorkflow = async ({ ticket: inputTicket = {}, relatedTickets = [], audit = false } = {}) => {
  const intake = await normalizeTicketInput(inputTicket);
  const ticket = normalizeTicketFromIntake(intake);
  const categorization = await categorizeTicket(ticket);
  const categorizedTicket = categorization.output.ticket;
  const resolution = await resolveTicket(categorizedTicket, relatedTickets);
  const automationAgent = await runAutomationAgent({ ticket: categorizedTicket, resolution, audit: false });
  const automation = automationAgent.output.plan || buildAutomationPlan(categorizedTicket, resolution);
  const decision = resolution.output.decision;
  const requiresReview = ['escalate', 'supervisor_review', 'human_review', 'security_escalation', 'manager_escalation'].includes(decision.decision);
  const supervisorRecommendation = await runBedrockSupervisorReview({ ticket: categorizedTicket, decision, requiresReview });
  const auditEvent = audit
    ? await recordAutomationPlan({ ticket: categorizedTicket, plan: automation, actor: 'supervisor_agent' })
    : null;

  const output = {
    ticket: categorizedTicket,
    workflow: [intake, categorization, resolution, automationAgent],
    intake: intake.output.intake,
    categorization,
    resolution,
    automation,
    auditEvent,
    summary: {
      decision: decision.decision,
      owner: decision.owner,
      riskScore: decision.riskScore,
      slaStatus: decision.sla.status,
      nextActions: decision.nextActions,
    },
  };

  const supervisor = agentResponse({
    status: requiresReview ? 'review_required' : 'approved',
    confidence: Math.min(intake.confidence, categorization.confidence, resolution.confidence),
    input: inputTicket,
    output,
    recommendation: supervisorRecommendation || (requiresReview ? 'Supervisor review required before automation.' : 'Workflow approved under current policy.'),
    nextAction: requiresReview ? 'supervisor_review_queue' : 'audit_log_service',
  });

  return { ...output, supervisor, workflow: [...output.workflow, supervisor] };
};

module.exports = {
  agentResponse,
  runSupervisorWorkflow,
};
