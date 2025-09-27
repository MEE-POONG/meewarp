const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');

const config = require('./config/env');
const warpRoutes = require('./routes/warpRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { startTransactionPolling } = require('./jobs/transactionPolling');

const app = express();

function ensureRequiredConfig() {
  const missing = [];

  if (!config.auth.jwtSecret) {
    missing.push('ADMIN_JWT_SECRET');
  }
  if (!config.adminCredentials.email) {
    missing.push('ADMIN_EMAIL');
  }
  if (!config.adminCredentials.password) {
    missing.push('ADMIN_PASSWORD');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

ensureRequiredConfig();

// Enable CORS for all routes
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:7064',
    'https://meewarp.me-prompt-technology.com',
    process.env.PUBLIC_BASE_URL || 'http://localhost:5173'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(morgan('combined'));
app.use((req, res, next) => {
  if (req.path === '/api/v1/payments/webhook') {
    return express.raw({ type: 'application/json' })(req, res, next);
  }
  return express.json({ limit: '10mb' })(req, res, next);
});
// Serve uploaded images
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

if (config.rateLimit.enabled) {
  const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', apiLimiter);
}
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', warpRoutes);
app.use('/api/v1', transactionRoutes);
app.use('/api/v1', adminRoutes);

async function start() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    app.listen(config.port, () => {
      console.log(`Warp server listening on port ${config.port}`);
    });

    startTransactionPolling();
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
