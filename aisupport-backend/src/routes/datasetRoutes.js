const multer = require('multer');
const path = require('path');
const router = require('express').Router();
const { uploadDir } = require('../middleware/uploadMiddleware');
const {
  deleteUpload,
  getUploads,
  previewUpload,
  uploadDataset,
  validateAdmin,
} = require('../controllers/datasetController');
const {
  loadAllDatasets,
  getDatasetHealth,
  getDatasetStats,
} = require('../services/datasetRegistryService');
const {
  importAllDatasets,
} = require('../services/dynamoDatasetImportService');
const {
  uploadRawDatasetsToS3,
  uploadKnowledgeBaseToS3,
  uploadAnalyticsDatasetsToS3,
  uploadProductProofToS3,
} = require('../services/s3DatasetUploadService');
const { prepareKnowledgeBaseSync } = require('../services/knowledgeBaseSyncService');

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadDir),
  filename: (req, file, callback) => {
    const safeName = String(file.originalname || 'dataset').replace(/[^a-zA-Z0-9._-]+/g, '_');
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (['.csv', '.json'].includes(ext)) return callback(null, true);
    return callback(new Error('Dataset must be a CSV or JSON file.'));
  },
});

router.get('/uploads', getUploads);
router.get('/preview/:uploadId', previewUpload);
router.post('/upload', validateAdmin, upload.single('file'), uploadDataset);
router.delete('/:uploadId', validateAdmin, deleteUpload);

router.get('/health', async (req, res) => {
  try {
    const health = getDatasetHealth();
    res.json({ success: true, ...health });
  } catch (error) {
    res.json({ success: true, partial: true, message: 'Dataset health returned with fallback status.', stats: getDatasetStats() });
  }
});

router.post('/import-all', validateAdmin, async (req, res) => {
  try {
    await loadAllDatasets();
    const imported = await importAllDatasets();
    res.json({ success: true, message: 'All datasets imported to DynamoDB.', imported });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Dataset import failed.', errors: [error.message] });
  }
});

router.post('/upload-s3', validateAdmin, async (req, res) => {
  try {
    await loadAllDatasets();
    const raw = await uploadRawDatasetsToS3();
    const knowledgeBase = await uploadKnowledgeBaseToS3();
    const analytics = await uploadAnalyticsDatasetsToS3();
    const productProof = await uploadProductProofToS3();
    const instructions = prepareKnowledgeBaseSync();
    res.json({
      success: true,
      message: 'Dataset files uploaded to S3.',
      raw,
      knowledgeBase,
      analytics,
      productProof,
      instructions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'S3 upload failed.', errors: [error.message] });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const health = getDatasetHealth();
    res.json({
      success: true,
      datasetName: 'dataset_summary',
      totalRows: health.datasets.reduce((sum, item) => sum + item.totalRows, 0),
      validRows: health.datasets.reduce((sum, item) => sum + item.validRows, 0),
      invalidRows: health.datasets.reduce((sum, item) => sum + item.invalidRows, 0),
      insertedRows: 0,
      updatedRows: 0,
      skippedRows: 0,
      errors: [],
      datasets: health.datasets,
      knowledgeBaseDocs: health.knowledgeBaseDocs,
      manifestAvailable: health.manifestAvailable,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Dataset summary failed.', errors: [error.message] });
  }
});

module.exports = router;
