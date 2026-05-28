const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { normalizeDatasetRow } = require('../utils/normalizeDatasetRow');
const { validateDatasetFile } = require('../utils/validateDatasets');

const backendRoot = path.resolve(__dirname, '..', '..');
const dataRoot = path.join(backendRoot, 'data');
const rawDir = path.join(dataRoot, 'raw');
const knowledgeBaseDir = path.join(dataRoot, 'knowledge-base');
const productProofDir = path.join(dataRoot, 'product-proof');
const manifestDir = path.join(dataRoot, 'manifest');

const MAX_DATASET_ROWS = Number(process.env.MAX_DATASET_ROWS || 5000);

const datasetPaths = {
  supportTickets: path.join(rawDir, 'support_tickets_enterprise.csv'),
  customerFeedback: path.join(rawDir, 'customer_feedback_sentiment.csv'),
  ordersProducts: path.join(rawDir, 'enterprise_orders_products.csv'),
  slaAnalytics: path.join(rawDir, 'sla_operations_analytics.csv'),
  knowledgeBase: path.join(rawDir, 'enterprise_knowledge_base.csv'),
  productProof: path.join(rawDir, 'product_image_analysis.csv'),
  agentWorkflows: path.join(rawDir, 'ai_agent_workflows.csv'),
  knowledgeBaseDocs: {
    dataDictionary: path.join(knowledgeBaseDir, 'DATA_DICTIONARY_AND_GUIDE.md'),
    quickStartGuide: path.join(knowledgeBaseDir, 'QUICK_START_GUIDE.md'),
    readme: path.join(knowledgeBaseDir, 'README.md'),
  },
  manifest: path.join(manifestDir, 'MANIFEST.txt'),
};

const definitions = {
  supportTickets: { datasetKey: 'support_tickets_enterprise', friendlyName: 'Support Tickets', filePath: datasetPaths.supportTickets },
  customerFeedback: { datasetKey: 'customer_feedback_sentiment', friendlyName: 'Customer Feedback Sentiment', filePath: datasetPaths.customerFeedback },
  ordersProducts: { datasetKey: 'enterprise_orders_products', friendlyName: 'Orders and Products', filePath: datasetPaths.ordersProducts },
  slaAnalytics: { datasetKey: 'sla_operations_analytics', friendlyName: 'SLA Operations Analytics', filePath: datasetPaths.slaAnalytics },
  knowledgeBase: { datasetKey: 'enterprise_knowledge_base', friendlyName: 'Enterprise Knowledge Base', filePath: datasetPaths.knowledgeBase },
  productProof: { datasetKey: 'product_image_analysis', friendlyName: 'Product Image Analysis', filePath: datasetPaths.productProof },
  agentWorkflows: { datasetKey: 'ai_agent_workflows', friendlyName: 'AI Agent Workflows', filePath: datasetPaths.agentWorkflows },
};

const cache = {};
const loading = {};

const logDataset = (message, meta = {}) => {
  console.info(`[DATASET_REGISTRY] ${message} ${JSON.stringify({ timestamp: new Date().toISOString(), ...meta })}`);
};

const emptyDataset = (definition, available = false) => ({
  available,
  filePath: definition.filePath,
  datasetKey: definition.datasetKey,
  friendlyName: definition.friendlyName,
  totalRows: 0,
  validRows: 0,
  invalidRows: 0,
  rows: [],
  validation: { valid: available, errors: [] },
  loadedAt: null,
  loadDurationMs: 0,
});

const parseCsvFile = async (filePath, limit = MAX_DATASET_ROWS) => new Promise((resolve, reject) => {
  const rows = [];
  let skippedRows = 0;
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
    skip_records_with_error: true,
  });

  parser.on('readable', () => {
    let row;
    while ((row = parser.read()) !== null) {
      if (rows.length < limit) rows.push(normalizeDatasetRow(row));
      else skippedRows += 1;
    }
  });
  parser.on('error', reject);
  parser.on('end', () => resolve({ rows, skippedRows }));

  fs.createReadStream(filePath, { encoding: 'utf-8' }).pipe(parser);
});

const loadCsvDataset = async (definition, options = {}) => {
  const startedAt = Date.now();
  const limit = Number(options.limit || MAX_DATASET_ROWS);
  const available = fs.existsSync(definition.filePath);
  logDataset('Before dataset load', { dataset: definition.datasetKey, available, limit });

  if (!available) return emptyDataset(definition, false);

  try {
    const { rows, skippedRows } = await parseCsvFile(definition.filePath, limit);
    const validation = validateDatasetFile(definition.datasetKey, rows);
    const dataset = {
      available: true,
      filePath: definition.filePath,
      datasetKey: definition.datasetKey,
      friendlyName: definition.friendlyName,
      totalRows: rows.length + skippedRows,
      validRows: validation.valid ? rows.length : 0,
      invalidRows: validation.valid ? skippedRows : rows.length + skippedRows,
      rows,
      validation,
      skippedRows,
      loadedAt: new Date().toISOString(),
      loadDurationMs: Date.now() - startedAt,
    };
    logDataset('After dataset load', { dataset: definition.datasetKey, rows: dataset.totalRows, cachedRows: rows.length, durationMs: dataset.loadDurationMs });
    return dataset;
  } catch (error) {
    logDataset('Dataset load failed; returning empty fallback', { dataset: definition.datasetKey, errorName: error?.name });
    return {
      ...emptyDataset(definition, true),
      validation: { valid: false, errors: ['Dataset could not be parsed safely.'] },
      loadDurationMs: Date.now() - startedAt,
    };
  }
};

