const router = require('express').Router();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const AIDecision = require('../models/AIDecision');
const AgentWorkflow = require('../models/AgentWorkflow');
const SlaEvent = require('../models/SlaEvent');
const SupervisorReview = require('../models/SupervisorReview');
const { evaluateDecision, rankTicketsForAction } = require('../services/decisionEngine');
const { summarizeSlaQueue } = require('../services/slaEngine');
const { buildBIAnswer } = require('../services/conversationalBIService');
const { analyzeRootCause } = require('../services/rootCauseAnalyzer');
const { buildAutomationInsights } = require('../services/smartAutomationService');
const { readAuditEvents, writeAuditEvent } = require('../services/auditLogService');
const { runSupervisorWorkflow } = require('../services/agents/supervisorAgent');
const { runMultiAgentWorkflow } = require('../services/multiAgentOrchestrator');
const {
  getDynamoTables,
  isDynamoDbProvider,
  scanTable,
} = require('../services/dynamoDbService');

const isDbConnected = () => mongoose.connection.readyState === 1;

const loadLiveTickets = async (limit = 100) => {
  if (isDynamoDbProvider()) {
    try {
      return (await scanTable(getDynamoTables().tickets))
        .sort((a, b) => new Date(b.ticket_created_date || b.created_at || 0) - new Date(a.ticket_created_date || a.created_at || 0))
        .slice(0, limit);
    } catch {
      console.error('DynamoDB command center ticket load failed; falling back to MongoDB.');
    }
  }

  if (!isDbConnected()) return [];
  return Ticket.find({})
    .sort({ ticket_created_date: -1, createdAt: -1 })
    .limit(limit)
    .maxTimeMS(8000)
    .lean();
};

const sourceMeta = (tickets) => ({
  source: isDynamoDbProvider() ? 'dynamodb' : isDbConnected() ? 'mongodb' : 'database_unavailable',
  empty: tickets.length === 0,
});

router.get('/command-center', async (req, res) => {
  const tickets = await loadLiveTickets(Number(req.query.limit) || 100);
  const dynamoAiResults = isDynamoDbProvider()
    ? await scanTable(getDynamoTables().aiResults).catch(() => [])
    : [];
  const latestWorkflows = isDynamoDbProvider()
    ? dynamoAiResults
      .filter((item) => item.result_type === 'multi_agent_workflow')
      .sort((a, b) => new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0))
      .slice(0, 10)
    : isDbConnected()
      ? await AgentWorkflow.find({}).sort({ createdAt: -1 }).limit(10).lean()
      : [];
  const latestAiDecisions = isDynamoDbProvider()
    ? dynamoAiResults
      .filter((item) => item.finalDecision || item.analysis)
      .sort((a, b) => new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0))
      .slice(0, 30)
    : isDbConnected()
      ? await AIDecision.find({}).sort({ createdAt: -1 }).limit(30).lean()
      : [];
  const ranked = rankTicketsForAction(tickets);
  const decisions = ranked.slice(0, 30).map(({ ticket, decision }) => ({
    ticketId: ticket.ticket_id || ticket.ticketId,
    title: ticket.subject || ticket.issue_category || ticket.ticket_description || 'Support request',
    status: ticket.status,
    priority: ticket.priority,
    decision: decision.policy || evaluateDecision(ticket),
    riskScore: decision.riskScore,
    sla: decision.sla,
    owner: decision.owner,
    nextActions: decision.nextActions,
    confidence: decision.policy?.confidence || 0.78,
    recommendation: decision.policy?.reason || decision.nextActions?.[0],
    nextAction: decision.nextActions?.[0] || decision.policy?.action,
    supervisorEscalationStatus: decision.policy?.escalationRequired ? 'required' : 'not_required',
  }));
  const autoResolved = decisions.filter((item) => item.decision.autoResolved).length;
  const escalated = decisions.filter((item) => item.decision.escalationRequired).length;
  const supervisorQueue = decisions.filter((item) => /review|escalation/.test(item.decision.decision)).length;
  const automationRate = decisions.length ? Math.round((autoResolved / decisions.length) * 100) : 0;

  res.json({
    success: true,
    ...sourceMeta(tickets),
    metrics: {
      totalTickets: tickets.length,
      autoResolved,
      escalated,
      supervisorQueue,
      automationRate,
      averageConfidence: decisions.length
        ? Number((decisions.reduce((sum, item) => sum + Number(item.decision.confidence || 0), 0) / decisions.length).toFixed(2))
        : 0,
    },
    slaSummary: summarizeSlaQueue(tickets),
    decisions,
    aiDecisions: latestAiDecisions.map((decision) => ({
      ticketId: decision.ticket_id,
      decision: decision.finalDecision?.decision || decision.decision,
      confidence: decision.finalDecision?.confidence || decision.confidence || decision.analysis?.confidenceScore,
      recommendation: decision.finalDecision?.reason || decision.reason || decision.analysis?.recommendedAction,
      nextAction: decision.finalDecision?.action || decision.action || decision.analysis?.recommendedAction,
      assignedTeam: decision.finalDecision?.assignedTeam || decision.assignedTeam || decision.analysis?.escalationTeam,
      autoResolved: decision.finalDecision?.autoResolved ?? decision.autoResolved,
      escalationRequired: decision.finalDecision?.escalationRequired ?? decision.escalationRequired ?? decision.analysis?.escalationNeeded,
      supervisorEscalationStatus: (decision.finalDecision?.escalationRequired ?? decision.escalationRequired ?? decision.analysis?.escalationNeeded) ? 'required' : 'not_required',
      riskScore: decision.finalDecision?.riskScore || decision.riskScore,
    })),
    workflows: latestWorkflows.map((workflow) => ({
      ticketId: workflow.ticket_id,
      status: workflow.status,
      summary: workflow.summary,
      steps: workflow.steps,
      createdAt: workflow.createdAt || workflow.created_at || workflow.timestamp,
    })),
  });
});

