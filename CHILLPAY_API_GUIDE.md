# ChillPay API Integration Guide

## Overview
This document describes how the meeWarp application integrates with ChillPay API for payment processing.

## API Endpoints Used

### 1. PayLink Generation
- **Endpoint**: `/paylink/generate`
- **Method**: POST
- **Base URL**: `CHILLPAY_PAYMENT_URL` (default: `https://api.chillpay.co/api/v1`)

#### Request Headers
```
Content-Type: application/json
CHILLPAY-MerchantCode: {merchantId}
CHILLPAY-ApiKey: {apiKey}
```

#### Request Payload
```json
{
  "ProductImage": "base64_image_or_url",
  "ProductName": "Warp description",
  "ProductDescription": "Warp service details",
  "PaymentLimit": "1",
  "StartDate": "DD/MM/YYYY HH:mm:ss",
  "ExpiredDate": "DD/MM/YYYY HH:mm:ss",
  "Currency": "THB",
  "Amount": "amount_in_satang",
  "Checksum": "md5_checksum"
}
```

#### Checksum Calculation
```javascript
const fields = [
  ProductImage,
  ProductName,
  ProductDescription,
  PaymentLimit,
  StartDate,
  ExpiredDate,
  Currency,
  Amount
];
const concatenated = fields.join('') + secretKey;
const checksum = md5(concatenated);
```

### 2. Transaction Search
- **Endpoint**: `/payment/search`
- **Method**: POST
- **Base URL**: `CHILLPAY_TRANSACTION_URL` (default: `https://sandbox-api-transaction.chillpay.co/api/v1`)

#### Request Headers
```
Content-Type: application/json
CHILLPAY-MerchantCode: {merchantId}
CHILLPAY-ApiKey: {apiKey}
```

#### Request Payload
```json
{
  "OrderBy": "TransactionDate",
  "OrderDir": "DESC",
  "PageSize": 10,
  "PageNumber": 1,
  "SearchKeyword": "search_term",
  "MerchantCode": "merchant_id",
  "PaymentChannel": "",
  "RouteNo": "",
  "OrderNo": "order_reference",
  "Status": "",
  "TransactionDateFrom": "",
  "TransactionDateTo": "",
  "PaymentDateFrom": "",
  "PaymentDateTo": "",
  "Checksum": "md5_checksum"
}
```

#### Checksum Calculation
```javascript
const fields = [
  OrderBy,
  OrderDir,
  PageSize,
  PageNumber,
  SearchKeyword,
  MerchantCode,
  PaymentChannel,
  RouteNo,
  OrderNo,
  Status,
  TransactionDateFrom,
  TransactionDateTo,
  PaymentDateFrom,
  PaymentDateTo
];
const concatenated = fields.map(v => v || '').join('') + secretKey;
const checksum = md5(concatenated);
```

## Environment Variables Required

```bash
# ChillPay Configuration
CHILLPAY_MERCHANT_ID=your_merchant_id
CHILLPAY_API_KEY=your_api_key
CHILLPAY_SECRET_KEY=your_secret_key
CHILLPAY_PAYMENT_URL=https://api.chillpay.co/api/v1
CHILLPAY_TRANSACTION_URL=https://sandbox-api-transaction.chillpay.co/api/v1
CHILLPAY_WEBHOOK_SECRET=your_webhook_secret

# Transaction Polling
CHILLPAY_AUTO_POLL=true
CHILLPAY_POLL_CRON=*/15 * * * * *
CHILLPAY_POLL_BATCH=5
```

## Current Issues & Solutions

### Issue 1: 400 Bad Request Error
**Problem**: Transaction search API returns 400 error
**Possible Causes**:
1. Invalid checksum calculation
2. Missing required fields
3. Incorrect date format
4. Invalid merchant credentials

**Debug Steps**:
1. Check logs for detailed request/response
2. Verify checksum calculation
3. Validate all required fields are present
4. Confirm merchant credentials are correct

### Issue 2: Transaction Polling
**Current Implementation**:
- Runs every 15 seconds
- Processes up to 5 pending transactions per batch
- Skips transactions with >10 polling errors
- Logs all API interactions

**Monitoring**:
- Check server logs for polling activity
- Monitor transaction status updates
- Review error logs for API failures

## API Response Handling

### PayLink Response
Expected fields:
- `paymentUrl` - URL for customer payment
- `payLinkToken` - Reference for status checking
- `referenceNo` - Order reference

### Search Response
Expected fields:
- `data[]` - Array of transaction records
- Each record should contain:
  - `orderNo` - Order number
  - `payLinkToken` - PayLink reference
  - `transactionId` - Transaction ID
  - `status` - Payment status

## Error Handling

### Common Error Codes
- **400**: Bad Request - Check payload format and checksum
- **401**: Unauthorized - Verify API credentials
- **403**: Forbidden - Check merchant permissions
- **500**: Internal Server Error - Contact ChillPay support

### Retry Logic
- Failed transactions are retried up to 10 times
- Exponential backoff for API errors
- Manual review flag for persistent failures

## Testing

### Test PayLink Creation
1. Create a test transaction
2. Check server logs for PayLink request/response
3. Verify payment URL is generated
4. Test payment flow

### Test Status Checking
1. Create a transaction with payment
2. Monitor polling logs
3. Verify status updates
4. Check transaction record updates

## Monitoring & Debugging

### Enable Debug Logging
All ChillPay API calls are logged with:
- Request payload
- Response data
- Error details
- Timestamps

### Key Log Messages
- `ChillPay PayLink Request:` - PayLink creation attempt
- `ChillPay Search Request:` - Transaction search attempt
- `Processing X pending transactions` - Polling activity
- `Error checking transaction` - Polling failures

## Best Practices

1. **Always validate checksum** before API calls
2. **Handle timeouts gracefully** with retry logic
3. **Log all API interactions** for debugging
4. **Monitor polling performance** and adjust frequency
5. **Implement proper error handling** for all scenarios
6. **Test with sandbox environment** before production

## Troubleshooting Checklist

- [ ] Verify environment variables are set correctly
- [ ] Check ChillPay credentials are valid
- [ ] Validate API endpoint URLs
- [ ] Confirm checksum calculation matches documentation
- [ ] Review server logs for detailed error messages
- [ ] Test with minimal payload first
- [ ] Contact ChillPay support if issues persist
