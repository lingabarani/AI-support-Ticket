const multer = require('multer');
const path = require('path');
const router = require('express').Router();
const ProductProofAnalysis = require('../models/ProductProofAnalysis');
const { uploadDir } = require('../middleware/uploadMiddleware');
const { analyzeProductProof } = require('../services/productProofService');
const { writeAuditEvent } = require('../services/auditLogService');

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadDir),
  filename: (req, file, callback) => {
    const safeName = String(file.originalname || 'product-proof').replace(/[^a-zA-Z0-9._-]+/g, '_');
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.webp', '.pdf'].includes(ext)) return callback(null, true);
    return callback(new Error('Product proof must be an image or PDF file.'));
  },
});

router.post('/analyze', upload.single('uploadedImage'), async (req, res) => {
  const uploadedImage = req.file ? `/uploads/${req.file.filename}` : req.body.uploadedImage;
  const analysis = await analyzeProductProof({
    uploadedImage,
    productId: req.body.productId,
    orderId: req.body.orderId,
    metadata: {
      filename: req.file?.originalname,
      description: req.body.description,
      issue: req.body.issue,
      notes: req.body.notes,
    },
  });

  let record = null;
  try {
    record = await ProductProofAnalysis.create(analysis);
  } catch {
    record = analysis;
  }

  await writeAuditEvent({
    actor: req.headers['x-user-email'] || 'customer',
    action: 'product_proof_analyzed',
    entityType: 'product_proof',
    entityId: analysis.orderId,
    outcome: analysis.refundEligible ? 'refund_review_required' : 'queued',
    metadata: {
      productId: analysis.productId,
      confidence: analysis.confidence,
      recommendedAction: analysis.recommendedAction,
    },
  });

  res.status(201).json({ success: true, analysis: record });
});

module.exports = router;
