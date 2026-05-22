const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const allowedOrgRoles = new Set(['support_agent', 'team_manager', 'business_executive']);

const authResponse = (res, status, user) => {
  const token = signToken(user._id);
  return res.status(status).json({ success: true, token, user });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });
    const user = await User.create({ name, email, password, role });
    return authResponse(res, 201, user);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    if (req.requiredRole && user.role !== req.requiredRole) {
      return res.status(403).json({ success: false, message: 'This account is not allowed for this portal.' });
    }
    user.lastLogin = new Date();
    await user.save();
    return authResponse(res, 200, user);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.customerRegister = async (req, res) => {
  req.body.role = 'customer';
  return exports.register(req, res);
};

exports.customerLogin = async (req, res) => {
  req.requiredRole = 'customer';
  return exports.login(req, res);
};

exports.orgRegister = async (req, res) => {
  const role = allowedOrgRoles.has(req.body.role) ? req.body.role : 'support_agent';
  req.body.role = role;
  return exports.register(req, res);
};

exports.orgLogin = async (req, res) => {
  return exports.login(req, res);
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.forgotPassword = async (req, res) => {
  // TODO: integrate SES or SendGrid for email
  res.json({ success: true, message: 'Password reset link sent to email.' });
};

exports.resetPassword = async (req, res) => {
  // TODO: validate reset token, update password
  res.json({ success: true, message: 'Password reset successfully.' });
};
