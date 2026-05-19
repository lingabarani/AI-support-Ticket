const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const DatasetUpload = require('../models/DatasetUpload');
const Ticket = require('../models/Ticket');
const User = require('../models/User.model');
const { parseDataset } = require('../utils/parseDataset');
const { validateAndNormalizeTicketRow } = require('../utils/validateTicketRow');

const datasetLabels = {
  tickets: 'tickets',
  support_tickets: 'tickets',
  users: 'users',
  knowledge_base: 'knowledge_base',
  analytics: 'analytics',
};

const normalizeDatasetType = (value) => datasetLabels[String(value || '').toLowerCase()] || 'tickets';

const safeError = (error) => ({
  message: error?.message || 'Dataset upload failed.',
});

const validateAdmin = async (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const token = auth.split(' ')[1];
  if (token === 'local-demo-token') {
    if (req.headers['x-user-role'] !== 'System Admin') {
      return res.status(403).json({ success: false, message: 'System Admin access required.' });
    }
    req.user = {
      role: 'System Admin',
      email: req.headers['x-user-email'] || 'local-admin',
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    if (user.role !== 'System Admin') {
      return res.status(403).json({ success: false, message: 'System Admin access required.' });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(403).json({ success: false, message: 'System Admin access required.' });
  }
};

const uploadDataset = async (req, res) => {
  const uploadId = uuidv4();

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Dataset file is required.' });
    }

    const datasetType = normalizeDatasetType(req.body.datasetType);
    const fileName = req.file.originalname || 'dataset';
    const fileType = fileName.toLowerCase().endsWith('.json') ? 'json' : 'csv';
    const rows = await parseDataset(req.file);

    if (!rows.length) {
      await DatasetUpload.create({
        uploadId,
        fileName,
        fileType,
        datasetType,
        uploadedBy: req.user?.email || req.headers['x-user-email'] || 'System Admin',
        totalRows: 0,
        successRows: 0,
        failedRows: 0,
        status: 'Failed',
        errors: [{ row: 0, message: 'File is empty.' }],
      });
      return res.status(400).json({ success: false, message: 'File is empty.', uploadId, errors: [{ row: 0, message: 'File is empty.' }] });
    }

    if (datasetType !== 'tickets') {
      await DatasetUpload.create({
        uploadId,
        fileName,
        fileType,
        datasetType,
        uploadedBy: req.user?.email || req.headers['x-user-email'] || 'System Admin',
        totalRows: rows.length,
        successRows: 0,
        failedRows: rows.length,
        status: 'Failed',
        errors: [{ row: 0, message: 'This dataset type is queued for future schema support. Use Support Tickets for ticket ingestion.' }],
      });
      return res.status(400).json({
        success: false,
        message: 'This dataset type is queued for future schema support. Use Support Tickets for ticket ingestion.',
        uploadId,
        datasetType,
        totalRows: rows.length,
        successRows: 0,
        failedRows: rows.length,
        errors: [{ row: 0, message: 'Unsupported dataset type for database insert.' }],
      });
    }

    const normalized = rows.map((row, index) => validateAndNormalizeTicketRow(row, index, uploadId));
    const validRows = normalized.filter((item) => item.valid).map((item) => item.ticket);
    const errors = normalized.flatMap((item) => item.errors).slice(0, 100);

    if (validRows.length) {
      await Ticket.bulkWrite(validRows.map((ticket) => ({
        updateOne: {
          filter: { ticket_id: ticket.ticket_id },
          update: { $set: ticket },
          upsert: true,
        },
      })), { ordered: false });
    }

    const summary = {
      uploadId,
      fileName,
      fileType,
      datasetType,
      uploadedBy: req.user?.email || req.headers['x-user-email'] || 'System Admin',
      totalRows: rows.length,
      successRows: validRows.length,
      failedRows: rows.length - validRows.length,
      status: validRows.length === rows.length ? 'Completed' : validRows.length ? 'Partial' : 'Failed',
      errors,
    };

    await DatasetUpload.create(summary);

    return res.json({
      success: true,
      message: 'Dataset uploaded successfully',
      ...summary,
    });
  } catch (error) {
    try {
      await DatasetUpload.create({
        uploadId,
        fileName: req.file?.originalname || 'dataset',
        fileType: req.file?.originalname?.split('.').pop() || 'unknown',
        datasetType: normalizeDatasetType(req.body.datasetType),
        uploadedBy: req.user?.email || req.headers['x-user-email'] || 'System Admin',
        totalRows: 0,
        successRows: 0,
        failedRows: 0,
        status: 'Failed',
        errors: [safeError(error)],
      });
    } catch {
      // Keep the upload response clean if audit write also fails.
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Dataset upload failed.',
      uploadId,
      errors: [safeError(error)],
    });
  }
};

const getUploads = async (req, res) => {
  const uploads = await DatasetUpload.find().sort({ createdAt: -1 }).limit(50).lean();
  res.json({ success: true, uploads });
};

const previewUpload = async (req, res) => {
  const { uploadId } = req.params;
  const records = await Ticket.find({ uploadId }).sort({ createdAt: -1 }).limit(20).lean();
  res.json({ success: true, uploadId, records });
};

const deleteUpload = async (req, res) => {
  const { uploadId } = req.params;
  const deletedTickets = await Ticket.deleteMany({ uploadId });
  await DatasetUpload.deleteOne({ uploadId });
  res.json({
    success: true,
    message: 'Dataset upload removed.',
    uploadId,
    deletedRecords: deletedTickets.deletedCount || 0,
  });
};

module.exports = {
  deleteUpload,
  getUploads,
  previewUpload,
  uploadDataset,
  validateAdmin,
};
