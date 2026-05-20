const router = require('express').Router();
const pipeline = require('../services/awsPipeline.service');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

const isProduction = () => process.env.NODE_ENV === 'production';

router.get('/config', (req, res) => {
  res.json({ success: true, config: pipeline.getConfig() });
});

router.get('/health', async (req, res) => {
  try {
    const bedrock = await pipeline.testBedrock();
    res.json({ success: true, status: 'connected', bedrock });
  } catch (err) {
    if (!isProduction()) {
      return res.json({
        success: false,
        status: 'degraded',
        message: err.message,
        source: 'support_fallback',
      });
    }
    res.status(500).json({ success: false, status: 'error', message: err.message });
  }
});

router.post('/tickets', async (req, res) => {
  try {
    const result = await pipeline.submitTicket(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    if (!isProduction()) {
      return res.status(202).json({
        success: true,
        source: 'support_fallback',
        message: err.message,
        ticket: req.body,
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics/recent', async (req, res) => {
  try {
    const records = await pipeline.listRecentAnalytics(Number(req.query.limit || 10));
    res.json({ success: true, records });
  } catch (err) {
    if (!isProduction()) {
      return res.json({
        success: true,
        records: [],
        source: 'support_fallback',
        message: err.message,
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
