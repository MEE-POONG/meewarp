const WarpTransaction = require('../models/WarpTransaction');
const {
  getPayLinkTransactionDetails,
  searchPayLinkTransactions,
} = require('./chillpayPaylinkTransactionService');
const { appendActivity } = require('./activityLogger');
const leaderboardEmitter = require('../lib/leaderboardEmitter');
const displayEmitter = require('../lib/displayEmitter');
const config = require('../config/env');

const chillpayConfig = config.chillpay;

function chillPayConfigured() {
  return Boolean(chillpayConfig.merchantId && chillpayConfig.apiKey && chillpayConfig.secretKey);
}

function extractReference(transaction, fallbackReference) {
  return (
    fallbackReference ||
    transaction?.metadata?.payLinkToken ||
    transaction?.metadata?.payLinkResponse?.data?.payLinkToken ||
    transaction?.metadata?.payLinkResponse?.data?.payLinkId ||
    transaction?.metadata?.payLink ||
    transaction?.code ||
    null
  );
}

async function checkTransactionStatus({ transactionId, reference, actor = 'system' }) {
  if (!chillPayConfigured()) {
    return {
      status: 'unconfigured',
      chillpayStatus: null,
      updated: false,
      note: 'ChillPay integration not configured',
    };
  }

  let transaction = null;

  if (transactionId) {
    transaction = await WarpTransaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
  }

  if (!transaction) {
    throw new Error('Transaction context is required');
  }

  const referenceCandidates = [];
  const candidateSet = new Set();
  const pushCandidate = (value, meta = {}) => {
    if (value == null) {
      return;
    }

    const candidate = String(value).trim();
    if (!candidate || candidateSet.has(candidate)) {
      return;
    }

    candidateSet.add(candidate);
    referenceCandidates.push({ value: candidate, ...meta });
  };

  pushCandidate(reference, { source: 'request' });
  pushCandidate(transaction?._id?.toString(), { source: 'transactionId' });
  pushCandidate(transaction?.metadata?.payLinkToken, { source: 'metadata.payLinkToken' });
  pushCandidate(transaction?.metadata?.payLinkResponse?.data?.payLinkToken, {
    source: 'payLinkResponse.data.payLinkToken',
  });
  pushCandidate(transaction?.metadata?.payLinkResponse?.data?.referenceNo, {
    source: 'payLinkResponse.data.referenceNo',
  });
  pushCandidate(transaction?.metadata?.payLinkResponse?.referenceNo, {
    source: 'payLinkResponse.referenceNo',
  });
  pushCandidate(transaction?.metadata?.payLinkResponse?.data?.payLinkId, {
    source: 'payLinkResponse.data.payLinkId',
    type: 'payLinkId',
  });
  pushCandidate(extractReference(transaction, reference), { source: 'extractReference' });

  if (referenceCandidates.length === 0) {
    await appendActivity(transaction._id, {
      action: 'status_check',
      description: 'Unable to check status: missing paylink identifiers',
      actor,
    });

    return {
      status: transaction.status,
      chillpayStatus: null,
      updated: false,
      note: 'Missing payLink reference',
    };
  }

  const numericCandidates = referenceCandidates.filter(({ value }) => /^\d+$/.test(value));

  let detailsResponse = null;
  let usedReference = null;
  let usedReferenceSource = null;
  let lastError = null;

  for (const candidate of numericCandidates) {
    try {
      const response = await getPayLinkTransactionDetails({ transactionId: candidate.value });
      if (response?.status === 200 && response?.data) {
        detailsResponse = response;
        usedReference = candidate.value;
        usedReferenceSource = candidate.source || 'transactionId';
        break;
      }

      lastError = new Error(`Unexpected ChillPay response status: ${response?.status}`);
    } catch (error) {
      lastError = error;
    }
  }

  let searchResponse = null;
  let searchReference = null;
  let searchReferenceType = null;

  const payLinkIdCandidate = referenceCandidates.find((candidate) => candidate.type === 'payLinkId');

  if (!detailsResponse) {
    const searchCandidates = [];

    if (payLinkIdCandidate && /^\d+$/.test(payLinkIdCandidate.value)) {
      searchCandidates.push({ payLinkId: payLinkIdCandidate.value, type: 'payLinkId' });
    }

    for (const candidate of numericCandidates) {
      searchCandidates.push({ transactionId: candidate.value, type: candidate.source || 'transactionId' });
    }

    for (const candidate of searchCandidates) {
      try {
        const response = await searchPayLinkTransactions({
          payLinkId: candidate.payLinkId || '',
          transactionId: candidate.transactionId || '',
        });

        const records = Array.isArray(response?.data) ? response.data : [];
        const record = records[0];
        if (response?.status === 200 && record) {
          searchResponse = { ...response, data: record };
          searchReference = candidate.payLinkId || candidate.transactionId;
          searchReferenceType = candidate.payLinkId ? 'payLinkId' : candidate.type;
          break;
        }

        lastError = new Error('No matching PayLink transaction found');
      } catch (error) {
        lastError = error;
      }
    }
  }

  if (!detailsResponse && !searchResponse) {
    const chillpayStatusCode = lastError?.response?.status;
    const chillpayMessage =
      lastError?.response?.data?.message ||
      lastError?.response?.data?.Message ||
      lastError?.message ||
      'ChillPay PayLink transaction not found';

    await WarpTransaction.findByIdAndUpdate(transaction._id, {
      $set: {
        'metadata.lastStatusCheckAt': new Date(),
        'metadata.lastStatusCheckError': {
          status: chillpayStatusCode || null,
          message: chillpayMessage,
          attempts: referenceCandidates.map(({ value, source, type }) => ({ value, source, type })),
        },
      },
    });

    await appendActivity(transaction._id, {
      action: 'status_check_failed',
      description: `ChillPay status check failed (${chillpayStatusCode || 'error'}): ${
        chillpayMessage || 'Unknown error'
      }`,
      actor,
    });

    return {
      status: transaction.status,
      chillpayStatus: null,
      updated: false,
      note: chillpayMessage,
    };
  }

  const payload = detailsResponse || searchResponse;
  const chillpayStatus = (payload?.data?.paymentStatus || '')
    .toString()
    .toUpperCase();
  const note =
    payload?.message ||
    payload?.data?.paymentStatus ||
    `PayLink status: ${chillpayStatus || 'UNKNOWN'}`;

  const updates = {
    'metadata.lastStatusCheckAt': new Date(),
    'metadata.lastStatusPayload': payload,
    'metadata.lastStatusUsedReference': usedReference || searchReference,
    'metadata.lastStatusUsedReferenceType': usedReferenceSource || searchReferenceType || null,
    'metadata.lastStatusCheckError': null,
  };

  let updated = false;
  let newStatus = transaction.status;

  if (chillpayStatus === 'SUCCESS' && transaction.status !== 'paid') {
    updates.status = 'paid';
    newStatus = 'paid';
    updated = true;
  }

  if (['FAIL', 'FAILED', 'VOID', 'CANCEL'].includes(chillpayStatus) && transaction.status !== 'failed') {
    updates.status = 'failed';
    newStatus = 'failed';
    updated = true;
  }

  await WarpTransaction.findByIdAndUpdate(transaction._id, { $set: updates });

  await appendActivity(transaction._id, {
    action: 'status_check',
    description: `ChillPay PayLink status: ${chillpayStatus || 'UNKNOWN'} (ref: ${
      usedReference || 'n/a'
    })`,
    actor,
  });

  if (updated && newStatus === 'paid') {
    leaderboardEmitter.emit('update');
    displayEmitter.emit('update');

    await appendActivity(transaction._id, {
      action: 'status_changed',
      description: 'Transaction marked as paid',
      actor: 'system',
    });
  }

  return {
    status: newStatus,
    chillpayStatus,
    updated,
    note,
    payload: detailsResponse,
  };
}

module.exports = {
  checkTransactionStatus,
};
