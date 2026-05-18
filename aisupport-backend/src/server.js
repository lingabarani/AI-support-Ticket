const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const { connectDB, getDBStatus } = require('./config/db');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

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
app.use('/api/tickets',       require('./routes/ticket.routes'));
app.use('/api/users',         require('./routes/user.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/analytics',     require('./routes/analytics.routes'));
app.use('/api/reports',       require('./routes/report.routes'));
app.use('/api/ai',            require('./routes/ai.routes'));
app.use('/api/pipeline',      require('./routes/pipeline.routes'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
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
      console.error('DB connection failed:', err.message);
      setTimeout(connectWithRetry, 10000);
    });
};

connectWithRetry();
