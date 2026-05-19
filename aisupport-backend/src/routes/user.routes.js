const router = require('express').Router();
const { getDemoUsers } = require('../services/datasetService');

let userStore;
const users = () => {
  if (!userStore) userStore = getDemoUsers().map((user) => ({ ...user }));
  return userStore;
};

router.get('/', async (req, res) => {
  res.json({ success: true, users: users(), source: 'support_fallback' });
});

router.post('/', async (req, res) => {
  const user = {
    user_id: `USR-${String(users().length + 1).padStart(3, '0')}`,
    name: req.body.name || 'Support User',
    email: req.body.email || `user.${users().length + 1}@aisupport.local`,
    role: req.body.role || 'Support Agent',
    department: req.body.department || 'Support Operations',
    status: req.body.status || 'Active',
    last_login: new Date().toISOString(),
    tickets_assigned: 0,
    tickets_resolved: 0,
    sla_score: 95,
    performance_score: 90,
    permissions: req.body.permissions || ['view_tickets'],
  };
  users().push(user);
  res.status(201).json({ success: true, user, source: 'support_fallback' });
});

router.put('/:id', async (req, res) => {
  const index = users().findIndex((user) => user.user_id === req.params.id || user.email === req.params.id);
  const targetIndex = index >= 0 ? index : 0;
  userStore[targetIndex] = { ...userStore[targetIndex], ...req.body };
  res.json({ success: true, user: userStore[targetIndex], source: 'support_fallback' });
});

router.delete('/:id', async (req, res) => {
  const index = users().findIndex((user) => user.user_id === req.params.id || user.email === req.params.id);
  if (index >= 0) userStore[index] = { ...userStore[index], status: 'Inactive' };
  res.json({ success: true, message: 'User deactivated.', source: 'support_fallback' });
});

module.exports = router;
