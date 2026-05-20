const SUPPORTED_ROLES = ['customer', 'support_agent', 'team_manager', 'business_executive', 'system_admin', 'system_admin_reports'];

const validateRole = (source = 'body') => (req, res, next) => {
  const role = source === 'query' ? req.query.role : req.body.role;

  if (!SUPPORTED_ROLES.includes(role)) {
    req.dashboardRole = 'support_agent';
    return next();
  }

  req.dashboardRole = role;
  next();
};

module.exports = { SUPPORTED_ROLES, validateRole };
