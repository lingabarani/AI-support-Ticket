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

const isDbConnected = () => mongoose.connection.readyState === 1;

const loadLiveTickets = async (limit = 100) => {
  if (!isDbConnected()) return [];
  return Ticket.find({})
    .sort({ ticket_created_date: -1, createdAt: -1 })
    .limit(limit)
    .maxTimeMS(8000)
    .lean();
};

const sourceMeta = (tickets) => ({
  source: isDbConnected() ? 'mongodb' : 'database_unavailable',
  empty: tickets.length === 0,
});

router.get('/command-center', async (req, res) => {
  const tickets = await loadLiveTickets(Number(req.query.limit) || 100);
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
