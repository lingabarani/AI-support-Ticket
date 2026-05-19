const multer = require('multer');
const router = require('express').Router();
const {
  deleteUpload,
  getUploads,
  previewUpload,
  uploadDataset,
  validateAdmin,
} = require('../controllers/datasetController');

const allowedMimeTypes = new Set([
  'text/csv',
  'application/csv',
  'application/json',
  'application/octet-stream',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const name = String(file.originalname || '').toLowerCase();
    const allowedExtension = name.endsWith('.csv') || name.endsWith('.json');
    if (allowedExtension && allowedMimeTypes.has(file.mimetype)) return callback(null, true);
    if (allowedExtension) return callback(null, true);
    return callback(new Error('Only CSV and JSON files are supported.'));
  },
});

const uploadSingle = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();
    return res.status(400).json({ success: false, message: error.message || 'Invalid upload.' });
  });
};

router.post('/upload', validateAdmin, uploadSingle, uploadDataset);
router.get('/uploads', validateAdmin, getUploads);
router.get('/preview/:uploadId', validateAdmin, previewUpload);
router.delete('/:uploadId', validateAdmin, deleteUpload);

module.exports = router;
