const router = require('express').Router();
const ctrl = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.post('/analyze-ticket',  ctrl.analyzeTicket);
router.post('/summarize',       ctrl.summarize);
router.post('/sentiment',       ctrl.analyzeSentiment);
router.post('/recommendation',  ctrl.getRecommendations);
router.post('/suggest-response', ctrl.suggestResponse);

module.exports = router;
