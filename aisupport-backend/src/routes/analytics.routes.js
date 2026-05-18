const router = require('express').Router();
const Ticket = require('../models/Ticket.model');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.use(authorize('Team Manager', 'Business Executive', 'System Admin'));

router.get('/overview', async (req, res) => {
  try {
    const [open, inProgress, resolved, total] = await Promise.all([
      Ticket.countDocuments({ status: 'Open' }),
      Ticket.countDocuments({ status: 'In Progress' }),
      Ticket.countDocuments({ status: 'Resolved' }),
      Ticket.countDocuments(),
    ]);
    const byPriority = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);
    const byCategory = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, overview: { open, inProgress, resolved, total }, byPriority, byCategory });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/sentiment', async (req, res) => {
  try {
    const data = await Ticket.aggregate([
      { $group: { _id: '$sentiment', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
