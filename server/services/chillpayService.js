const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/env');

const chillpayConfig = config.chillpay;

function isChillPayConfigured() {
  return Boolean(chillpayConfig.merchantId && chillpayConfig.apiKey && chillpayConfig.secretKey);
}

function formatDate(date) {
  const pad = (n) => `${n}`.padStart(2, '0');
  
  // Convert to Thailand timezone (UTC+7)
  const thaiDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  
  const dd = pad(thaiDate.getUTCDate());
  const mm = pad(thaiDate.getUTCMonth() + 1);
  const yyyy = thaiDate.getUTCFullYear();
  const hh = pad(thaiDate.getUTCHours());
  const mi = pad(thaiDate.getUTCMinutes());
  const ss = pad(thaiDate.getUTCSeconds());
  
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
}

function buildChecksum(fields) {
  const concatenated = fields.join('') + chillpayConfig.secretKey;
  return crypto.createHash('md5').update(concatenated).digest('hex');
}

async function createPayLink({
  referenceNo,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  returnUrl,
  notifyUrl,
  description,
  productImage,
  productDescription,
  paymentLimit,
  expiresInMinutes,
}) {
  if (!isChillPayConfigured()) {
    throw new Error('ChillPay credentials are not configured');
  }

  const now = new Date();
  const startDate = formatDate(now);
  const expireDate = formatDate(new Date(now.getTime() + (expiresInMinutes || 60) * 60 * 1000));

  const amountInteger = Math.round(Number(amount) * 100);

  const payload = {
    ProductImage: productImage || '',
    ProductName: description || `Warp ${referenceNo}`,
    ProductDescription: productDescription || description || 'Warp service',
    PaymentLimit: typeof paymentLimit === 'number' && paymentLimit > 0 ? String(paymentLimit) : '1',
    StartDate: startDate,
    ExpiredDate: expireDate,
    Currency: 'THB',
    Amount: `${amountInteger}`,
    Checksum: '',
  };

  const checksum = buildChecksum([
    payload.ProductImage,
    payload.ProductName,
    payload.ProductDescription,
    payload.PaymentLimit,
    payload.StartDate,
    payload.ExpiredDate,
    payload.Currency,
    payload.Amount,
  ]);

  payload.Checksum = checksum;

  const baseUrl = chillpayConfig.paymentBaseUrl.replace(/\/$/, '');
  const endpoint = `${baseUrl}/paylink/generate`;

  console.log('ChillPay PayLink Request:', {
    endpoint,
    payload,
    merchantCode: chillpayConfig.merchantId,
    apiKey: chillpayConfig.apiKey?.substring(0, 8) + '...',
  });

  // Debug date format
  console.log('Date Debug:', {
    now: now.toISOString(),
    startDate,
    expireDate,
    expiresInMinutes: expiresInMinutes || 60,
    calculatedExpireTime: new Date(now.getTime() + (expiresInMinutes || 60) * 60 * 1000).toISOString()
  });

  try {
    const response = await axios.post(
      endpoint,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'CHILLPAY-MerchantCode': chillpayConfig.merchantId,
          'CHILLPAY-ApiKey': chillpayConfig.apiKey,
        },
      }
    );

    console.log('ChillPay PayLink Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('ChillPay PayLink Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
}

function verifyWebhookSignature(body, signature) {
  if (!chillpayConfig.webhookSecret) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', chillpayConfig.webhookSecret)
    .update(body)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

module.exports = {
  createPayLink,
  verifyWebhookSignature,
  isChillPayConfigured,
};
