const rateLimit = require('express-rate-limit');
const router = require('express').Router();
const { validateRole } = require('../middleware/validateRole');
const { generateChatReply } = require('../services/chatOrchestrator');

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', chatLimiter, validateRole('body'), async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();

    if (!message) {
      return res.json({
        reply: 'Please enter a support question so I can help.',
        role: req.dashboardRole,
        source: 'support_fallback',
        cards: [],
        suggestedActions: ['Show open tickets', 'Show system health', 'Give executive summary'],
      });
    }

    res.json(await generateChatReply({
      role: req.dashboardRole,
      message,
      sessionId: req.body.sessionId,
    }));
  } catch (error) {
    res.json(await generateChatReply({
      role: req.dashboardRole || req.body.role || 'support_agent',
      message: req.body.message || 'general help',
      sessionId: req.body.sessionId,
    }));
  }
});

module.exports = router;
