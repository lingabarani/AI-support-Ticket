const mongoose = require('mongoose');

const ticketAnalysisSchema = new mongoose.Schema({
  ticket_id: { type: String, required: true, index: true },
  sentiment: { type: String, default: 'Neutral' },
  priority: { type: String, default: 'Medium' },
  summary: String,
  root_cause: String,
  suggested_resolution: String,
  confidence: Number,
  source: { type: String, default: 'local_intelligence' },
  created_at: { type: Date, default: Date.now },
}, { collection: 'ticket_analyses' });

module.exports = mongoose.model('TicketAnalysis', ticketAnalysisSchema);
