const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: process.env.SERVER_ENV_PATH || path.resolve(__dirname, '../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const config = {
  env: nodeEnv,
  port: parseInt(process.env.PORT || process.env.SERVER_PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/meewarp',
  rateLimit: {
    enabled:
      typeof process.env.RATE_LIMIT_ENABLED === 'string'
        ? process.env.RATE_LIMIT_ENABLED === 'true'
        : isProduction,
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || `${15 * 60 * 1000}`, 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  loginRateLimit: {
    enabled:
      typeof process.env.LOGIN_RATE_LIMIT_ENABLED === 'string'
        ? process.env.LOGIN_RATE_LIMIT_ENABLED === 'true'
        : isProduction,
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || `${5 * 60 * 1000}`, 10),
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '10', 10),
  },
  adminCredentials: {
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
  },
  auth: {
    jwtSecret: process.env.ADMIN_JWT_SECRET || '',
    tokenExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '1h',
  },
  chillpay: {
    merchantId: process.env.CHILLPAY_MERCHANT_ID || '',
    apiKey: process.env.CHILLPAY_API_KEY || '',
    secretKey: process.env.CHILLPAY_SECRET_KEY || '',
    paymentBaseUrl: process.env.CHILLPAY_PAYMENT_URL || 'https://api.chillpay.co/api/v1',
    webhookSecret: process.env.CHILLPAY_WEBHOOK_SECRET || '',
    transactionBaseUrl:
      process.env.CHILLPAY_TRANSACTION_URL || 'https://sandbox-api-transaction.chillpay.co/api/v1',
  },
  line: {
    channelId: process.env.LINE_CHANNEL_ID || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    callbackUrl: process.env.LINE_CALLBACK_URL || '',
  },
};

module.exports = config;
