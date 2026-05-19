const { Readable } = require('stream');
const csvParser = require('csv-parser');

const columnMap = {
  'ticket id': 'ticket_id',
  ticketid: 'ticket_id',
  id: 'ticket_id',
  'customer name': 'customer_name',
  customer: 'customer_name',
  email: 'customer_email',
  'customer email': 'customer_email',
  'issue category': 'issue_category',
  category: 'issue_category',
  description: 'ticket_description',
  'ticket description': 'ticket_description',
  message: 'ticket_description',
  priority: 'priority',
  status: 'status',
  'created date': 'ticket_created_date',
  created: 'ticket_created_date',
  'updated date': 'ticket_updated_date',
};

const normalizeKey = (key) => {
  const cleaned = String(key || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  return columnMap[cleaned] || cleaned.replace(/\s+/g, '_');
};

const normalizeRow = (row) => Object.entries(row || {}).reduce((acc, [key, value]) => {
  acc[normalizeKey(key)] = value;
  return acc;
}, {});

const parseCsv = (buffer) => new Promise((resolve, reject) => {
  const rows = [];
  Readable.from(buffer)
    .pipe(csvParser())
    .on('data', (row) => rows.push(normalizeRow(row)))
    .on('end', () => resolve(rows))
    .on('error', reject);
});

const parseJson = (buffer) => {
  const parsed = JSON.parse(buffer.toString('utf-8').replace(/^\uFEFF/, ''));
  const rows = Array.isArray(parsed)
    ? parsed
    : parsed?.tickets || parsed?.data || parsed?.records || parsed?.items || [];
  if (!Array.isArray(rows)) {
    const error = new Error('JSON file must contain an array or a tickets/data/records/items array.');
    error.statusCode = 400;
    throw error;
  }
  return rows.map(normalizeRow);
};

const parseDataset = async (file) => {
  const originalName = String(file?.originalname || '').toLowerCase();
  if (originalName.endsWith('.csv') || file?.mimetype === 'text/csv') return parseCsv(file.buffer);
  if (originalName.endsWith('.json') || file?.mimetype === 'application/json') return parseJson(file.buffer);

  const error = new Error('Only CSV and JSON files are supported.');
  error.statusCode = 400;
  throw error;
};

module.exports = {
  normalizeRow,
  parseDataset,
};
