const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const attachmentMimeTypes = new Set([
  'image/png',
  'image/jpg',
  'image/jpeg',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadDir),
  filename: (req, file, callback) => {
    const safeName = String(file.originalname || 'attachment').replace(/[^a-zA-Z0-9._-]+/g, '_');
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const ticketAttachmentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExt = ['.png', '.jpg', '.jpeg', '.pdf', '.docx', '.txt'].includes(ext);
    if (allowedExt && attachmentMimeTypes.has(file.mimetype)) return callback(null, true);
    if (allowedExt) return callback(null, true);
    return callback(new Error('Attachment must be png, jpg, jpeg, pdf, docx, or txt.'));
  },
});

const optionalTicketAttachment = (req, res, next) => {
  ticketAttachmentUpload.single('attachment')(req, res, (error) => {
    if (error) req.attachmentWarning = error.message || 'Attachment upload failed. Ticket submitted without attachment.';
    return next();
  });
};

module.exports = {
  optionalTicketAttachment,
  uploadDir,
};
