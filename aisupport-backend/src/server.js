const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const timeout = require('connect-timeout');
require('dotenv').config();
const { connectDB, getDBStatus } = require('./config/db');
const { getDynamoTables, isDynamoDbProvider, scanTable } = require('./services/dynamoDbService');
const { invokeBedrock } = require('./services/bedrockService');
const { getDatasetStats } = require('./services/datasetRegistryService');
const { getAnalyticsCacheStats } = require('./services/analyticsDatasetService');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(timeout('20s', { respond: false }));
app.use((req, res, next) => {
  if (!req.timedout) return next();
  return res.status(503).json({
    success: false,
    timeout: true,
    message: 'Request timed out',
  });
});
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'AI Support Ticket Intelligence API',
    status: 'OK',
    endpoints: {
      health: '/api/health',
      chat: '/api/chat',
      tickets: '/api/tickets',
      analytics: '/api/analytics/summary',
      users: '/api/users',
      notifications: '/api/notifications',
      reports: '/api/reports/export',
      datasets: '/api/datasets/uploads',
    },
  });
});

app.get('/api/health', (req, res) => {
  const database = getDBStatus();
  const provider = isDynamoDbProvider() ? 'dynamodb' : 'mongodb';
  const datasetStats = getDatasetStats();
  res.json({
    success: true,
    status: provider === 'dynamodb' || database.state === 'connected' ? 'OK' : 'DEGRADED',
    server: 'ok',
    bedrock: process.env.AWS_REGION ? 'ok' : 'unknown',
    datasets: datasetStats.knownDatasets > 0 ? 'ok' : 'unknown',
    dynamodb: provider === 'dynamodb' ? 'ok' : 'fallback',
    analytics: 'ok',
    cache: datasetStats.loading ? 'loading' : 'ok',
    database: {
      provider,
      mongodb: database,
      dynamodb: provider === 'dynamodb' ? {
        region: process.env.AWS_REGION || 'us-east-1',
        tables: getDynamoTables(),
      } : null,
    },
    cacheStatus: datasetStats,
    analyticsCache: getAnalyticsCacheStats(),
    timestamp: new Date(),
  });
});

app.get('/api/bedrock-test', async (req, res) => {
  const startedAt = Date.now();
  const response = await invokeBedrock('Analyze support ticket: payment deducted but order failed');
  res.json({
    success: true,
    prompt: 'Analyze support ticket: payment deducted but order failed',
    response,
    durationMs: Date.now() - startedAt,
  });
});

app.get('/api/debug/datasets', (req, res) => {
  res.json({ success: true, service: 'datasets', stats: getDatasetStats(), timestamp: new Date() });
});

app.get('/api/debug/cache', (req, res) => {
  res.json({ success: true, service: 'cache', datasets: getDatasetStats(), analytics: getAnalyticsCacheStats(), timestamp: new Date() });
});

app.get('/api/debug/bedrock', async (req, res) => {
  const startedAt = Date.now();
  const response = await invokeBedrock('Analyze support ticket: payment deducted but order failed');
  res.json({ success: true, service: 'bedrock', durationMs: Date.now() - startedAt, response });
});

app.get('/api/debug/dynamodb', async (req, res) => {
  const startedAt = Date.now();
  let sample = null;
  if (isDynamoDbProvider()) {
    try {
      sample = { tickets: (await scanTable(getDynamoTables().tickets, { Limit: 1, maxPages: 1 })).length };
    } catch {
      sample = { unavailable: true };
    }
  }
  res.json({
    success: true,
    service: 'dynamodb',
    providerEnabled: isDynamoDbProvider(),
    tables: getDynamoTables(),
    sample,
    durationMs: Date.now() - startedAt,
  });
});

app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/customer',      require('./routes/customer.routes'));
app.use('/api/tickets',       require('./routes/ticket.routes'));
app.use('/api/users',         require('./routes/user.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/analytics',     require('./routes/analytics.routes'));
app.use('/api/reports',       require('./routes/report.routes'));
app.use('/api/ai',            require('./routes/ai.routes'));
app.use('/api/pipeline',      require('./routes/pipeline.routes'));
app.use('/api/chat',          require('./routes/chat.routes'));
app.use('/api/quicksight',    require('./routes/quicksight.routes'));
app.use('/api/datasets', require('./routes/datasetRoutes'));
app.use('/api/admin/datasets', require('./routes/datasetRoutes'));
app.use('/api/enterprise', require('./routes/enterprise.routes'));
app.use('/api/product-proof', require('./routes/productProof.routes'));

app.use('/api', (req, res) => {
  if (req.timedout) return;
  res.json({
    success: true,
    source: 'support_fallback',
    message: 'This endpoint is available. Use /api/health, /api/chat, /api/tickets, /api/analytics/summary, /api/users, /api/notifications, or /api/reports/export.',
  });
});

app.use((req, res, next) => {
  if (!req.timedout) return next();
  if (res.headersSent) return undefined;
  return res.status(503).json({
    success: false,
    timeout: true,
    message: 'Request timed out',
  });
});

app.use((err, req, res, next) => {
  if (req.timedout) {
    if (res.headersSent) return;
    return res.status(503).json({
      success: false,
      timeout: true,
      message: 'Request timed out',
    });
  }
  if (process.env.NODE_ENV === 'development') {
    console.error('Request recovered with fallback response.');
  }
  res.json({
    success: true,
    source: 'support_fallback',
    message: 'The live service is temporarily unavailable. Showing the best available response.',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const connectWithRetry = (label = 'MongoDB connected') => {
  connectDB()
    .then(() => {
      console.log(label);
    })
    .catch((err) => {
      console.error('DB connection failed; continuing with local support data.');
      setTimeout(() => connectWithRetry(label), 10000);
    });
};

if (isDynamoDbProvider()) {
  console.log('DynamoDB provider enabled');
  connectWithRetry('MongoDB fallback connected');
} else {
  connectWithRetry();
}

console.log('[DATASET_REGISTRY] Startup preload disabled; datasets will load lazily on first request.');
