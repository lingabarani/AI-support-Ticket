const Ticket = require('../models/Ticket.model');

const elevatedRoles = ['Team Manager', 'Business Executive', 'System Admin'];

const buildTicketFilter = (user, query = {}) => {
  const { status, priority } = query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (user.role === 'Support Agent') filter.agent = user._id;
  if (user.role === 'Customer Portal User') filter.customer = user._id;
  return filter;
};

const canAccessTicket = (ticket, user) => {
  if (elevatedRoles.includes(user.role)) return true;
  if (user.role === 'Support Agent') return String(ticket.agent || '') === String(user._id);
  if (user.role === 'Customer Portal User') return String(ticket.customer || '') === String(user._id);
  return false;
};

exports.getAllTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const filter = buildTicketFilter(req.user, req.query);

    const tickets = await Ticket.find(filter)
      .populate('customer', 'name email')
      .populate('agent', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const total = await Ticket.countDocuments(filter);
    res.json({ success: true, tickets, total, page: pageNumber, pages: Math.ceil(total / limitNumber) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('agent', 'name email')
      .populate('internalNotes.addedBy', 'name');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    if (!canAccessTicket(ticket, req.user)) return res.status(403).json({ success: false, message: 'Not authorized for this ticket.' });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    const ticket = await Ticket.create({ subject, description, category, priority, customer: req.user._id });
    res.status(201).json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const existing = await Ticket.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    if (!canAccessTicket(existing, req.user)) return res.status(403).json({ success: false, message: 'Not authorized for this ticket.' });

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addNote = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    if (!canAccessTicket(ticket, req.user) || req.user.role === 'Customer Portal User') {
      return res.status(403).json({ success: false, message: 'Not authorized to add internal notes.' });
    }
    ticket.internalNotes.push({ text: req.body.text, addedBy: req.user._id });
    await ticket.save();
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { agent: req.body.agentId, status: 'In Progress' }, { new: true });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTicketStats = async (req, res) => {
  try {
    const baseFilter = buildTicketFilter(req.user);
    const [open, inProgress, resolved, total] = await Promise.all([
      Ticket.countDocuments({ ...baseFilter, status: 'Open' }),
      Ticket.countDocuments({ ...baseFilter, status: 'In Progress' }),
      Ticket.countDocuments({ ...baseFilter, status: 'Resolved' }),
      Ticket.countDocuments(baseFilter),
    ]);
    res.json({ success: true, stats: { open, inProgress, resolved, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