const loadDatasetIfNeeded = async (datasetName, options = {}) => {
  const definition = definitions[datasetName];
  if (!definition) throw new Error(`Unknown dataset: ${datasetName}`);
  if (!options.refresh && cache[datasetName]) return cache[datasetName];
  if (!options.refresh && loading[datasetName]) return loading[datasetName];

  loading[datasetName] = loadCsvDataset(definition, options)
    .then((dataset) => {
      cache[datasetName] = dataset;
      delete loading[datasetName];
      return dataset;
    })
    .catch((error) => {
      delete loading[datasetName];
      throw error;
    });

  return loading[datasetName];
};

const getCachedDataset = (datasetName) => cache[datasetName] || emptyDataset(definitions[datasetName]);

const clearDatasetCache = (datasetName) => {
  if (datasetName) delete cache[datasetName];
  else Object.keys(cache).forEach((key) => delete cache[key]);
};

const getDatasetStats = () => {
  const items = Object.entries(definitions).map(([key, definition]) => {
    const item = cache[key];
    return {
      key,
      datasetName: definition.friendlyName,
      datasetKey: definition.datasetKey,
      available: fs.existsSync(definition.filePath),
      cached: Boolean(item),
      loading: Boolean(loading[key]),
      totalRows: item?.totalRows || 0,
      cachedRows: item?.rows?.length || 0,
      skippedRows: item?.skippedRows || 0,
      loadDurationMs: item?.loadDurationMs || 0,
      loadedAt: item?.loadedAt || null,
    };
  });

  return {
    success: true,
    knownDatasets: items.length,
    cachedDatasets: items.filter((item) => item.cached).length,
    loading: items.some((item) => item.loading),
    datasets: items,
    knowledgeBaseDocs: {
      dataDictionary: fs.existsSync(datasetPaths.knowledgeBaseDocs.dataDictionary),
      quickStartGuide: fs.existsSync(datasetPaths.knowledgeBaseDocs.quickStartGuide),
      readme: fs.existsSync(datasetPaths.knowledgeBaseDocs.readme),
    },
    manifestAvailable: fs.existsSync(datasetPaths.manifest),
  };
};

const getDatasetHealth = () => {
  const stats = getDatasetStats();
  return {
    success: true,
    datasets: stats.datasets.map((item) => ({
      datasetName: item.datasetName,
      key: item.datasetKey,
      cacheKey: item.key,
      available: item.available,
      cached: item.cached,
      loading: item.loading,
      totalRows: item.totalRows,
      validRows: cache[item.key]?.validRows || 0,
      invalidRows: cache[item.key]?.invalidRows || 0,
      validation: cache[item.key]?.validation || { valid: item.available, errors: [] },
      filePath: definitions[item.key].filePath,
      loadDurationMs: item.loadDurationMs,
    })),
    knowledgeBaseDocs: stats.knowledgeBaseDocs,
    manifestAvailable: stats.manifestAvailable,
  };
};

const loadAllDatasets = async (options = {}) => {
  const entries = await Promise.all(Object.keys(definitions).map((key) => loadDatasetIfNeeded(key, options)));
  return Object.keys(definitions).reduce((acc, key, index) => {
    acc[key] = entries[index];
    return acc;
  }, cache);
};

const getSupportTickets = () => getCachedDataset('supportTickets');
const getCustomerFeedback = () => getCachedDataset('customerFeedback');
const getOrdersProducts = () => getCachedDataset('ordersProducts');
const getSlaAnalytics = () => getCachedDataset('slaAnalytics');
const getKnowledgeBase = () => getCachedDataset('knowledgeBase');
const getProductProofData = () => getCachedDataset('productProof');
const getAgentWorkflows = () => getCachedDataset('agentWorkflows');

module.exports = {
  clearDatasetCache,
  datasetPaths,
  getAgentWorkflows,
  getCachedDataset,
  getCustomerFeedback,
  getDatasetHealth,
  getDatasetStats,
  getKnowledgeBase,
  getOrdersProducts,
  getProductProofData,
  getSlaAnalytics,
  getSupportTickets,
  loadAllDatasets,
  loadDatasetIfNeeded,
};
