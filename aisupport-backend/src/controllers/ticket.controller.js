const Ticket = require('../models/Ticket.model');
const {
  getDynamoKeys,
  getDynamoTables,
  getItem,
  isDynamoDbProvider,
  putItem,
  scanTable,
  updateItem: updateDynamoItem,
} = require('../services/dynamoDbService');

const getTicketId = (ticket = {}) => ticket.ticket_id || ticket.ticketId || ticket.id;
const makeTicketId = () => `TKT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
const getTicketKey = (ticketId) => ({ [getDynamoKeys().tickets]: ticketId });

exports.getAllTickets = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    if (isDynamoDbProvider()) {
      try {
        const rows = await scanTable(getDynamoTables().tickets);
        const filtered = rows
          .filter((ticket) => !status || ticket.status === status)
          .filter((ticket) => !priority || ticket.priority === priority)
          .sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
        const start = (Number(page) - 1) * Number(limit);
        return res.json({
          success: true,
          tickets: filtered.slice(start, start + Number(limit)),
          total: filtered.length,
          page: Number(page),
          pages: Math.ceil(filtered.length / Number(limit)),
          source: 'dynamodb',
        });
      } catch {
        console.error('DynamoDB ticket list failed; falling back to MongoDB.');
      }
    }

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    // Agents see only their tickets
    if (req.user.role === 'Support Agent') filter.agent = req.user._id;
    if (req.user.role === 'Customer Portal User') filter.customer = req.user._id;

    const tickets = await Ticket.find(filter)
      .populate('customer', 'name email')
      .populate('agent', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Ticket.countDocuments(filter);
    res.json({ success: true, tickets, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    if (isDynamoDbProvider()) {
      try {
        const ticket = await getItem(getDynamoTables().tickets, getTicketKey(req.params.id));
        if (ticket) return res.json({ success: true, ticket, source: 'dynamodb' });
      } catch {
        console.error('DynamoDB ticket lookup failed; falling back to MongoDB.');
      }
    }

    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('agent', 'name email')
      .populate('internalNotes.addedBy', 'name');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    if (isDynamoDbProvider()) {
      try {
        const now = new Date().toISOString();
        const ticketId = req.body.ticket_id || req.body.ticketId || makeTicketId();
        const ticket = {
          ...req.body,
          id: ticketId,
          ticket_id: ticketId,
          ticketId,
          subject,
          description,
          category,
          issue_category: req.body.issue_category || category,
          priority: priority || 'Medium',
          status: req.body.status || 'Open',
          customer: req.user?._id,
          created_at: req.body.created_at || now,
          updated_at: now,
          ticket_created_date: req.body.ticket_created_date || now,
          ticket_updated_date: now,
          source: req.body.source || 'api',
        };
        await putItem(getDynamoTables().tickets, ticket);
        return res.status(201).json({ success: true, ticket, source: 'dynamodb' });
      } catch {
        console.error('DynamoDB ticket create failed; falling back to MongoDB.');
      }
    }

    const ticket = await Ticket.create({ subject, description, category, priority, customer: req.user._id });
    res.status(201).json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    if (isDynamoDbProvider()) {
      try {
        const ticket = await updateDynamoItem(getDynamoTables().tickets, getTicketKey(req.params.id), {
          ...req.body,
          updated_at: new Date(),
          ticket_updated_date: new Date(),
        });
        if (ticket) return res.json({ success: true, ticket, source: 'dynamodb' });
      } catch {
        console.error('DynamoDB ticket update failed; falling back to MongoDB.');
      }
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addNote = async (req, res) => {
  try {
    if (isDynamoDbProvider()) {
      try {
        const current = await getItem(getDynamoTables().tickets, getTicketKey(req.params.id));
        if (current) {
          const note = { text: req.body.text, addedBy: req.user?._id || req.body.addedBy || 'system', createdAt: new Date() };
          const ticket = await updateDynamoItem(getDynamoTables().tickets, getTicketKey(getTicketId(current)), {
            internalNotes: [...(current.internalNotes || []), note],
            internal_notes: [...(current.internal_notes || []), note],
            updated_at: new Date(),
            ticket_updated_date: new Date(),
          });
          return res.json({ success: true, ticket, source: 'dynamodb' });
        }
      } catch {
        console.error('DynamoDB ticket note failed; falling back to MongoDB.');
      }
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    ticket.internalNotes.push({ text: req.body.text, addedBy: req.user._id });
    await ticket.save();
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignTicket = async (req, res) => {
  try {
    if (isDynamoDbProvider()) {
      try {
        const ticket = await updateDynamoItem(getDynamoTables().tickets, getTicketKey(req.params.id), {
          agent: req.body.agentId,
          assigned_agent: req.body.agentName || req.body.agent || req.body.agentId,
          status: 'In Progress',
          updated_at: new Date(),
          ticket_updated_date: new Date(),
        });
        if (ticket) return res.json({ success: true, ticket, source: 'dynamodb' });
      } catch {
        console.error('DynamoDB ticket assignment failed; falling back to MongoDB.');
      }
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { agent: req.body.agentId, status: 'In Progress' }, { new: true });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTicketStats = async (req, res) => {
  try {
    if (isDynamoDbProvider()) {
      try {
        const rows = await scanTable(getDynamoTables().tickets);
        return res.json({
          success: true,
          stats: {
            open: rows.filter((ticket) => ticket.status === 'Open').length,
            inProgress: rows.filter((ticket) => ticket.status === 'In Progress').length,
            resolved: rows.filter((ticket) => ticket.status === 'Resolved').length,
            total: rows.length,
          },
          source: 'dynamodb',
        });
      } catch {
        console.error('DynamoDB ticket stats failed; falling back to MongoDB.');
      }
    }

    const [open, inProgress, resolved, total] = await Promise.all([
      Ticket.countDocuments({ status: 'Open' }),
      Ticket.countDocuments({ status: 'In Progress' }),
      Ticket.countDocuments({ status: 'Resolved' }),
      Ticket.countDocuments(),
    ]);
    res.json({ success: true, stats: { open, inProgress, resolved, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
