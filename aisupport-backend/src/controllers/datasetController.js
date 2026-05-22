const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const DatasetUpload = require('../models/DatasetUpload');
const Ticket = require('../models/Ticket');
const User = require('../models/User.model');
const AIInsight = require('../models/AIInsight.model');
const TeamManagerPerformance = require('../models/TeamManagerPerformance');
const BusinessExecutiveInsight = require('../models/BusinessExecutiveInsight');
const { parseDataset } = require('../utils/parseDataset');
const { validateAndNormalizeTicketRow } = require('../utils/validateTicketRow');

const datasetLabels = {
  tickets: 'tickets',
  support_tickets: 'tickets',
  'support tickets': 'tickets',
  team_manager_performance: 'team_manager_performance',
  'team manager performance': 'team_manager_performance',
  business_executive_insights: 'business_executive_insights',
  'business executive insights': 'business_executive_insights',
  aiinsights: 'aiinsights',
};

const normalizeDatasetType = (value) => datasetLabels[String(value || '').toLowerCase()] || datasetLabels[String(value || '')] || 'tickets';

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
    if (!['Team Manager', 'team_manager', 'System Admin'].includes(req.headers['x-user-role'])) {
      return res.status(403).json({ success: false, message: 'Team Manager access required.' });
    }
    req.user = {
      role: req.headers['x-user-role'],
      email: req.headers['x-user-email'] || 'team-manager-demo',
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    if (!['Team Manager', 'team_manager', 'System Admin'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Team Manager access required.' });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(403).json({ success: false, message: 'Team Manager access required.' });
  }
};

const insertGenericDataset = async ({ rows, datasetType, uploadId }) => {
  const payload = rows.map((row) => ({ ...row, data: row, uploadId, datasetType }));
  if (datasetType === 'team_manager_performance') return TeamManagerPerformance.insertMany(payload, { ordered: false });
  if (datasetType === 'business_executive_insights') return BusinessExecutiveInsight.insertMany(payload, { ordered: false });
  return AIInsight.insertMany(payload.map((row) => ({ ...row, insight_type: datasetType, role: datasetType })), { ordered: false });
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
      await insertGenericDataset({ rows, datasetType, uploadId });
      const summary = {
        uploadId,
        fileName,
        fileType,
        datasetType,
        uploadedBy: req.user?.email || req.headers['x-user-email'] || 'Team Manager',
        totalRows: rows.length,
        successRows: rows.length,
        failedRows: 0,
        status: 'Completed',
        errors: [],
      };
      await DatasetUpload.create(summary);
      return res.json({ success: true, message: 'Dataset uploaded successfully', ...summary });
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
      uploadedBy: req.user?.email || req.headers['x-user-email'] || 'Team Manager',
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
  const upload = await DatasetUpload.findOne({ uploadId }).lean();
  const datasetType = upload?.datasetType || 'tickets';
  const Model = datasetType === 'team_manager_performance'
    ? TeamManagerPerformance
    : datasetType === 'business_executive_insights'
      ? BusinessExecutiveInsight
      : datasetType === 'tickets'
        ? Ticket
        : AIInsight;
  const records = await Model.find({ uploadId }).sort({ createdAt: -1 }).limit(20).lean();
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