router.post('/workflows/run', async (req, res) => {
  const workflow = await runMultiAgentWorkflow({
    ticket: req.body.ticket || req.body,
    relatedTickets: req.body.relatedTickets || [],
    actor: req.headers['x-user-email'] || req.body.actor || 'system',
  });

  res.status(201).json({ success: true, workflow });
});

router.get('/workflows/:ticketId', async (req, res) => {
  if (isDynamoDbProvider()) {
    const ticketId = req.params.ticketId;
    const aiResults = await scanTable(getDynamoTables().aiResults).catch(() => []);
    const workflow = aiResults
      .filter((item) => item.ticket_id === ticketId && item.result_type === 'multi_agent_workflow')
      .sort((a, b) => new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0))[0] || null;
    const decision = workflow?.finalDecision || null;
    return res.json({
      success: true,
      source: 'dynamodb',
      workflow,
      decision,
      auditLogs: [],
    });
  }

  if (!isDbConnected()) {
    return res.json({
      success: true,
      source: 'database_unavailable',
      workflow: null,
      decision: null,
      auditLogs: [],
    });
  }

  const ticketId = req.params.ticketId;
  const [workflow, decision, auditLogs] = await Promise.all([
    AgentWorkflow.findOne({ ticket_id: ticketId }).sort({ createdAt: -1 }).lean(),
    AIDecision.findOne({ ticket_id: ticketId }).sort({ createdAt: -1 }).lean(),
    readAuditEvents({ entityId: ticketId, limit: 25 }),
  ]);

  res.json({
    success: true,
    source: 'mongodb',
    workflow,
    decision,
    auditLogs,
  });
});

