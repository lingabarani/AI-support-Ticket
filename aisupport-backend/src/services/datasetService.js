const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const DATASET_DIR_NAMES = ['data', 'dataset', 'uploads', 'sample', 'public'];
const DATASET_FILE_EXTENSIONS = new Set(['.csv', '.json']);
const MAX_FILES = 25;
const MAX_RECORDS_PER_FILE = 1000;
const MAX_CONTEXT_RECORDS = 8;
const MAX_AGENT_CONTEXT_RECORDS = 12;

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const backendRoot = path.resolve(__dirname, '..', '..');
const quickSightDatasetDir = path.join(backendRoot, 'data', 'quicksight-datasets');

const quickSightDatasetFiles = {
  support_agent: 'support_agent_tickets_200.csv',
  team_manager: 'team_manager_performance_200.csv',
  business_executive: 'business_executive_insights_200.csv',
  system_admin: 'system_admin_activity_200.csv',
  customer: 'customer_portal_activity_200.csv',
};

const candidateDirs = [
  path.join(backendRoot, 'data'),
  ...DATASET_DIR_NAMES.map((dir) => path.join(repoRoot, dir)),
  ...DATASET_DIR_NAMES.map((dir) => path.join(backendRoot, dir)),
  path.join(repoRoot, 'src', 'data'),
  path.join(backendRoot, 'src', 'data'),
  path.join(repoRoot, 'aisupport-frontend', 'src', 'data'),
  path.join(repoRoot, 'aisupport-backend', 'src', 'data'),
];

const supportedFields = [
  'ticket_id',
  'customer_name',
  'issue_category',
  'category',
  'ticket_description',
  'issue_description',
  'priority',
  'sentiment',
  'status',
  'assigned_team',
  'created_date',
  'ticket_created_date',
  'resolution_time_hours',
  'ai_summary',
  'ai_root_cause',
  'ai_suggested_resolution',
  'resolution_notes',
  'product',
  'channel',
  'region',
  'sla_breached',
];

let cachedRecords;
let cachedQuickSightDatasets;
let cachedAgentTrainingRecords;

const listDatasetFiles = () => {
  const files = [];
  const visited = new Set();

  const visit = (dir) => {
    if (!fs.existsSync(dir) || visited.has(dir) || files.length >= MAX_FILES) return;
    visited.add(dir);

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (DATASET_FILE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }

      if (files.length >= MAX_FILES) break;
    }
  };

  candidateDirs.forEach(visit);
  return files;
};

const normalizeJsonRecords = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    for (const key of ['tickets', 'data', 'records', 'items']) {
      if (Array.isArray(value[key])) return value[key];
    }
    return [value];
  }
  return [];
};

const loadFileRecords = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.json') {
    return normalizeJsonRecords(JSON.parse(raw));
  }

  if (ext === '.csv') {
    return parse(raw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }

  return [];
};

const normalizeRecord = (record, sourceFile) => {
  const normalized = { source_file: path.relative(repoRoot, sourceFile) };
  for (const field of supportedFields) {
    if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
      normalized[field] = String(record[field]);
    }
  }

  if (!normalized.issue_category && normalized.category) normalized.issue_category = normalized.category;
  if (!normalized.ticket_description && normalized.issue_description) normalized.ticket_description = normalized.issue_description;
  if (!normalized.created_date && normalized.ticket_created_date) normalized.created_date = normalized.ticket_created_date;
  if (!normalized.ai_summary && normalized.issue_description) normalized.ai_summary = normalized.issue_description;
  if (!normalized.ai_suggested_resolution && normalized.resolution_notes) normalized.ai_suggested_resolution = normalized.resolution_notes;

  return normalized;
};

const loadDatasetRecords = () => {
  if (cachedRecords) return cachedRecords;

  const records = [];
  for (const file of listDatasetFiles()) {
    try {
      const fileRecords = loadFileRecords(file)
        .slice(0, MAX_RECORDS_PER_FILE)
        .filter((record) => record && typeof record === 'object')
        .map((record) => normalizeRecord(record, file));
      records.push(...fileRecords);
    } catch {
      // Skip malformed local datasets without exposing file contents in logs.
    }
  }

  cachedRecords = records;
  return cachedRecords;
};

const readDemoJson = (fileName, fallback) => {
  try {
    const filePath = path.join(backendRoot, 'data', fileName);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, ''));
  } catch {
    return fallback;
  }
};

const getDemoTickets = () => readDemoJson('demoTickets.json', loadDatasetRecords());
const getDemoUsers = () => readDemoJson('demoUsers.json', []);
const getDemoAnalytics = () => readDemoJson('demoAnalytics.json', {});
const getDemoKnowledgeBase = () => readDemoJson('demoKnowledgeBase.json', []);
const getDemoNotifications = () => readDemoJson('demoNotifications.json', []);
const getDemoReports = () => readDemoJson('demoReports.json', []);

