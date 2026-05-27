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

module.exports = router;
