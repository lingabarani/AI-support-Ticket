const mongoose = require('mongoose');

const datasetUploadSchema = new mongoose.Schema({
  uploadId: { type: String, required: true, unique: true, index: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  datasetType: { type: String, required: true, index: true },
  uploadedBy: { type: String, default: 'System Admin' },
  totalRows: { type: Number, default: 0 },
  insertedRows: { type: Number, default: 0 },
  updatedRows: { type: Number, default: 0 },
  successRows: { type: Number, default: 0 },
  failedRows: { type: Number, default: 0 },
  status: { type: String, enum: ['Success', 'Completed', 'Partial', 'Failed'], default: 'Success' },
  errors: [{
    row: Number,
    message: String,
    field: String,
  }],
  validationErrors: [{
    row: Number,
    message: String,
    field: String,
  }],
}, { timestamps: { createdAt: true, updatedAt: false }, suppressReservedKeysWarning: true });

module.exports = mongoose.model('DatasetUpload', datasetUploadSchema, 'dataset_uploads');