const getQuickSightDatasets = () => {
  if (cachedQuickSightDatasets) return cachedQuickSightDatasets;

  cachedQuickSightDatasets = Object.entries(quickSightDatasetFiles).reduce((acc, [role, fileName]) => {
    try {
      const filePath = path.join(quickSightDatasetDir, fileName);
      acc[role] = loadFileRecords(filePath).slice(0, 200);
    } catch {
      acc[role] = [];
    }
    return acc;
  }, {});

  return cachedQuickSightDatasets;
};

const getQuickSightDataset = (role = 'support_agent') => getQuickSightDatasets()[role] || [];

const getMongoTickets = async () => {
  try {
    const Ticket = require('../models/Ticket');
    return await Ticket.find({})
      .sort({ ticket_created_date: -1, createdAt: -1 })
      .limit(1000)
      .maxTimeMS(8000)
      .lean();
  } catch {
    return [];
  }
};

const normalizeTicketForDataset = (ticket) => ({
  ...ticket,
  ticket_id: ticket.ticket_id || ticket.ticketId,
  customer_name: ticket.customer_name || ticket.customer?.name || 'Customer',
  customer_email: ticket.customer_email || ticket.customer?.email || '',
  issue_category: ticket.issue_category || ticket.category || 'Bug Report',
  ticket_description: ticket.ticket_description || ticket.description || ticket.subject || '',
  ai_summary: ticket.ai_summary || ticket.aiSummary || ticket.ticket_description || ticket.description || ticket.subject || '',
  ai_root_cause: ticket.ai_root_cause || ticket.aiRootCause || '',
  ai_suggested_resolution: ticket.ai_suggested_resolution || ticket.aiSuggestedReply || ticket.resolution_summary || '',
  ai_sentiment: ticket.ai_sentiment || ticket.sentiment || 'Neutral',
  tags: Array.isArray(ticket.tags) ? ticket.tags : [],
});

const getPrimaryTickets = async () => {
  const mongoTickets = await getMongoTickets();
  if (mongoTickets.length) return mongoTickets.map(normalizeTicketForDataset);
  return getDemoTickets();
};

const tokenize = (text) => String(text || '')
  .toLowerCase()
  .split(/[^a-z0-9]+/)
  .filter((token) => token.length >= 3);

const compactValue = (value) => {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value)) return value.map(compactValue).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    return Object.entries(value)
      .slice(0, 12)
      .map(([key, item]) => `${key}: ${compactValue(item)}`)
      .filter((line) => !line.endsWith(': '))
      .join('; ');
  }
  return String(value).replace(/\s+/g, ' ').trim();
};

const recordSearchText = (record) => Object.entries(record || {})
  .filter(([key]) => !String(key).startsWith('_'))
  .map(([key, value]) => `${key} ${compactValue(value)}`)
  .join(' ')
  .toLowerCase();

const scoreRecord = (record, queryTokens) => {
  const searchable = recordSearchText(record);

  return queryTokens.reduce((score, token) => (
    searchable.includes(token) ? score + 1 : score
  ), 0);
};

const scoreTrainingRecord = ({ record, role, queryTokens }) => {
  const searchable = recordSearchText(record);
  const roleScore = record.role === role || record.dataset_role === role ? 4 : 0;
  const exactTicketScore = queryTokens.some((token) => String(record.ticket_id || '').toLowerCase().includes(token)) ? 8 : 0;
  const tokenScore = queryTokens.reduce((score, token) => {
    if (!searchable.includes(token)) return score;
    return score + (String(record.ticket_id || '').toLowerCase().includes(token) ? 4 : 1);
  }, 0);
  return roleScore + exactTicketScore + tokenScore;
};

const formatRecord = (record) => {
  const lines = supportedFields
    .filter((field) => record[field])
    .map((field) => `${field}: ${record[field]}`);
  return `- ${lines.join('; ')}`;
};

const formatTrainingRecord = (record) => {
  const preferredKeys = [
    'dataset_source',
    'dataset_type',
    'dataset_role',
    'ticket_id',
    'customer_name',
    'issue_category',
    'priority',
    'status',
    'agent_name',
    'team',
    'region',
    'product',
    'title',
    'question',
    'answer',
    'ticket_description',
    'ai_summary',
    'ai_root_cause',
    'ai_suggested_resolution',
    'next_best_action',
    'action_recommendation',
    'revenue_risk_usd',
    'churn_risk_customers',
    'sla_breached_tickets',
    'open_tickets',
    'resolved_tickets',
  ];
  const entries = preferredKeys
    .filter((key) => record[key] !== undefined && record[key] !== null && record[key] !== '')
    .map((key) => `${key}: ${compactValue(record[key])}`);

  const fallback = Object.entries(record)
    .filter(([key, value]) => !preferredKeys.includes(key) && !String(key).startsWith('_') && compactValue(value))
    .slice(0, 8)
    .map(([key, value]) => `${key}: ${compactValue(value)}`);

  return `- ${[...entries, ...fallback].slice(0, 18).join('; ')}`;
};

