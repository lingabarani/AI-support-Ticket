const mongoose = require('mongoose');

const teamManagerPerformanceSchema = new mongoose.Schema({
  uploadId: { type: String, index: true },
  datasetType: { type: String, default: 'team_manager_performance' },
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true, collection: 'team_manager_performance', strict: false });

module.exports = mongoose.model('TeamManagerPerformance', teamManagerPerformanceSchema);
