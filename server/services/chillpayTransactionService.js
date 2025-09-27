const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/env');

const chillpayConfig = config.chillpay;

function buildChecksum(fields) {
  const concatenated = fields.map((value) => (value == null ? '' : String(value))).join('') + chillpayConfig.secretKey;
  return crypto.createHash('md5').update(concatenated).digest('hex');
}

function buildSearchPayload({
  searchKeyword = '',
  orderNo = '',
  transactionDateFrom = '',
  transactionDateTo = '',
  paymentDateFrom = '',
  paymentDateTo = '',
  pageSize = 10,
  pageNumber = 1,
  orderBy = 'TransactionDate',
  orderDir = 'DESC',
  status = '',
  paymentChannel = '',
  routeNo = '',
  merchantCode = '',
}) {
  const payload = {
    OrderBy: orderBy,
    OrderDir: orderDir,
    PageSize: pageSize,
    PageNumber: pageNumber,
    SearchKeyword: searchKeyword,
    MerchantCode: merchantCode,
    PaymentChannel: paymentChannel,
    RouteNo: routeNo,
    OrderNo: orderNo,
    Status: status,
    TransactionDateFrom: transactionDateFrom,
    TransactionDateTo: transactionDateTo,
    PaymentDateFrom: paymentDateFrom,
    PaymentDateTo: paymentDateTo,
  };

  const checksum = buildChecksum([
    payload.OrderBy,
    payload.OrderDir,
    payload.PageSize,
    payload.PageNumber,
    payload.SearchKeyword,
    payload.MerchantCode,
    payload.PaymentChannel,
    payload.RouteNo,
    payload.OrderNo,
    payload.Status,
    payload.TransactionDateFrom,
    payload.TransactionDateTo,
    payload.PaymentDateFrom,
    payload.PaymentDateTo,
  ]);

  return {
    ...payload,
    Checksum: checksum,
  };
}

async function searchPaymentTransaction(options = {}) {
  if (!chillpayConfig.merchantId || !chillpayConfig.apiKey || !chillpayConfig.secretKey) {
    throw new Error('ChillPay credentials are not fully configured');
  }

  const payload = buildSearchPayload({
    merchantCode: chillpayConfig.merchantId,
    ...options,
  });

  const endpoint = `${chillpayConfig.transactionBaseUrl.replace(/\/$/, '')}/payment/search`;

  console.log('ChillPay Search Request:', {
    endpoint,
    payload,
    merchantCode: chillpayConfig.merchantId,
    apiKey: chillpayConfig.apiKey?.substring(0, 8) + '...',
  });

  try {
    const response = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'CHILLPAY-MerchantCode': chillpayConfig.merchantId,
        'CHILLPAY-ApiKey': chillpayConfig.apiKey,
      },
    });

    console.log('ChillPay Search Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('ChillPay Search Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

module.exports = {
  searchPaymentTransaction,
  buildSearchPayload,
  buildChecksum,
};
