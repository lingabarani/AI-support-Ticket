const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  ticket:      { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  type:        { type: String, enum: ['summarization','sentiment','priority','churn','root_cause','recommendation'] },
  input:       mongoose.Schema.Types.Mixed,
  output:      mongoose.Schema.Types.Mixed,
  confidence:  Number,
  model:       { type: String, default: 'anthropic.claude-3-sonnet' },
  processedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('AIInsight', aiInsightSchema);
