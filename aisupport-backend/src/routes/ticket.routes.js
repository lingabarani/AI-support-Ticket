const router = require('express').Router();
const ctrl = require('../controllers/ticket.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/stats', ctrl.getTicketStats);
router.get('/', ctrl.getAllTickets);
router.post('/', ctrl.createTicket);
router.get('/:id', ctrl.getTicketById);
router.put('/:id', ctrl.updateTicket);
router.post('/:id/notes', ctrl.addNote);
router.put('/:id/assign', authorize('Team Manager', 'System Admin'), ctrl.assignTicket);
module.exports = router;
