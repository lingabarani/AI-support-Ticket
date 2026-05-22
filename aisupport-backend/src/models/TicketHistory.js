const mongoose = require('mongoose');

const ticketHistorySchema = new mongoose.Schema({
  ticket_id: { type: String, required: true, index: true },
  action: { type: String, required: true },
  previous_status: String,
  new_status: String,
  updated_by: String,
  notes: String,
  timestamp: { type: Date, default: Date.now },
}, { collection: 'ticket_history' });

module.exports = mongoose.model('TicketHistory', ticketHistorySchema);
