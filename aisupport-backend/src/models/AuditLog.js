const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: { type: String, default: 'system', index: true },
  action: { type: String, required: true, index: true },
  entityType: { type: String, default: 'ticket', index: true },
  entityId: { type: String, index: true },
  outcome: { type: String, default: 'success', index: true },
  confidence: Number,
  policyRule: String,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now, index: true },
}, { collection: 'audit_logs' });

module.exports = mongoose.model('AuditLog', auditLogSchema);
