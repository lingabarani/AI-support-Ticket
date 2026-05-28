const mongoose = require('mongoose');
const AgentWorkflow = require('../models/AgentWorkflow');
const AIDecision = require('../models/AIDecision');
const AuditLog = require('../models/AuditLog');
const ProductProofAnalysis = require('../models/ProductProofAnalysis');
const { normalizeTicketInput, normalizeTicketFromIntake } = require('./agents/intakeAgent');
const { categorizeTicket } = require('./agents/categorizationAgent');
const { resolveTicket } = require('./agents/resolutionAgent');
const { runSupervisorWorkflow } = require('./agents/supervisorAgent');
const { runAutomationAgent } = require('./agents/automationAgent');
const {
  getDynamoKeys,
  getDynamoTables,
  isDynamoDbProvider,
  putItem,
} = require('./dynamoDbService');

const isDbConnected = () => mongoose.connection.readyState === 1;

const getTicketId = (ticket = {}) => ticket.ticket_id || ticket.ticketId || ticket.id || `TKT-${Date.now()}`;

const normalizeDecision = ({ ticket = {}, resolution = {}, supervisor = {}, automation = {} } = {}) => {
  const decision = resolution.output?.decision || resolution.decision || {};
  const policy = decision.policy || {};
  const confidence = Math.min(
    Number(resolution.confidence || 0.78),
    Number(supervisor.confidence || 0.78),
    Number(automation.confidence || 0.78),
  );
  return {
    ticket_id: getTicketId(ticket),
    decision: decision.decision || policy.decision || 'agent_review',
    action: policy.action || decision.nextActions?.[0] || automation.recommendation || 'Send next-step response.',
    assignedTeam: decision.owner || policy.assignedTeam || ticket.assigned_team || 'Customer Support',
    autoResolved: Boolean(policy.autoResolved || decision.decision === 'auto_resolve'),
    escalationRequired: Boolean(policy.escalationRequired || /escalat|supervisor|manager|security/.test(String(decision.decision || ''))),
    reason: policy.reason || decision.reasons?.[0] || supervisor.recommendation,
    confidence,
    riskScore: decision.riskScore || 0,
    policyRule: policy.decision || decision.decision || 'agent_review',
    recommendation: resolution.recommendation || supervisor.recommendation,
    nextAction: supervisor.nextAction || automation.nextAction || 'support_agent',
    supervisorEscalationStatus: Boolean(policy.escalationRequired || supervisor.status === 'review_required') ? 'required' : 'not_required',
  };
};

const maybeCreateProductProofRecord = async (ticket = {}) => {
  const text = [
    ticket.subject,
    ticket.description,
    ticket.ticket_description,
    ticket.issue_category,
    ticket.category,
  ].filter(Boolean).join(' ').toLowerCase();
  const hasProofSignal = /damaged|damage|wrong item|wrong product|color mismatch|invoice screenshot|error screenshot|uploaded|image|photo|screenshot/.test(text)
    || ticket.uploadedImage
    || ticket.file
    || ticket.attachment;
  if (!hasProofSignal || !isDbConnected()) return null;

  return ProductProofAnalysis.create({
    uploadedImage: ticket.uploadedImage || ticket.fileUrl || ticket.attachment || '',
    productId: ticket.productId || ticket.product_id || '',
    orderId: ticket.orderId || ticket.order_id || getTicketId(ticket),
    damageDetected: /damaged|damage|broken|crack|dent/.test(text),
    mismatchDetected: /wrong item|wrong product|mismatch|color mismatch/.test(text),
    OCRResult: '',
    confidence: 0.35,
    recommendedAction: 'Product proof metadata stored. Bedrock image analysis placeholder is ready for future enablement.',
    provider: 'bedrock_image_placeholder',
    metadata: {
      ticketId: getTicketId(ticket),
      supportedProofTypes: ['product_image', 'damaged_product', 'wrong_item', 'color_mismatch', 'invoice_screenshot', 'error_screenshot'],
    },
  });
};

