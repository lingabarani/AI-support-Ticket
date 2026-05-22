const mongoose = require('mongoose');

const businessExecutiveInsightSchema = new mongoose.Schema({
  uploadId: { type: String, index: true },
  datasetType: { type: String, default: 'business_executive_insights' },
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true, collection: 'business_executive_insights', strict: false });

module.exports = mongoose.model('BusinessExecutiveInsight', businessExecutiveInsightSchema);