const withDatasetMeta = (records, meta) => records
  .filter((record) => record && typeof record === 'object')
  .map((record) => ({ ...record, ...meta }));

const flattenAnalyticsRecords = (value, prefix = 'analytics') => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenAnalyticsRecords(item, `${prefix}_${index + 1}`));
  }
  if (!value || typeof value !== 'object') return [];

  const nested = [];
  const flat = {};
  for (const [key, item] of Object.entries(value)) {
    if (Array.isArray(item) || (item && typeof item === 'object')) {
      nested.push(...flattenAnalyticsRecords(item, `${prefix}_${key}`));
    } else {
      flat[key] = item;
    }
  }

  return Object.keys(flat).length
    ? [{ dataset_source: 'demoAnalytics.json', dataset_type: prefix, ...flat }, ...nested]
    : nested;
};

const loadAgentTrainingRecords = async () => {
  if (cachedAgentTrainingRecords) return cachedAgentTrainingRecords;

  const primaryTickets = await getPrimaryTickets();
  const quickSightRecords = Object.entries(getQuickSightDatasets()).flatMap(([role, rows]) => (
    withDatasetMeta(rows, {
      dataset_source: quickSightDatasetFiles[role],
      dataset_type: 'quicksight_dashboard',
      dataset_role: role,
    })
  ));

  cachedAgentTrainingRecords = [
    ...withDatasetMeta(primaryTickets, { dataset_source: 'MongoDB/demoTickets', dataset_type: 'tickets' }),
    ...quickSightRecords,
    ...withDatasetMeta(getDemoKnowledgeBase(), { dataset_source: 'demoKnowledgeBase.json', dataset_type: 'knowledge_base' }),
    ...withDatasetMeta(getDemoUsers(), { dataset_source: 'demoUsers.json', dataset_type: 'users' }),
    ...withDatasetMeta(getDemoNotifications(), { dataset_source: 'demoNotifications.json', dataset_type: 'notifications' }),
    ...withDatasetMeta(getDemoReports(), { dataset_source: 'demoReports.json', dataset_type: 'reports' }),
    ...flattenAnalyticsRecords(getDemoAnalytics()),
  ];

  return cachedAgentTrainingRecords;
};

const getRelevantAgentTrainingContextAsync = async ({ role = 'support_agent', message = '', limit = MAX_AGENT_CONTEXT_RECORDS } = {}) => {
  const records = await loadAgentTrainingRecords();
  if (!records.length) return '';

  const queryTokens = tokenize(`${role} ${message}`);
  const ranked = records
    .map((record) => ({ record, score: scoreTrainingRecord({ record, role, queryTokens }) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ record }) => record);

  const matches = ranked.length
    ? ranked
    : records.filter((record) => record.dataset_role === role || record.role === role).slice(0, Math.min(5, limit));

  if (!matches.length) return '';

  return [
    'Enterprise support dataset grounding:',
    'Use this evidence as the source of truth. If the evidence is insufficient, say what is missing. Do not invent metrics.',
    ...matches.map(formatTrainingRecord),
  ].join('\n');
};

const getRelevantTicketContext = (message) => {
  const records = loadDatasetRecords();
  if (!records.length) return '';

  const queryTokens = tokenize(message);
  const ranked = records
    .map((record) => ({ record, score: scoreRecord(record, queryTokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CONTEXT_RECORDS)
    .map(({ record }) => record);

  const matches = ranked.length ? ranked : records.slice(0, Math.min(3, records.length));
  return [
    'Relevant local ticket dataset context:',
    ...matches.map(formatRecord),
  ].join('\n');
};

const getRelevantTicketContextAsync = async (message) => {
  const records = await getPrimaryTickets();
  if (!records.length) return '';

  const queryTokens = tokenize(message);
  const ranked = records
    .map((record) => ({ record, score: scoreRecord(record, queryTokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CONTEXT_RECORDS)
    .map(({ record }) => record);

  const matches = ranked.length ? ranked : records.slice(0, Math.min(3, records.length));
  return [
    'Relevant support ticket context:',
    ...matches.map(formatRecord),
  ].join('\n');
};

module.exports = {
  getDemoAnalytics,
  getDemoKnowledgeBase,
  getDemoNotifications,
  getDemoReports,
  getDemoTickets,
  getDemoUsers,
  getMongoTickets,
  getPrimaryTickets,
  getQuickSightDataset,
  getQuickSightDatasets,
  getRelevantAgentTrainingContextAsync,
  getRelevantTicketContext,
  getRelevantTicketContextAsync,
  loadDatasetRecords,
};
