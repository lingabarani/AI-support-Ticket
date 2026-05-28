const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const region = process.env.AWS_REGION || 'us-east-1';
const client = new DynamoDBClient({ region });
const documentClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertClassInstanceToMap: true,
    removeUndefinedValues: true,
  },
});

const isDynamoDbProvider = () => String(process.env.DATABASE_PROVIDER || '').toLowerCase() === 'dynamodb';
const DYNAMO_TIMEOUT_MS = Number(process.env.DYNAMO_TIMEOUT_MS || 8000);
const DYNAMO_DEFAULT_LIMIT = Number(process.env.DYNAMO_DEFAULT_LIMIT || 50);
const DYNAMO_MAX_PAGES = Number(process.env.DYNAMO_MAX_PAGES || 1);

const logDynamo = (message, meta = {}) => {
  console.info(`[DYNAMODB_SERVICE] ${message} ${JSON.stringify({ timestamp: new Date().toISOString(), ...meta })}`);
};

const withTimeout = (promise, operation) => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`${operation} timed out`);
      error.name = 'TimeoutError';
      reject(error);
    }, DYNAMO_TIMEOUT_MS);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

const getDynamoTables = () => ({
  tickets: process.env.DDB_TICKETS_TABLE || process.env.DYNAMODB_TICKETS_TABLE || 'support-ticket-ai-linga-dev-tickets',
  aiResults: process.env.DDB_AI_RESULTS_TABLE || process.env.DYNAMODB_AI_RESULTS_TABLE || 'support-ticket-ai-linga-dev-ai-results',
});

const getDynamoKeys = () => ({
  tickets: process.env.DDB_TICKETS_KEY_FIELD || 'ticket_id',
  aiResults: process.env.DDB_AI_RESULTS_KEY_FIELD || 'result_id',
});

const sanitizeForDynamo = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeForDynamo(item))
      .filter((item) => item !== undefined);
  }
  if (typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, item]) => {
      const sanitized = sanitizeForDynamo(item);
      if (sanitized !== undefined) acc[key] = sanitized;
      return acc;
    }, {});
  }
  return value;
};

const putItem = async (tableName, item) => {
  const Item = sanitizeForDynamo(item);
  logDynamo('Before DynamoDB query', { operation: 'putItem', tableName });
  await withTimeout(documentClient.send(new PutCommand({ TableName: tableName, Item })), 'DynamoDB putItem');
  logDynamo('After DynamoDB query', { operation: 'putItem', tableName });
  return Item;
};

const getItem = async (tableName, key) => {
  logDynamo('Before DynamoDB query', { operation: 'getItem', tableName });
  const response = await withTimeout(documentClient.send(new GetCommand({
    TableName: tableName,
    Key: sanitizeForDynamo(key),
  })), 'DynamoDB getItem');
  logDynamo('After DynamoDB query', { operation: 'getItem', tableName, found: Boolean(response.Item) });
  return response.Item || null;
};

const scanTable = async (tableName, params = {}) => {
  const items = [];
  let ExclusiveStartKey;
  let page = 0;
  const limit = Math.min(Number(params.Limit || DYNAMO_DEFAULT_LIMIT), DYNAMO_DEFAULT_LIMIT);
  const maxPages = Math.max(1, Number(params.maxPages || DYNAMO_MAX_PAGES));
  const safeParams = { ...params };
  delete safeParams.maxPages;
  logDynamo('Before DynamoDB query', { operation: 'scanTable', tableName, limit, maxPages });
  do {
    const response = await withTimeout(documentClient.send(new ScanCommand({
      TableName: tableName,
      ...safeParams,
      Limit: limit,
      ExclusiveStartKey,
    })), 'DynamoDB scanTable');
    items.push(...(response.Items || []));
    ExclusiveStartKey = response.LastEvaluatedKey;
    page += 1;
  } while (ExclusiveStartKey && page < maxPages && items.length < limit * maxPages);
  logDynamo('After DynamoDB query', { operation: 'scanTable', tableName, rows: items.length, hasMore: Boolean(ExclusiveStartKey) });
  return items;
};

const queryTable = async (params) => {
  const items = [];
  let ExclusiveStartKey;
  let page = 0;
  const limit = Math.min(Number(params.Limit || DYNAMO_DEFAULT_LIMIT), DYNAMO_DEFAULT_LIMIT);
  const maxPages = Math.max(1, Number(params.maxPages || DYNAMO_MAX_PAGES));
  const safeParams = { ...params };
  delete safeParams.maxPages;
  logDynamo('Before DynamoDB query', { operation: 'queryTable', tableName: params.TableName, limit, maxPages });
  do {
    const response = await withTimeout(documentClient.send(new QueryCommand({
      ...safeParams,
      Limit: limit,
      ExclusiveStartKey,
    })), 'DynamoDB queryTable');
    items.push(...(response.Items || []));
    ExclusiveStartKey = response.LastEvaluatedKey;
    page += 1;
  } while (ExclusiveStartKey && page < maxPages && items.length < limit * maxPages);
  logDynamo('After DynamoDB query', { operation: 'queryTable', tableName: params.TableName, rows: items.length, hasMore: Boolean(ExclusiveStartKey) });
  return items;
};

const updateItem = async (tableName, key, updateData) => {
  const data = sanitizeForDynamo(updateData);
  const entries = Object.entries(data || {}).filter(([, value]) => value !== undefined);
  if (!entries.length) return getItem(tableName, key);

  const ExpressionAttributeNames = {};
  const ExpressionAttributeValues = {};
  const setExpressions = entries.map(([field, value], index) => {
    const nameToken = `#f${index}`;
    const valueToken = `:v${index}`;
    ExpressionAttributeNames[nameToken] = field;
    ExpressionAttributeValues[valueToken] = value;
    return `${nameToken} = ${valueToken}`;
  });

  logDynamo('Before DynamoDB query', { operation: 'updateItem', tableName });
  const response = await withTimeout(documentClient.send(new UpdateCommand({
    TableName: tableName,
    Key: sanitizeForDynamo(key),
    UpdateExpression: `SET ${setExpressions.join(', ')}`,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  })), 'DynamoDB updateItem');
  logDynamo('After DynamoDB query', { operation: 'updateItem', tableName });

  return response.Attributes || null;
};

const deleteItem = async (tableName, key) => {
  logDynamo('Before DynamoDB query', { operation: 'deleteItem', tableName });
  await withTimeout(documentClient.send(new DeleteCommand({
    TableName: tableName,
    Key: sanitizeForDynamo(key),
  })), 'DynamoDB deleteItem');
  logDynamo('After DynamoDB query', { operation: 'deleteItem', tableName });
  return { success: true };
};

module.exports = {
  deleteItem,
  documentClient,
  getDynamoKeys,
  getDynamoTables,
  getItem,
  isDynamoDbProvider,
  putItem,
  queryTable,
  sanitizeForDynamo,
  scanTable,
  updateItem,
};
