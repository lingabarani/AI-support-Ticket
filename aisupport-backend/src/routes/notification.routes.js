// notification.routes.js
const router = require('express').Router();
const { getDemoNotifications } = require('../services/datasetService');

let notificationStore;
const notifications = () => {
  if (!notificationStore) notificationStore = getDemoNotifications().map((item) => ({ ...item }));
  return notificationStore;
};

router.get('/', async (req, res) => {
  res.json({ success: true, notifications: notifications(), source: 'support_fallback' });
});
router.patch('/:id/read', async (req, res) => {
  const item = notifications().find((notification) => notification.notification_id === req.params.id);
  if (item) item.read = true;
  res.json({ success: true, notification: item || notifications()[0], source: 'support_fallback' });
});
router.put('/:id/read', async (req, res) => {
  const item = notifications().find((notification) => notification.notification_id === req.params.id);
  if (item) item.read = true;
  res.json({ success: true, notification: item || notifications()[0], source: 'support_fallback' });
});
router.put('/mark-all-read', async (req, res) => {
  notificationStore = notifications().map((notification) => ({ ...notification, read: true }));
  res.json({ success: true, notifications: notificationStore, source: 'support_fallback' });
});
module.exports = router;
