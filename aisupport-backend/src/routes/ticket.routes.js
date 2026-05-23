const router = require('express').Router();
const Ticket = require('../models/Ticket');
const TicketHistory = require('../models/TicketHistory');
const TicketAnalysis = require('../models/TicketAnalysis');
const { getDemoTickets, getPrimaryTickets } = require('../services/datasetService');
const { validateAndNormalizeTicketRow } = require('../utils/validateTicketRow');
const { optionalTicketAttachment } = require('../middleware/uploadMiddleware');
const { buildResolutionNote, evaluateAutoResolution } = require('../services/autoResolutionService');

let fallbackStore;

const fallbackTickets = () => {
  if (!fallbackStore) fallbackStore = getDemoTickets().map((ticket) => ({ ...ticket, internal_notes: [] }));
  return fallbackStore;
};

const normalizeTicketId = (value) => {
  const text = String(value || '');
  const uploadMatch = text.match(/TKT-UPLOAD-\d+/i);
  if (uploadMatch) return uploadMatch[0].toUpperCase();
  const match = text.match(/(\d{1,4})$/);
  return match ? `TKT-${String(Number(match[1])).padStart(4, '0')}` : text.toUpperCase();
};

const makeTicketId = () => `TKT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
const makeCustomerTicketId = () => `TKT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;

const normalizePriority = (priority) => {
  if (priority === 'Critical') return 'Urgent';
  return ['Urgent', 'High', 'Medium', 'Low'].includes(priority) ? priority : 'Medium';
};

const buildAnalysis = (ticket) => {
  const text = `${ticket.subject || ''} ${ticket.description || ticket.ticket_description || ''}`.toLowerCase();
  const negative = /angry|frustrated|fail|failed|urgent|critical|refund|payment|down|blocked/.test(text);
  const sentiment = negative ? 'Negative' : 'Neutral';
  return {
    sentiment,
    priority: ticket.priority,
    summary: `${ticket.category || ticket.issue_category || 'Support'} request: ${ticket.subject || ticket.ticket_description || 'Customer needs assistance'}`.slice(0, 220),
    root_cause: ticket.category || ticket.issue_category || 'Customer reported product issue',
    suggested_resolution: 'Review the customer details, acknowledge the request, and provide a clear next-step update within SLA.',
    confidence: 0.82,
    source: 'local_intelligence',
  };
};

