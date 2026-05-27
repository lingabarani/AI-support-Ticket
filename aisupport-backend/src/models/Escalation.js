const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema({
  ticket_id: { type: String, index: true },
  reason: String,
  source: { type: String, default: 'sla_engine' },
  assignedTeam: String,
  severity: { type: String, default: 'Medium', index: true },
  status: { type: String, default: 'Open', index: true },
  owner: String,
}, { timestamps: true, collection: 'escalations' });

module.exports = mongoose.model('Escalation', escalationSchema);
