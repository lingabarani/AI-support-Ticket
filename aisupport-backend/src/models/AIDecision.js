const mongoose = require('mongoose');

const aiDecisionSchema = new mongoose.Schema({
  ticket_id: { type: String, index: true },
  decision: { type: String, required: true, index: true },
  action: String,
  assignedTeam: String,
  autoResolved: { type: Boolean, default: false },
  escalationRequired: { type: Boolean, default: false },
  reason: String,
  confidence: Number,
  riskScore: Number,
  policyRule: String,
  createdBy: { type: String, default: 'ai_decision_engine' },
}, { timestamps: true, collection: 'ai_decisions' });

module.exports = mongoose.model('AIDecision', aiDecisionSchema);