const normalizeCustomerTicket = (body) => {
  const now = new Date();
  const priority = normalizePriority(body.priority);
  const slaHours = priority === 'Urgent' ? 8 : priority === 'High' ? 24 : priority === 'Low' ? 72 : 48;
  const ticket_id = body.ticket_id || makeTicketId();
  const tags = Array.isArray(body.tags)
    ? body.tags
    : String(body.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
  return {
    ticket_id,
    ticketId: ticket_id,
    customer_name: body.customer_name || body.name || String(body.customer_email || body.email || 'Customer').split('@')[0],
    customer_email: body.customer_email || body.email,
    account_company: body.account_company || body.company || '',
    category: body.category || body.issue_category || 'General Support',
    issue_category: body.issue_category || body.category || 'General Support',
    affected_product: body.affected_product || body.product || 'Web Portal',
    product: body.product || body.affected_product || 'Web Portal',
    subject: body.subject || String(body.ticket_description || body.description || 'Support request').slice(0, 120),
    description: body.description || body.ticket_description || '',
    ticket_description: body.ticket_description || body.description || body.subject || '',
    tags,
    priority,
    status: body.status || 'Open',
    assigned_agent: body.assigned_agent || 'Unassigned',
    assigned_team: body.assigned_team || 'Customer Support',
    sla_due_at: body.sla_due_at || new Date(now.getTime() + slaHours * 60 * 60 * 1000),
    sla_breached: false,
    resolution_summary: body.resolution_summary || '',
    created_at: body.created_at || now,
    updated_at: now,
    ticket_created_date: body.ticket_created_date || now,
    ticket_updated_date: now,
    source: body.source || 'customer_portal',
    attachments: body.attachments || [],
    channel: body.channel || 'Web',
    region: body.region || 'India',
  };
};

const attachmentFromFile = (file) => file ? [{
  filename: file.filename,
  originalName: file.originalname,
  mimeType: file.mimetype,
  size: file.size,
  storagePath: file.path,
  url: `/uploads/${file.filename}`,
  uploadedAt: new Date(),
}] : [];

const filterTickets = (items, query) => {
  const search = String(query.search || query.q || '').toLowerCase();
  return items.filter((ticket) => {
    const matchesSearch = !search || [
      ticket.ticket_id,
      ticket.ticketId,
      ticket.customer_name,
      ticket.customer_email,
      ticket.issue_category,
      ticket.ticket_description,
      ticket.priority,
      ticket.status,
      ticket.assigned_agent,
      ticket.assigned_team,
      ticket.tags?.join(' '),
    ].filter(Boolean).join(' ').toLowerCase().includes(search);

    return matchesSearch
      && (!query.status || ticket.status === query.status)
      && (!query.priority || ticket.priority === query.priority)
      && (!query.category || ticket.issue_category === query.category);
  });
};

const sourceOf = async () => ((await Ticket.estimatedDocumentCount().maxTimeMS(4000)) > 0 ? 'mongodb' : 'support_fallback');

router.get('/stats', async (req, res) => {
  const rows = await getPrimaryTickets();
  res.json({
    success: true,
    stats: {
      open: rows.filter((ticket) => ticket.status === 'Open').length,
      inProgress: rows.filter((ticket) => ticket.status === 'In Progress').length,
      resolved: rows.filter((ticket) => ['Resolved', 'Closed'].includes(ticket.status)).length,
      total: rows.length,
    },
    source: await sourceOf(),
  });
});

router.get('/', async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 300);
  const mongoCount = await Ticket.estimatedDocumentCount().maxTimeMS(4000);
  if (mongoCount > 0) {
    const search = String(req.query.search || req.query.q || '').trim();
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.category) filter.issue_category = req.query.category;
    if (search) {
      filter.$or = [
        { ticket_id: new RegExp(search, 'i') },
        { customer_name: new RegExp(search, 'i') },
        { customer_email: new RegExp(search, 'i') },
        { issue_category: new RegExp(search, 'i') },
        { ticket_description: new RegExp(search, 'i') },
      ];
    }
    const [rows, total] = await Promise.all([
      Ticket.find(filter).sort({ ticket_created_date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).maxTimeMS(8000).lean(),
      Ticket.countDocuments(filter).maxTimeMS(8000),
    ]);
    return res.json({
      success: true,
      tickets: rows,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      source: 'mongodb',
    });
  }

  const filtered = filterTickets(await getPrimaryTickets(), req.query);
  const start = (page - 1) * limit;
  res.json({
    success: true,
    tickets: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    pages: Math.max(1, Math.ceil(filtered.length / limit)),
    source: await sourceOf(),
  });
});

