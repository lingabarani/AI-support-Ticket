const router = require('express').Router();
const Ticket = require('../models/Ticket');
const { getDemoTickets, getPrimaryTickets } = require('../services/datasetService');
const { validateAndNormalizeTicketRow } = require('../utils/validateTicketRow');

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

router.post('/', async (req, res) => {
  const uploadId = req.body.uploadId || 'manual-create';
  const normalized = validateAndNormalizeTicketRow(req.body, 0, uploadId);
  if (!normalized.valid) {
    return res.status(400).json({ success: false, message: 'Ticket validation failed.', errors: normalized.errors });
  }

  const ticket = await Ticket.findOneAndUpdate(
    { ticket_id: normalized.ticket.ticket_id },
    { $set: normalized.ticket },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  res.status(201).json({ success: true, ticket, source: 'mongodb' });
});

router.get('/:id', async (req, res) => {
  const id = normalizeTicketId(req.params.id);
  const ticket = await Ticket.findOne({ $or: [{ ticket_id: id }, { ticketId: id }] }).lean();
  if (ticket) return res.json({ success: true, ticket, source: 'mongodb' });

  const fallback = fallbackTickets().find((item) => item.ticket_id === id) || fallbackTickets()[0];
  return res.json({ success: true, ticket: fallback, source: 'support_fallback' });
});

const updateTicket = async (req, res) => {
  const id = normalizeTicketId(req.params.id);
  const ticket = await Ticket.findOneAndUpdate(
    { $or: [{ ticket_id: id }, { ticketId: id }] },
    { $set: { ...req.body, ticket_updated_date: new Date() } },
    { new: true },
  ).lean();
  if (ticket) return res.json({ success: true, ticket, source: 'mongodb' });

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