router.post('/workflows/supervise', async (req, res) => {
  const workflow = await runSupervisorWorkflow({
    ticket: req.body.ticket || req.body,
    relatedTickets: req.body.relatedTickets || [],
    audit: true,
  });

  if (isDbConnected() && workflow.ticket?.ticket_id) {
    await Promise.allSettled([
      AgentWorkflow.create({
        ticket_id: workflow.ticket.ticket_id,
        status: workflow.supervisor.status,
        steps: workflow.workflow,
        summary: workflow.summary,
        startedBy: req.headers['x-user-email'] || 'system',
      }),
      AIDecision.create({
        ticket_id: workflow.ticket.ticket_id,
        ...(workflow.resolution.output.decision.policy || {}),
        riskScore: workflow.summary.riskScore,
        policyRule: workflow.resolution.output.decision.policy?.decision,
      }),
      SlaEvent.create({
        ticket_id: workflow.ticket.ticket_id,
        ...workflow.resolution.output.decision.sla,
        assignedTeam: workflow.summary.owner,
      }),
      workflow.supervisor.status === 'review_required'
        ? SupervisorReview.create({
          ticket_id: workflow.ticket.ticket_id,
          status: 'pending',
          reason: workflow.supervisor.recommendation,
          decision: workflow.summary.decision,
          confidence: workflow.supervisor.confidence,
        })
        : Promise.resolve(),
    ]);
  }

  res.json({ success: true, workflow });
});

router.post('/conversational-bi/query', async (req, res) => {
  const role = req.body.role || req.headers['x-user-role'] || 'team_manager';
  const message = req.body.message || req.body.question || '';
  const answer = await buildBIAnswer({ role, message });
  res.json({ success: true, answer });
});

router.get('/root-cause', async (req, res) => {
  const tickets = await loadLiveTickets(200);
  const ticket = req.query.ticketId
    ? tickets.find((item) => [item.ticket_id, item.ticketId].includes(req.query.ticketId))
    : tickets[0];
  if (!ticket) return res.json({ success: true, ...sourceMeta(tickets), analysis: null });
  const analysis = analyzeRootCause(ticket, tickets.filter((item) => item.ticket_id !== ticket.ticket_id));
  res.json({ success: true, ...sourceMeta(tickets), analysis });
});

router.get('/automation/insights/:ticketId', async (req, res) => {
  const tickets = await loadLiveTickets(300);
  const ticket = tickets.find((item) => [item.ticket_id, item.ticketId].includes(req.params.ticketId));
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found in live database.' });
  res.json({
    success: true,
    source: 'mongodb',
    insights: buildAutomationInsights({ ticket, tickets }),
  });
});

router.post('/automation/insights', async (req, res) => {
  const tickets = await loadLiveTickets(300);
  res.json({
    success: true,
    source: tickets.length ? 'mongodb' : 'request_payload',
    insights: buildAutomationInsights({ ticket: req.body.ticket || req.body, tickets }),
  });
});

router.get('/governance/audit-logs', async (req, res) => {
  const events = await readAuditEvents({ limit: Number(req.query.limit) || 100, entityId: req.query.entityId });
  res.json({ success: true, source: isDbConnected() ? 'mongodb_or_jsonl' : 'jsonl', events });
});

router.post('/governance/audit-logs', async (req, res) => {
  const event = await writeAuditEvent({
    actor: req.headers['x-user-email'] || req.body.actor || 'system',
    action: req.body.action,
    entityType: req.body.entityType,
    entityId: req.body.entityId,
    outcome: req.body.outcome,
    metadata: req.body.metadata,
  });
  res.status(201).json({ success: true, event });
});

router.get('/governance/summary', async (req, res) => {
  const [events, reviews, decisions] = await Promise.all([
    readAuditEvents({ limit: 100 }),
    isDbConnected() ? SupervisorReview.find({ status: 'pending' }).limit(100).lean() : [],
    isDbConnected() ? AIDecision.find({}).sort({ createdAt: -1 }).limit(100).lean() : [],
  ]);

  res.json({
    success: true,
    source: isDbConnected() ? 'mongodb_or_jsonl' : 'jsonl',
    metrics: {
      auditEvents: events.length,
      pendingReviews: reviews.length,
      autoApprovals: decisions.filter((item) => item.autoResolved).length,
      rejectedAutomations: events.filter((item) => item.outcome === 'review_required' || item.outcome === 'rejected').length,
      supervisorOverrides: events.filter((item) => /override/i.test(item.action || '')).length,
    },
    events,
    reviews,
    decisions,
  });
});

module.exports = router;
