const { evaluateAutoResolution, buildResolutionNote } = require('../autoResolutionService');
const { decideNextAction } = require('../decisionEngine');
const { analyzeRootCause } = require('../rootCauseAnalyzer');

const agentResponse = ({ status = 'completed', confidence = 0.82, input, output, recommendation, nextAction }) => ({
  agentName: 'Resolution Agent',
  status,
  confidence,
  input,
  output,
  recommendation,
  nextAction,
});

const DEFAULT_RESOLUTIONS = {
  Authentication: 'Reset credentials, validate MFA status, and confirm successful login.',
  Payment: 'Verify invoice/payment status, retry the transaction if safe, and confirm account entitlement.',
  Performance: 'Collect logs and timestamps, check service health, and apply the known performance playbook.',
  Integration: 'Validate API credentials, payload contract, and recent sync errors.',
  Access: 'Review the user role, update permissions if approved, and ask the customer to retry.',
  'Data Quality': 'Refresh the dataset, validate transformation rules, and compare source records.',
  Notification: 'Confirm contact details, delivery provider status, and notification preferences.',
  General: 'Review the ticket evidence and send the customer a clear next-step update.',
};

const buildSuggestedResolution = (ticket = {}, rootCause = {}) => (
  ticket.ai_suggested_resolution
  || ticket.aiSuggestedReply
  || ticket.resolution_summary
  || DEFAULT_RESOLUTIONS[rootCause.category]
  || DEFAULT_RESOLUTIONS.General
);

const resolveTicket = (ticket = {}, relatedTickets = []) => {
  const rootCause = analyzeRootCause(ticket, relatedTickets);
  const decision = decideNextAction(ticket);
  const autoResolution = evaluateAutoResolution(ticket);
  const suggestedResolution = buildSuggestedResolution(ticket, rootCause);

  const output = {
    rootCause,
    decision,
    autoResolution,
    suggestedResolution,
    resolutionNote: buildResolutionNote(
      { ...ticket, ai_suggested_resolution: suggestedResolution },
      autoResolution,
    ),
  };

  return agentResponse({
    input: { ticket, relatedTickets: relatedTickets.length },
    output,
    confidence: Math.min(rootCause.confidence, decision.policy?.confidence || 0.82),
    recommendation: suggestedResolution,
    nextAction: decision.decision === 'auto_resolve' ? 'automation_agent' : 'supervisor_agent',
  });
};

module.exports = {
  agentResponse,
  buildSuggestedResolution,
  resolveTicket,
};
