const { writeAuditEvent } = require('../auditLogService');
const { decideNextAction } = require('../decisionEngine');

const agentResponse = ({ status = 'completed', confidence = 0.8, input, output, recommendation, nextAction }) => ({
  agentName: 'Automation Agent',
  status,
  confidence,
  input,
  output,
  recommendation,
  nextAction,
});

const buildAutomationPlan = (ticket = {}, resolution = {}) => {
  const resolutionOutput = resolution.output || resolution;
  const decision = resolutionOutput.decision || decideNextAction(ticket);
  const ticketId = ticket.ticket_id || ticket.ticketId || '';

  if (decision.decision === 'auto_resolve') {
    return {
      executable: true,
      ticketId,
      actions: [
        { type: 'update_status', value: 'Resolved' },
        { type: 'add_internal_note', value: resolutionOutput.resolutionNote || resolutionOutput.suggestedResolution },
        { type: 'notify_customer', value: resolutionOutput.suggestedResolution },
      ],
    };
  }

  if (decision.decision === 'escalate') {
    return {
      executable: true,
      ticketId,
      actions: [
        { type: 'update_status', value: 'In Progress' },
        { type: 'assign_owner', value: 'team_manager' },
        { type: 'add_internal_note', value: 'Escalated by supervisor due to risk or SLA state.' },
      ],
    };
  }

  return {
    executable: false,
    ticketId,
    actions: [
      { type: 'agent_review', value: 'Human review required before automation.' },
    ],
  };
};

const recordAutomationPlan = async ({ ticket = {}, plan, actor = 'automation_agent' } = {}) => writeAuditEvent({
  actor,
  action: 'automation_plan_created',
  entityType: 'ticket',
  entityId: ticket.ticket_id || ticket.ticketId || plan?.ticketId || '',
  outcome: plan?.executable ? 'ready' : 'review_required',
  metadata: { actions: plan?.actions || [] },
});

const runAutomationAgent = async ({ ticket = {}, resolution = {}, audit = false } = {}) => {
  const plan = buildAutomationPlan(ticket, resolution);
  const auditEvent = audit ? await recordAutomationPlan({ ticket, plan }) : null;
  return agentResponse({
    status: plan.executable ? 'ready' : 'blocked',
    confidence: plan.executable ? 0.84 : 0.62,
    input: { ticket, resolution: resolution.output || resolution },
    output: { plan, auditEvent },
    recommendation: plan.executable ? 'Execute approved automation plan.' : 'Hold automation for human review.',
    nextAction: plan.executable ? 'audit_log_service' : 'supervisor_agent',
  });
};

module.exports = {
  agentResponse,
  buildAutomationPlan,
  recordAutomationPlan,
  runAutomationAgent,
};
