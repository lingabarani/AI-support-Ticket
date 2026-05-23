const rateLimit = require('express-rate-limit');
const router = require('express').Router();
const { validateRole } = require('../middleware/validateRole');
const { generateChatReply } = require('../services/chatOrchestrator');

const MIN_RESPONSE_DELAY_MS = Number(process.env.CHAT_MIN_RESPONSE_DELAY_MS || 4200);
const MAX_RESPONSE_DELAY_MS = Number(process.env.CHAT_MAX_RESPONSE_DELAY_MS || 5200);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitForNaturalResponseTime = async (startedAt) => {
  const target = MIN_RESPONSE_DELAY_MS + Math.floor(Math.random() * Math.max(1, MAX_RESPONSE_DELAY_MS - MIN_RESPONSE_DELAY_MS));
  const remaining = target - (Date.now() - startedAt);
  if (remaining > 0) await wait(remaining);
};

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', chatLimiter, validateRole('body'), async (req, res) => {
  const startedAt = Date.now();
  try {
    const message = String(req.body.message || '').trim();

    if (!message) {
      await waitForNaturalResponseTime(startedAt);
      return res.json({
        reply: 'Please enter a support question so I can help.',
        role: req.dashboardRole,
        source: 'support_fallback',
        cards: [],
        suggestedActions: ['Show open tickets', 'Show system health', 'Give executive summary'],
      });
    }

    const response = await generateChatReply({
      role: req.dashboardRole,
      message,
      sessionId: req.body.sessionId,
    });
    await waitForNaturalResponseTime(startedAt);
    res.json(response);
  } catch (error) {
    const response = await generateChatReply({
      role: req.dashboardRole || req.body.role || 'support_agent',
      message: req.body.message || 'general help',
      sessionId: req.body.sessionId,
    });
    await waitForNaturalResponseTime(startedAt);
    res.json(response);
  }
});

module.exports = router;
