const mongoose = require('mongoose');
const config = require('../config/env');
const WarpTransaction = require('../models/WarpTransaction');
const { appendActivity } = require('../services/activityLogger');
const { checkTransactionStatus } = require('../services/transactionStatusService');

const POLL_ENABLED = process.env.CHILLPAY_AUTO_POLL !== 'false';
const POLL_CRON = process.env.CHILLPAY_POLL_CRON || '*/15 * * * * *';
const MAX_BATCH = parseInt(process.env.CHILLPAY_POLL_BATCH || '5', 10);

let cronModule;
function loadCronModule() {
  if (cronModule) {
    return cronModule;
  }

  try {
    cronModule = require('node-cron');
  } catch (error) {
    console.warn(
      'node-cron is not installed; automatic transaction polling is disabled. Install node-cron to enable scheduling.'
    );
    cronModule = null;
  }

  return cronModule;
}

async function processPendingTransactions() {
  if (!POLL_ENABLED) {
    return;
  }

  if (!config.chillpay.merchantId || !config.chillpay.apiKey || !config.chillpay.secretKey) {
    console.log('ChillPay not configured, skipping transaction polling');
    return;
  }

  const pendingTransactions = await WarpTransaction.find({
    status: 'pending',
    'metadata.payLinkToken': { $exists: true, $ne: null },
    // Skip transactions with too many polling errors (more than 10)
    $or: [
      { 'metadata.pollErrorCount': { $exists: false } },
      { 'metadata.pollErrorCount': { $lt: 10 } }
    ]
  })
    .sort({ createdAt: 1 })
    .limit(MAX_BATCH)
    .lean();

  if (pendingTransactions.length > 0) {
    console.log(`Processing ${pendingTransactions.length} pending transactions`);
  }

  for (const transaction of pendingTransactions) {
    try {
      console.log(`Checking status for transaction: ${transaction._id}`);
      const result = await checkTransactionStatus({
        transactionId: transaction._id,
        actor: 'auto-poll',
      });

      if (result.status === 'unconfigured') {
        console.log('ChillPay unconfigured, stopping polling');
        break;
      }

      console.log(`Transaction ${transaction._id} status: ${result.status}`);
    } catch (error) {
      console.error(`Error checking transaction ${transaction._id}:`, error.message);

      // If it's a ChillPay API error, mark transaction for manual review
      if (error.response?.status === 400) {
        await appendActivity(transaction._id, {
          action: 'status_poll_error',
          description: `ChillPay API error (400): ${error.message}. Manual review required.`,
          actor: 'system',
        });

        // Update transaction metadata to indicate API error
        await WarpTransaction.findByIdAndUpdate(transaction._id, {
          $set: {
            'metadata.pollError': true,
            'metadata.pollErrorCount': (transaction.metadata?.pollErrorCount || 0) + 1,
            'metadata.lastPollError': new Date(),
          },
        });
      } else {
        await appendActivity(transaction._id, {
          action: 'status_poll_error',
          description: `Auto polling failed: ${error.message}`,
          actor: 'system',
        });
      }
    }
  }
}

function startTransactionPolling() {
  if (!POLL_ENABLED) {
    console.log('Transaction polling is disabled (CHILLPAY_AUTO_POLL=false)');
    return;
  }

  const cron = loadCronModule();
  if (!cron) {
    return;
  }

  console.log(`Starting transaction polling with cron: ${POLL_CRON}`);

  cron.schedule(POLL_CRON, async () => {
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, skipping polling');
      return;
    }

    try {
      await processPendingTransactions();
    } catch (error) {
      console.error('Error in transaction polling:', error);
    }
  });

  console.log('Transaction polling started successfully');
}

module.exports = {
  startTransactionPolling,
  processPendingTransactions,
};
