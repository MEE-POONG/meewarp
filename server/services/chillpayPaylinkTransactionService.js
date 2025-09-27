const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/env');

const chillpayConfig = config.chillpay;

function isConfigured() {
  return Boolean(chillpayConfig.merchantId && chillpayConfig.apiKey && chillpayConfig.secretKey);
}

function stringify(value) {
  if (value == null) {
    return '';
  }
  return String(value).trim();
}

function buildChecksum(parts) {
  const concatenated = parts.map((value) => stringify(value)).join('') + chillpayConfig.secretKey;
  return crypto.createHash('md5').update(concatenated).digest('hex');
}

function buildTransactionDetailsPayload({ transactionId }) {
  const id = stringify(transactionId);

  if (!id) {
    throw new Error('transactionId is required for PayLink transaction lookup');
  }

  return {
    TransactionId: id,
    Checksum: buildChecksum([id]),
  };
}

function buildTransactionSearchPayload({
  payLinkId = '',
  transactionId = '',
  transactionDateFrom = '',
  transactionDateTo = '',
  paymentDateFrom = '',
  paymentDateTo = '',
  productName = '',
  customerName = '',
  customerPhoneNumber = '',
  paymentStatus = '',
  pageSize = 5,
  pageNumber = 1,
  orderBy = 'TransactionDate',
  orderDir = 'DESC',
}) {
  const payload = {
    OrderBy: orderBy,
    OrderDir: orderDir,
    PageSize: stringify(pageSize),
    PageNumber: stringify(pageNumber),
    PayLinkId: stringify(payLinkId),
    TransactionId: stringify(transactionId),
    TransactionDateFrom: stringify(transactionDateFrom),
    TransactionDateTo: stringify(transactionDateTo),
    PaymentDateFrom: stringify(paymentDateFrom),
    PaymentDateTo: stringify(paymentDateTo),
    ProductName: stringify(productName),
    CustomerName: stringify(customerName),
    CustomerPhoneNumber: stringify(customerPhoneNumber),
    PaymentStatus: stringify(paymentStatus),
  };

  payload.Checksum = buildChecksum([
    payload.OrderBy,
    payload.OrderDir,
    payload.PageSize,
    payload.PageNumber,
    payload.PayLinkId,
    payload.TransactionId,
    payload.TransactionDateFrom,
    payload.TransactionDateTo,
    payload.PaymentDateFrom,
    payload.PaymentDateTo,
    payload.ProductName,
    payload.CustomerName,
    payload.CustomerPhoneNumber,
    payload.PaymentStatus,
  ]);

  return payload;
}

async function postToChillPay({ endpoint, payload }) {
  const baseHeaders = {
    'Content-Type': 'application/json',
    'CHILLPAY-MerchantCode': chillpayConfig.merchantId,
    'CHILLPAY-ApiKey': chillpayConfig.apiKey,
  };

  return axios.post(endpoint, payload, { headers: baseHeaders });
}

async function getPayLinkTransactionDetails({ transactionId }) {
  if (!isConfigured()) {
    throw new Error('ChillPay credentials are not fully configured');
  }

  const payload = buildTransactionDetailsPayload({ transactionId });

  const baseUrl = chillpayConfig.paymentBaseUrl.replace(/\/$/, '');
  const endpoint = `${baseUrl}/paylinktransaction/details`;

  console.log('ChillPay PayLink Details Request:', {
    endpoint,
    payload: { ...payload, Checksum: '[hidden]' },
    merchantCode: chillpayConfig.merchantId,
  });

  try {
    const response = await postToChillPay({ endpoint, payload });
    console.log('ChillPay PayLink Details Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('ChillPay PayLink Details Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

async function searchPayLinkTransactions(options = {}) {
  if (!isConfigured()) {
    throw new Error('ChillPay credentials are not fully configured');
  }

  const payload = buildTransactionSearchPayload(options);
  const baseUrl = chillpayConfig.paymentBaseUrl.replace(/\/$/, '');
  const endpoint = `${baseUrl}/paylinktransaction/search`;

  console.log('ChillPay PayLink Search Request:', {
    endpoint,
    payload: { ...payload, Checksum: '[hidden]' },
    merchantCode: chillpayConfig.merchantId,
  });

  try {
    const response = await postToChillPay({ endpoint, payload });
    console.log('ChillPay PayLink Search Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('ChillPay PayLink Search Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

module.exports = {
  getPayLinkTransactionDetails,
  searchPayLinkTransactions,
  buildTransactionDetailsPayload,
  buildTransactionSearchPayload,
};
