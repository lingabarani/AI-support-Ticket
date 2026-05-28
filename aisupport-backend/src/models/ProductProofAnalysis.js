const mongoose = require('mongoose');

const productProofAnalysisSchema = new mongoose.Schema({
  uploadedImage: String,
  productId: { type: String, index: true },
  orderId: { type: String, index: true },
  damageDetected: { type: Boolean, default: false },
  mismatchDetected: { type: Boolean, default: false },
  OCRResult: { type: String, default: '' },
  confidence: { type: Number, default: 0 },
  recommendedAction: String,
  provider: { type: String, default: 'rules_ready' },
  fileMetadata: mongoose.Schema.Types.Mixed,
  analysisPlaceholder: mongoose.Schema.Types.Mixed,
  supportedProofTypes: [String],
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true, collection: 'product_proof_analyses' });

module.exports = mongoose.model('ProductProofAnalysis', productProofAnalysisSchema);
