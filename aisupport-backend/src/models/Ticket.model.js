const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticket_id:    { type: String, unique: true, sparse: true, index: true },
  ticketId:    { type: String, unique: true },
  subject:     { type: String },
  description: { type: String },
  category:    { type: String },
  affected_product: String,
  account_company: String,
  customer_name: String,
  customer_email: String,
  product: String,
  issue_category: { type: String, index: true },
  ticket_description: String,
  resolution_summary: String,
  priority:    { type: String, enum: ['Urgent','High','Medium','Low'], default: 'Medium', index: true },
  status:      { type: String, enum: ['Open','In Progress','Pending Customer','On Hold','Resolved','Closed'], default: 'Open', index: true },
  channel: String,
  region: String,
  customer_age: Number,
  customer_gender: String,
  subscription_type: String,
  previous_tickets: Number,
  issue_complexity_score: Number,
  customer_satisfaction: Number,
  resolution_time_hours: Number,
  ticket_created_date: { type: Date, index: true },
  ticket_updated_date: Date,
  escalation_required: Boolean,
  sla_breached: Boolean,
  sla_due_at: Date,
  device: String,
  browser: String,
  payment_method: String,
  language: String,
  time_of_day: String,
  customer_type: String,
  assigned_agent: { type: String, index: true },
  assigned_team: { type: String, index: true },
  ai_summary: String,
  ai_sentiment: String,
  ai_urgency_score: Number,
  ai_root_cause: String,
  ai_suggested_resolution: String,
  ai_customer_churn_risk: String,
  ai_confidence_score: Number,
  revenue_risk: Number,
  source: String,
  created_at: Date,
  updated_at: Date,
  uploadId: { type: String, index: true },
  sentiment:   { type: String, enum: ['Positive','Neutral','Negative'], default: 'Neutral' },
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  agent:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags:        [String],
  attachments: [{
    url: String,
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    storagePath: String,
    uploadedAt: Date,
  }],
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
  if (!this.ticket_id && this.ticketId) this.ticket_id = this.ticketId;
  if (!this.ticketId && this.ticket_id) this.ticketId = this.ticket_id;
  if (!this.ticketId) this.ticketId = 'TKT-' + Math.floor(10000 + Math.random() * 90000);
  if (!this.ticket_id) this.ticket_id = this.ticketId;
  if (!this.subject && this.ticket_description) this.subject = this.ticket_description.slice(0, 140);
  if (!this.description && this.ticket_description) this.description = this.ticket_description;
  if (!this.category && this.issue_category) this.category = this.issue_category;
  if (!this.issue_category && this.category) this.issue_category = this.category;
  if (!this.product && this.affected_product) this.product = this.affected_product;
  if (!this.affected_product && this.product) this.affected_product = this.product;
  if (!this.sentiment && this.ai_sentiment) this.sentiment = this.ai_sentiment;
  if (!this.created_at) this.created_at = this.createdAt || new Date();
  this.updated_at = new Date();
  if (!this.ticket_created_date) this.ticket_created_date = this.created_at;
  this.ticket_updated_date = this.updated_at;
  if (!this.sla_due_at && !this.slaDueAt) {
    const hours = this.priority === 'Urgent' ? 8 : this.priority === 'High' ? 24 : this.priority === 'Low' ? 72 : 48;
    this.sla_due_at = new Date(Date.now() + hours * 60 * 60 * 1000);
    this.slaDueAt = this.sla_due_at;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