router.post('/', optionalTicketAttachment, async (req, res) => {
  try {
    const ticketPayload = normalizeCustomerTicket({
      ...req.body,
      ticket_id: req.body.ticket_id || makeCustomerTicketId(),
      attachments: attachmentFromFile(req.file),
    });
    if (!ticketPayload.customer_email) {
      return res.status(400).json({ success: false, message: 'Customer email is required.' });
    }

    const analysis = buildAnalysis(ticketPayload);
    Object.assign(ticketPayload, {
      ai_summary: analysis.summary,
      ai_sentiment: analysis.sentiment,
      ai_root_cause: analysis.root_cause,
      ai_suggested_resolution: analysis.suggested_resolution,
      sentiment: analysis.sentiment,
    });

    const ticket = await Ticket.create(ticketPayload);
    await Promise.all([
      TicketHistory.create({
        ticket_id: ticket.ticket_id,
        action: 'created',
        new_status: ticket.status,
        updated_by: ticket.customer_email,
        notes: 'Ticket created from customer portal.',
      }),
      TicketAnalysis.create({ ticket_id: ticket.ticket_id, ...analysis }),
    ]);

    res.status(201).json({
      success: true,
      ticket_id: ticket.ticket_id,
      message: 'Ticket submitted successfully',
      warning: req.attachmentWarning,
      ticket: ticket.toObject(),
      analysis,
      source: 'mongodb',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Ticket creation failed.' });
  }
});

router.get('/customer/:email', async (req, res) => {
  const email = String(req.params.email || '').toLowerCase();
  const rows = await Ticket.find({ customer_email: email }).sort({ created_at: -1, createdAt: -1 }).limit(100).lean();
  if (rows.length) return res.json({ success: true, tickets: rows, source: 'mongodb' });
  const fallback = fallbackTickets().filter((item) => String(item.customer_email || '').toLowerCase() === email);
  return res.json({ success: true, tickets: fallback, source: 'support_fallback' });
});

router.get('/:id', async (req, res) => {
  const id = normalizeTicketId(req.params.id);
  const ticket = await Ticket.findOne({ $or: [{ ticket_id: id }, { ticketId: id }] }).lean();
  if (ticket) return res.json({ success: true, ticket, source: 'mongodb' });

  const fallback = fallbackTickets().find((item) => item.ticket_id === id) || fallbackTickets()[0];
  return res.json({ success: true, ticket: fallback, source: 'support_fallback' });
});

const findTicketById = async (id) => {
  const normalizedId = normalizeTicketId(id);
  const ticket = await Ticket.findOne({ $or: [{ ticket_id: normalizedId }, { ticketId: normalizedId }] }).lean();
  if (ticket) return { ticket, source: 'mongodb', normalizedId };
  const fallback = fallbackTickets().find((item) => item.ticket_id === normalizedId || item.id === normalizedId);
  return { ticket: fallback || null, source: 'support_fallback', normalizedId };
};

router.get('/:id/auto-resolution', async (req, res) => {
  const { ticket, source } = await findTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
  res.json({
    success: true,
    source,
    ticket_id: ticket.ticket_id || ticket.ticketId || ticket.id,
    evaluation: evaluateAutoResolution(ticket),
  });
});

router.post('/:id/auto-resolve', async (req, res) => {
  const { ticket, source, normalizedId } = await findTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

  const evaluation = evaluateAutoResolution(ticket);
  const updatedBy = req.headers['x-user-email'] || req.body.updated_by || 'ai_resolution_policy';
  const note = buildResolutionNote(ticket, evaluation);

  if (!evaluation.canAutoResolve) {
    if (source === 'mongodb') {
      await TicketHistory.create({
        ticket_id: ticket.ticket_id || ticket.ticketId,
        action: evaluation.decision,
        previous_status: ticket.status,
        new_status: evaluation.nextStatus,
        updated_by: updatedBy,
        notes: note,
      });
    }
    return res.status(202).json({
      success: true,
      source,
      autoResolved: false,
      ticket,
      evaluation,
      message: evaluation.recommendation,
    });
  }

  const resolutionUpdate = {
    status: 'Resolved',
    resolvedAt: new Date(),
    resolution_summary: ticket.ai_suggested_resolution || ticket.resolution_summary || 'Resolved automatically by AI policy for low-risk ticket.',
    updated_at: new Date(),
    ticket_updated_date: new Date(),
  };

  if (source === 'mongodb') {
    const updated = await Ticket.findOneAndUpdate(
      { $or: [{ ticket_id: normalizedId }, { ticketId: normalizedId }] },
      {
        $set: resolutionUpdate,
        $push: {
          internalNotes: {
            text: note,
            createdAt: new Date(),
          },
        },
      },
      { new: true },
    ).lean();
    await TicketHistory.create({
      ticket_id: updated.ticket_id || updated.ticketId,
      action: 'auto_resolved',
      previous_status: ticket.status,
      new_status: 'Resolved',
      updated_by: updatedBy,
      notes: note,
    });
    return res.json({ success: true, source, autoResolved: true, ticket: updated, evaluation, message: 'Low-risk ticket auto-resolved.' });
  }

  const index = fallbackTickets().findIndex((item) => item.ticket_id === normalizedId || item.id === normalizedId);
  const targetIndex = index >= 0 ? index : 0;
  fallbackStore[targetIndex] = {
    ...fallbackStore[targetIndex],
    ...resolutionUpdate,
    internal_notes: [...(fallbackStore[targetIndex].internal_notes || []), { text: note, addedBy: updatedBy, createdAt: new Date() }],
  };
  res.json({ success: true, source, autoResolved: true, ticket: fallbackStore[targetIndex], evaluation, message: 'Low-risk fallback ticket auto-resolved.' });
});

const updateTicket = async (req, res) => {
  const id = normalizeTicketId(req.params.id);
  const existing = await Ticket.findOne({ $or: [{ ticket_id: id }, { ticketId: id }] }).lean();
  const ticket = await Ticket.findOneAndUpdate(
    { $or: [{ ticket_id: id }, { ticketId: id }] },
    { $set: { ...req.body, updated_at: new Date(), ticket_updated_date: new Date() } },
    { new: true },
  ).lean();
  if (ticket) {
    if (req.body.status && req.body.status !== existing?.status) {
      await TicketHistory.create({
        ticket_id: ticket.ticket_id || ticket.ticketId,
        action: 'status_changed',
        previous_status: existing?.status,
        new_status: req.body.status,
        updated_by: req.headers['x-user-email'] || req.body.updated_by || 'organization_user',
        notes: req.body.notes || req.body.internal_note || '',
      });
    }
    return res.json({ success: true, ticket, source: 'mongodb' });
  }

  const index = fallbackTickets().findIndex((item) => item.ticket_id === id);
  const targetIndex = index >= 0 ? index : 0;
  fallbackStore[targetIndex] = {
    ...fallbackStore[targetIndex],
    ...req.body,
    ticket_updated_date: new Date().toISOString().slice(0, 10),
  };
  return res.json({ success: true, ticket: fallbackStore[targetIndex], source: 'support_fallback' });
};

router.patch('/:id', updateTicket);
router.put('/:id', updateTicket);

router.post('/:id/notes', async (req, res) => {
  const id = normalizeTicketId(req.params.id);
  const note = {
    text: req.body.text || req.body.note || 'Internal note',
    addedBy: req.body.addedBy || 'Support User',
    createdAt: new Date(),
  };
  const ticket = await Ticket.findOneAndUpdate(
    { $or: [{ ticket_id: id }, { ticketId: id }] },
    { $push: { internalNotes: note } },
    { new: true },
  ).lean();
  if (ticket) return res.json({ success: true, ticket, note, source: 'mongodb' });

  const index = fallbackTickets().findIndex((item) => item.ticket_id === id);
  const targetIndex = index >= 0 ? index : 0;
  fallbackStore[targetIndex].internal_notes = [...(fallbackStore[targetIndex].internal_notes || []), note];
  return res.json({ success: true, ticket: fallbackStore[targetIndex], note, source: 'support_fallback' });
});

router.put('/:id/assign', async (req, res) => {
  const id = normalizeTicketId(req.params.id);
  const ticket = await Ticket.findOneAndUpdate(
    { $or: [{ ticket_id: id }, { ticketId: id }] },
    { $set: { assigned_agent: req.body.agent || req.body.agentName, status: 'In Progress', ticket_updated_date: new Date() } },
    { new: true },
  ).lean();
  if (ticket) return res.json({ success: true, ticket, source: 'mongodb' });

  const index = fallbackTickets().findIndex((item) => item.ticket_id === id);
  const targetIndex = index >= 0 ? index : 0;
  fallbackStore[targetIndex] = {
    ...fallbackStore[targetIndex],
    assigned_agent: req.body.agent || req.body.agentName || fallbackStore[targetIndex].assigned_agent,
    status: 'In Progress',
    ticket_updated_date: new Date().toISOString().slice(0, 10),
  };
  return res.json({ success: true, ticket: fallbackStore[targetIndex], source: 'support_fallback' });
});

module.exports = router;
