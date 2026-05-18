const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.use(authorize('Team Manager', 'Business Executive', 'System Admin'));

router.get('/', (req, res) => {
  res.json({
    success: true,
    reports: [
      { id: 1, name: 'Monthly Ticket Summary', type: 'PDF', generated: new Date().toISOString() },
      { id: 2, name: 'Agent Performance Report', type: 'XLSX', generated: new Date().toISOString() },
      { id: 3, name: 'Customer Satisfaction Report', type: 'PDF', generated: new Date().toISOString() },
    ],
  });
});

// QuickSight Embed URL (placeholder)
router.get('/quicksight-embed', async (req, res) => {
  // TODO: Use @aws-sdk/client-quicksight to generate embed URL
  // const { QuickSightClient, GetDashboardEmbedUrlCommand } = require('@aws-sdk/client-quicksight');
  res.json({
    success: true,
    embedUrl: `https://${process.env.AWS_REGION}.quicksight.aws.amazon.com/sn/embed/share/accounts/${process.env.QUICKSIGHT_ACCOUNT_ID}/dashboards/${process.env.QUICKSIGHT_DASHBOARD_ID}`,
    note: 'Replace with actual QuickSight SDK embed URL generation',
  });
});

module.exports = router;
