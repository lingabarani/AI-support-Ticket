const mongoose = require('mongoose');

const slaEventSchema = new mongoose.Schema({
  ticket_id: { type: String, index: true },
  priority: String,
  dueAt: Date,
  status: { type: String, index: true },
  remainingHours: Number,
  breached: Boolean,
  atRisk: Boolean,
  stale: Boolean,
  escalationTriggered: Boolean,
  assignedTeam: String,
}, { timestamps: true, collection: 'sla_events' });

module.exports = mongoose.model('SlaEvent', slaEventSchema);
