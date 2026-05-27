const router = require('express').Router();
const Ticket = require('../models/Ticket');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/tickets', async (req, res) => {
  const email = String(req.headers['x-user-email'] || req.query.email || '').trim();
  if (!email) return res.status(400).json({ success: false, message: 'Customer email is required.' });

  const tickets = await Ticket.find({
    customer_email: new RegExp(`^${escapeRegex(email)}$`, 'i'),
  })
    .sort({ ticket_created_date: -1, createdAt: -1 })
    .limit(100)
    .lean();

  res.json({
    success: true,
    tickets,
    source: tickets.length ? 'mongodb' : 'mongodb_empty',
  });
});

module.exports = router;