const persistWorkflow = async ({ ticketId, steps, summary, actor, finalDecision }) => {
  if (isDynamoDbProvider()) {
    try {
      const now = new Date().toISOString();
      const resultId = `workflow-${ticketId}-${Date.now()}`;
      const workflowRecord = await putItem(getDynamoTables().aiResults, {
        [getDynamoKeys().aiResults]: resultId,
        result_id: resultId,
        id: resultId,
        ticket_id: ticketId,
        ticketId,
        result_type: 'multi_agent_workflow',
        status: summary.supervisorEscalationStatus === 'required' ? 'review_required' : 'completed',
        actor,
        steps,
        summary,
        finalDecision,
        created_at: now,
        timestamp: now,
      });
      return { workflowRecord, decisionRecord: workflowRecord, auditRecord: workflowRecord, source: 'dynamodb' };
    } catch (error) {
      console.error('DynamoDB workflow persistence failed; falling back to MongoDB if connected.');
    }
  }

  if (!isDbConnected()) return { workflowRecord: null, decisionRecord: null, auditRecord: null };

  const [workflowRecord, decisionRecord, auditRecord] = await Promise.all([
    AgentWorkflow.create({
      ticket_id: ticketId,
      status: summary.supervisorEscalationStatus === 'required' ? 'review_required' : 'completed',
      steps,
      summary,
      startedBy: actor,
    }),
    AIDecision.create({
      ticket_id: ticketId,
      decision: finalDecision.decision,
      action: finalDecision.action,
      assignedTeam: finalDecision.assignedTeam,
      autoResolved: finalDecision.autoResolved,
      escalationRequired: finalDecision.escalationRequired,
      reason: finalDecision.reason,
      confidence: finalDecision.confidence,
      riskScore: finalDecision.riskScore,
      policyRule: finalDecision.policyRule,
    }),
    AuditLog.create({
      actor,
      action: 'multi_agent_workflow_completed',
      entityType: 'ticket',
      entityId: ticketId,
      outcome: finalDecision.decision,
      confidence: finalDecision.confidence,
      policyRule: finalDecision.policyRule,
      metadata: {
        assignedTeam: finalDecision.assignedTeam,
        autoResolved: finalDecision.autoResolved,
        escalationRequired: finalDecision.escalationRequired,
      },
    }),
  ]);

  return { workflowRecord, decisionRecord, auditRecord };
};

const runMultiAgentWorkflow = async ({ ticket: inputTicket = {}, relatedTickets = [], actor = 'system' } = {}) => {
  const intake = await normalizeTicketInput(inputTicket);
  const ticket = normalizeTicketFromIntake(intake);
  const categorization = await categorizeTicket(ticket);
  const categorizedTicket = categorization.output.ticket;
  const resolution = await resolveTicket(categorizedTicket, relatedTickets);
  const supervisorBundle = await runSupervisorWorkflow({ ticket: categorizedTicket, relatedTickets, audit: false });
  const supervisor = supervisorBundle.supervisor;
  const automation = await runAutomationAgent({ ticket: categorizedTicket, resolution, audit: false });
  const steps = [intake, categorization, resolution, supervisor, automation];
  const finalDecision = normalizeDecision({ ticket: categorizedTicket, resolution, supervisor, automation });
  const ticketId = getTicketId(categorizedTicket);
  const proofRecord = await maybeCreateProductProofRecord(categorizedTicket);
  const summary = {
    ticketId,
    decision: finalDecision.decision,
    assignedTeam: finalDecision.assignedTeam,
    autoResolved: finalDecision.autoResolved,
    escalationRequired: finalDecision.escalationRequired,
    confidence: finalDecision.confidence,
    recommendation: finalDecision.recommendation,
    nextAction: finalDecision.nextAction,
    supervisorEscalationStatus: finalDecision.supervisorEscalationStatus,
    proofAnalysisId: proofRecord?._id,
  };
  const persistence = await persistWorkflow({ ticketId, steps, summary, actor, finalDecision });

  return {
    ticket: categorizedTicket,
    steps,
    finalDecision,
    summary,
    persistence,
    proofAnalysis: proofRecord,
  };
};

module.exports = {
  runMultiAgentWorkflow,
};
