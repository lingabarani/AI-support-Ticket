const router = require('express').Router();
const { getDemoReports, getDemoTickets } = require('../services/datasetService');
const { getQuickSightEmbedUrl } = require('../services/quicksightService');

router.get('/', (req, res) => {
  res.json({
    success: true,
    reports: getDemoReports(),
    source: 'support_fallback',
  });
});

router.get('/export', (req, res) => {
  const tickets = getDemoTickets();
  const fields = Object.keys(tickets[0] || {});
  const escape = (value) => `"${String(Array.isArray(value) ? value.join('|') : value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    fields.join(','),
    ...tickets.map((ticket) => fields.map((field) => escape(ticket[field])).join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ticket-report.csv"');
  res.send(csv);
});

router.get('/quicksight-embed', async (req, res) => {
  try {
    const role = req.query.role || 'team_manager';
    const embedUrl = await getQuickSightEmbedUrl(role);
    res.json({ success: true, embedUrl });
  } catch (err) {
    res.json({
      success: true,
      embedUrl: '',
      source: 'support_fallback',
      message: 'QuickSight dashboard is temporarily unavailable. Showing analytics dashboard.',
    });
  }
});

module.exports = router;
