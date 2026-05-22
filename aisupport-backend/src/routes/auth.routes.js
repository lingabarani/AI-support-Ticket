// auth.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/customer/register', ctrl.customerRegister);
router.post('/customer/login', ctrl.customerLogin);
router.post('/org/register', ctrl.orgRegister);
router.post('/org/login', ctrl.orgLogin);
router.get('/me', protect, ctrl.getMe);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);
module.exports = router;
