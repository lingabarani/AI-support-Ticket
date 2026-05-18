// notification.routes.js
const router = require('express').Router();
const Notification = require('../models/Notification.model');
const { protect } = require('../middleware/auth.middleware');
router.use(protect);
router.get('/', async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, notifications });
});
router.put('/:id/read', async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
});
router.put('/mark-all-read', async (req, res) => {
  await Notification.updateMany({ user: req.user._id }, { read: true });
  res.json({ success: true });
});
module.exports = router;
