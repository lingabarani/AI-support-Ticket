const router = require('express').Router();
const pipeline = require('../services/awsPipeline.service');

router.get('/config', (req, res) => {
  res.json({ success: true, config: pipeline.getConfig() });
});

router.get('/health', async (req, res) => {
  try {
    const bedrock = await pipeline.testBedrock();
    res.json({ success: true, status: 'connected', bedrock });
  } catch (err) {
    res.status(500).json({ success: false, status: 'error', message: err.message });
  }
});

router.post('/tickets', async (req, res) => {
  try {
    const result = await pipeline.submitTicket(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics/recent', async (req, res) => {
  try {
    const records = await pipeline.listRecentAnalytics(Number(req.query.limit || 10));
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
