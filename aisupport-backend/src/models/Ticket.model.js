const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId:    { type: String, unique: true },
  subject:     { type: String, required: true },
  description: { type: String, required: true },
  category:    { type: String, enum: ['Login Issues','Payment Issues','Refunds','Product Defect','Delivery Issues','Feature Request','Other'], required: true },
  priority:    { type: String, enum: ['High','Medium','Low'], default: 'Medium' },
  status:      { type: String, enum: ['Open','In Progress','On Hold','Resolved','Closed'], default: 'Open' },
  sentiment:   { type: String, enum: ['Positive','Neutral','Negative'], default: 'Neutral' },
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agent:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags:        [String],
  attachments: [{ url: String, filename: String, uploadedAt: Date }],
  internalNotes: [{
    text:      String,
    addedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  }],
  messages: [{
    text:      String,
    from:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isAgent:   Boolean,
    createdAt: { type: Date, default: Date.now },
  }],
  aiSummary:        String,
  aiRootCause:      String,
  aiSuggestedReply: String,
  slaDueAt:         Date,
  resolvedAt:       Date,
  firstResponseAt:  Date,
}, { timestamps: true });

ticketSchema.pre('save', function(next) {
  if (!this.ticketId) {
    this.ticketId = 'TKT-' + Math.floor(10000 + Math.random() * 90000);
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
