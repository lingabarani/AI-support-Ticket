const mongoose = require('mongoose');

const supervisorReviewSchema = new mongoose.Schema({
  ticket_id: { type: String, index: true },
  status: { type: String, default: 'pending', index: true },
  reason: String,
  decision: String,
  confidence: Number,
  assignedTo: { type: String, default: 'Team Manager' },
  requestedBy: { type: String, default: 'supervisor_agent' },
  resolvedBy: String,
  resolvedAt: Date,
  notes: String,
}, { timestamps: true, collection: 'supervisor_reviews' });

module.exports = mongoose.model('SupervisorReview', supervisorReviewSchema);
