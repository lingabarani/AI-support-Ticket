const { DynamoDBClient, BatchWriteItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { loadAllDatasets, getSupportTickets, getCustomerFeedback, getOrdersProducts, getSlaAnalytics, getKnowledgeBase, getProductProofData, getAgentWorkflows } = require('./datasetRegistryService');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

const TABLE_MAP = {
  support_tickets_enterprise: 'Tickets',
  customer_feedback_sentiment: 'CustomerFeedback',
  enterprise_orders_products: 'OrdersProducts',
  sla_operations_analytics: 'SLAEvents',
  enterprise_knowledge_base: 'KnowledgeBaseRecords',
  product_image_analysis: 'ProductProofAnalysis',
  ai_agent_workflows: 'AgentWorkflows',
};

const DATASET_KEY_MAP = {
  supportTickets: 'support_tickets_enterprise',
  customerFeedback: 'customer_feedback_sentiment',
  ordersProducts: 'enterprise_orders_products',
  slaAnalytics: 'sla_operations_analytics',
  knowledgeBase: 'enterprise_knowledge_base',
  productProof: 'product_image_analysis',
  agentWorkflows: 'ai_agent_workflows',
};

const createBatchItems = (tableName, rows, primaryKeyFields) => {
  const uniqueKeys = new Set();
  const items = [];

  rows.forEach((row) => {
    const primaryKeyValues = primaryKeyFields.map((field) => String(row[field] || '').trim());
    if (!primaryKeyValues.some(Boolean)) return;
    const primaryKey = primaryKeyValues.join('|');
    if (uniqueKeys.has(primaryKey)) return;
    uniqueKeys.add(primaryKey);
    items.push({ PutRequest: { Item: marshall({ ...row, dataset_source: tableName, imported_at: new Date().toISOString() }) } });
  });

  return items;
};

const writeBatch = async (tableName, requests) => {
  const batches = [];
  for (let i = 0; i < requests.length; i += 25) {
    batches.push(requests.slice(i, i + 25));
  }

  let insertedRows = 0;
  for (const batch of batches) {
    const command = new BatchWriteItemCommand({ RequestItems: { [tableName]: batch } });
    await client.send(command);
    insertedRows += batch.length;
  }

  return insertedRows;
};

const importDataset = async (datasetKey, rows, primaryKeyFields) => {
  const tableName = TABLE_MAP[datasetKey];
  if (!tableName) {
    return { success: false, datasetKey, message: 'No DynamoDB table configured.' };
  }

  const uniqueRows = createBatchItems(tableName, rows, primaryKeyFields);
  const skippedRows = rows.length - uniqueRows.length;
  const insertedRows = uniqueRows.length ? await writeBatch(tableName, uniqueRows) : 0;

  return {
    success: true,
    datasetName: datasetKey,
    totalRows: rows.length,
    insertedRows,
    updatedRows: 0,
    skippedRows,
    errors: [],
  };
};

const importSupportTickets = async () => {
  await loadAllDatasets();
  const dataset = getSupportTickets();
  return importDataset(DATASET_KEY_MAP.supportTickets, dataset.rows, ['ticket_id', 'id']);
};

const importCustomerFeedback = async () => {
  await loadAllDatasets();
  const dataset = getCustomerFeedback();
  return importDataset(DATASET_KEY_MAP.customerFeedback, dataset.rows, ['customer_id', 'customer_email', 'feedback_id']);
};

const importOrdersProducts = async () => {
  await loadAllDatasets();
  const dataset = getOrdersProducts();
  return importDataset(DATASET_KEY_MAP.ordersProducts, dataset.rows, ['order_id', 'product_id']);
};

const importSlaAnalytics = async () => {
  await loadAllDatasets();
  const dataset = getSlaAnalytics();
  return importDataset(DATASET_KEY_MAP.slaAnalytics, dataset.rows, ['sla_event_id', 'ticket_id', 'team_name', 'assigned_team']);
};

const importKnowledgeBase = async () => {
  await loadAllDatasets();
  const dataset = getKnowledgeBase();
  return importDataset(DATASET_KEY_MAP.knowledgeBase, dataset.rows, ['issue_category', 'issue_subcategory', 'question']);
};

const importProductProof = async () => {
  await loadAllDatasets();
  const dataset = getProductProofData();
  return importDataset(DATASET_KEY_MAP.productProof, dataset.rows, ['analysis_id', 'image_id', 'product_id', 'ticket_id']);
};

const importAgentWorkflows = async () => {
  await loadAllDatasets();
  const dataset = getAgentWorkflows();
  return importDataset(DATASET_KEY_MAP.agentWorkflows, dataset.rows, ['workflow_id', 'ticket_id']);
};

const importAllDatasets = async () => {
  const results = await Promise.all([
    importSupportTickets(),
    importCustomerFeedback(),
    importOrdersProducts(),
    importSlaAnalytics(),
    importKnowledgeBase(),
    importProductProof(),
    importAgentWorkflows(),
  ]);

  return {
    success: true,
    imported: results,
  };
};

module.exports = {
  importSupportTickets,
  importCustomerFeedback,
  importOrdersProducts,
  importSlaAnalytics,
  importKnowledgeBase,
  importProductProof,
  importAgentWorkflows,
  importAllDatasets,
};
