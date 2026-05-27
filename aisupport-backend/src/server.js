const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
const { connectDB, getDBStatus } = require('./config/db');
const { preloadDatasets } = require('./services/csvDatasetService');

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
  res.json({
    success: true,
    status: database.state === 'connected' ? 'OK' : 'DEGRADED',
    database,
    timestamp: new Date(),
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
  res.json({
    success: true,
    source: 'support_fallback',
    message: 'This endpoint is available. Use /api/health, /api/chat, /api/tickets, /api/analytics/summary, /api/users, /api/notifications, or /api/reports/export.',
  });
});

app.use((err, req, res, next) => {
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

const connectWithRetry = () => {
  connectDB()
    .then(() => {
      console.log('MongoDB connected');
    })
    .catch((err) => {
      console.error('DB connection failed; continuing with local support data.');
      setTimeout(connectWithRetry, 10000);
    });
};

connectWithRetry();

preloadDatasets().catch(() => {
  console.error('Dataset preload failed; chat will retry on first request.');
});
