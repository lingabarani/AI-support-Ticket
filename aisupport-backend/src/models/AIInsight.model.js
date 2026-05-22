const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  insight_type: { type: String, index: true },
  role: { type: String, index: true },
  source: String,
  uploadId: { type: String, index: true },
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true, collection: 'aiinsights' });

module.exports = mongoose.model('AIInsight', aiInsightSchema);
