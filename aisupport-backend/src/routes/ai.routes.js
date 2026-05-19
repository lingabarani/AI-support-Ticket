const router = require('express').Router();
const { generateLocalResponse } = require('../services/localIntelligenceService');

const local = (role = 'support_agent') => (req, res) => {
  const message = req.body.message || req.body.text || req.body.context || req.body.ticketId || 'Analyze the current support request';
  const response = generateLocalResponse({ role: req.body.role || role, message: String(message), includeNotice: true });
  res.json({ success: true, ...response });
};

router.post('/analyze-ticket', local('support_agent'));
router.post('/summarize', local('support_agent'));
router.post('/sentiment', local('support_agent'));
router.post('/recommendation', local('business_executive'));
router.post('/suggest-response', local('support_agent'));

module.exports = router;
