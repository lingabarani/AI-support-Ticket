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
    res.json({
      embedUrl,
      source: 'quicksight_registered_embed',
      canEmbed: true,
      message: 'Secure QuickSight registered-user embed loaded.',
    });
  } catch (error) {
    res.json({
      embedUrl: '',
      source: 'quicksight_embed_unavailable',
      canEmbed: false,
      message: 'QuickSight embedded dashboard is temporarily unavailable. Showing built-in analytics dashboard below.',
      reason: process.env.NODE_ENV === 'production'
        ? undefined
        : (error.awsErrorMessage || error.cause?.message || error.message),
    });
  }
});

module.exports = router;
