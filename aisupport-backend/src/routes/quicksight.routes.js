const rateLimit = require('express-rate-limit');
const router = require('express').Router();
const { validateRole } = require('../middleware/validateRole');
const { getQuickSightEmbedUrl } = require('../services/quicksightService');

const embedLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/embed-url', embedLimiter, validateRole('query'), async (req, res) => {
  try {
    const embedUrl = await getQuickSightEmbedUrl(req.dashboardRole);
    res.json({ embedUrl, source: 'ai' });
  } catch (error) {
    const reason = process.env.NODE_ENV === 'production'
      ? ''
      : ` Reason: ${error.cause?.name || error.message}`;

    res.json({
      embedUrl: '',
      source: 'support_fallback',
      message: `QuickSight dashboard is temporarily unavailable. Showing analytics dashboard.${reason}`,
    });
  }
});

module.exports = router;
