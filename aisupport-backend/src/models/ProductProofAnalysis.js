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
}, { timestamps: true, collection: 'product_proof_analyses' });

module.exports = mongoose.model('ProductProofAnalysis', productProofAnalysisSchema);
