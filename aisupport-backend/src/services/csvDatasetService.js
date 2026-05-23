const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const backendRoot = path.resolve(__dirname, '..', '..');
const dataDir = path.join(backendRoot, 'data');

const roleDatasets = {
  support_agent: 'support_agent_tickets_200_improved.csv',
  customer: 'support_agent_tickets_200_improved.csv',
  team_manager: 'team_manager_performance_200_improved.csv',
  business_executive: 'business_executive_insights_200_improved.csv',
};

const requiredFields = {
  support_agent: ['ticket_id', 'priority', 'status', 'customer_name', 'issue_category'],
  customer: ['ticket_id', 'priority', 'status', 'customer_name', 'issue_category'],
  team_manager: ['team', 'agent_name', 'open_tickets', 'sla_breached_tickets'],
  business_executive: ['region', 'product', 'revenue_risk_usd', 'churn_risk_customers'],
};

let cache = {};

const normalizeKey = (key) => String(key || '')
  .trim()
  .replace(/^\uFEFF/, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const normalizeValue = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  if (/^(true|false)$/i.test(text)) return /^true$/i.test(text);
  const compact = text.replace(/,/g, '');
  if (compact !== '' && !Number.isNaN(Number(compact)) && /^-?\d+(\.\d+)?$/.test(compact)) return Number(compact);
  return text;
};

const normalizeRow = (row, index, sourceDataset) => Object.entries(row).reduce((acc, [key, value]) => {
  acc[normalizeKey(key)] = normalizeValue(value);
  acc._rowNumber = index + 1;
  acc._sourceDataset = sourceDataset;
  return acc;
}, {});

const validateRows = (role, rows) => {
  const required = requiredFields[role] || [];
  const first = rows[0] || {};
  const missing = required.filter((field) => !(field in first));
  return { valid: missing.length === 0, missing };
};

const readCsvDataset = (fileName, role) => {
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) return { rows: [], sourceDataset: fileName, available: false, validation: { valid: false, missing: [] } };
  const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const parsed = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  const rows = parsed.map((row, index) => normalizeRow(row, index, fileName));
  return { rows, sourceDataset: fileName, available: true, validation: validateRows(role, rows) };
};

const getDatabaseRows = async (role) => {
  try {
    if (role === 'team_manager') {
      const Model = require('../models/TeamManagerPerformance');
      const records = await Model.find({}).sort({ createdAt: -1 }).limit(1000).maxTimeMS(4000).lean();
      return records.map((record, index) => normalizeRow(record.data || record, index, 'database:team_manager_performance'));
    }
    if (role === 'business_executive') {
      const Model = require('../models/BusinessExecutiveInsight');
      const records = await Model.find({}).sort({ createdAt: -1 }).limit(1000).maxTimeMS(4000).lean();
      return records.map((record, index) => normalizeRow(record.data || record, index, 'database:business_executive_insights'));
    }
    const Ticket = require('../models/Ticket');
    const records = await Ticket.find({}).sort({ createdAt: -1 }).limit(1000).maxTimeMS(4000).lean();
    return records.map((record, index) => normalizeRow(record, index, 'database:tickets'));
  } catch {
    return [];
  }
};

const loadRoleDataset = async (role = 'support_agent', { refresh = false } = {}) => {
  const normalizedRole = roleDatasets[role] ? role : 'support_agent';
  if (!refresh && cache[normalizedRole]) return cache[normalizedRole];

  const dbRows = await getDatabaseRows(normalizedRole);
  if (dbRows.length) {
    cache[normalizedRole] = {
      rows: dbRows,
      sourceDataset: dbRows[0]._sourceDataset,
      sourceType: 'database',
      available: true,
      validation: validateRows(normalizedRole, dbRows),
    };
    return cache[normalizedRole];
  }

  const csv = readCsvDataset(roleDatasets[normalizedRole], normalizedRole);
  cache[normalizedRole] = { ...csv, sourceType: 'csv' };
  return cache[normalizedRole];
};

const preloadDatasets = async () => {
  await Promise.all(Object.keys(roleDatasets).map((role) => loadRoleDataset(role, { refresh: true })));
};

module.exports = {
  loadRoleDataset,
  normalizeKey,
  normalizeRow,
  preloadDatasets,
  roleDatasets,
};
