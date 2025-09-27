const express = require('express');
const WarpTransaction = require('../models/WarpTransaction');
const WarpProfile = require('../models/WarpProfile');
const WarpPackage = require('../models/WarpPackage');
const adminAuth = require('../middlewares/adminAuth');
const userAuth = require('../middlewares/userAuth');
const leaderboardEmitter = require('../lib/leaderboardEmitter');
const displayEmitter = require('../lib/displayEmitter');
const { getTopSupporters } = require('../services/leaderboardService');
const { appendActivity, listRecentActivities } = require('../services/activityLogger');
const { createPayLink, isChillPayConfigured, verifyWebhookSignature } = require('../services/chillpayService');
const { checkTransactionStatus } = require('../services/transactionStatusService');

const router = express.Router();

router.get('/leaderboard/top-supporters', async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 3;
    const supporters = await getTopSupporters(limit);
    return res.status(200).json({ supporters });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

router.get('/leaderboard/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const sendSnapshot = async () => {
    try {
      const supporters = await getTopSupporters();
      res.write(`data: ${JSON.stringify({ supporters })}\n\n`);
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Failed to load leaderboard' })}\n\n`);
    }
  };

  const onUpdate = async () => {
    await sendSnapshot();
  };

  leaderboardEmitter.on('update', onUpdate);

  sendSnapshot();

  req.on('close', () => {
    leaderboardEmitter.off('update', onUpdate);
  });
});

router.get('/display/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const sendSnapshot = async () => {
    try {
      const queueCount = await WarpTransaction.countDocuments({ status: 'paid' });
      const current = await WarpTransaction.findOne({ status: 'displaying' })
        .sort({ displayStartedAt: 1, createdAt: 1 })
        .lean();

      res.write(
        `data: ${JSON.stringify({
          queueCount,
          current: current
            ? {
                id: current._id,
                customerName: current.customerName,
                socialLink: current.socialLink,
                displaySeconds: current.displaySeconds,
                startedAt: current.displayStartedAt,
              }
            : null,
        })}\n\n`
      );
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Failed to load display queue' })}\n\n`);
    }
  };

  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 20000);

  const onUpdate = async () => {
    await sendSnapshot();
  };

  displayEmitter.on('update', onUpdate);

  sendSnapshot();

  req.on('close', () => {
    clearInterval(heartbeat);
    displayEmitter.off('update', onUpdate);
  });
});

router.get('/public/packages', async (req, res) => {
  try {
    const packages = await WarpPackage.find({ isActive: true }).sort({ seconds: 1 }).lean();
    return res.status(200).json({ packages });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load packages' });
  }
});

router.post('/transactions', adminAuth, async (req, res) => {
  try {
    const {
      code,
      customerName,
      customerAvatar,
      socialLink,
      quote,
      displaySeconds: displaySecondsInput,
      amount: amountInput,
      currency,
      status,
      metadata,
      packageId,
    } = req.body;

    if (!code || !customerName || !socialLink) {
      return res.status(400).json({ message: 'code, customerName, and socialLink are required' });
    }

    const profile = await WarpProfile.findOne({ code });

    let displaySeconds = Number(displaySecondsInput);
    let amount = Number(amountInput);
    let packageRef = null;

    if (packageId) {
      packageRef = await WarpPackage.findOne({ _id: packageId, isActive: true }).lean();
      if (!packageRef) {
        return res.status(400).json({ message: 'Invalid packageId' });
      }
      displaySeconds = packageRef.seconds;
      amount = packageRef.price;
    }

    if (!displaySeconds || !amount) {
      return res.status(400).json({ message: 'displaySeconds and amount are required' });
    }

    const transaction = await WarpTransaction.create({
      warpProfile: profile ? profile._id : undefined,
      code,
      customerName,
      customerAvatar,
      socialLink,
      quote,
      displaySeconds,
      amount,
      currency,
      packageId: packageRef?._id,
      status: status || (isChillPayConfigured() ? 'pending' : 'paid'),
      metadata,
    });

    await appendActivity(transaction._id, {
      action: 'created',
      description: `Transaction created by admin for ${customerName}`,
      actor: req.admin?.email || 'admin',
    });

    let responsePayload = {
      id: transaction._id,
      code: transaction.code,
      customerName: transaction.customerName,
      totalAmount: transaction.amount,
      displaySeconds: transaction.displaySeconds,
      status: transaction.status,
      packageId: transaction.packageId,
    };

    console.log('isChillPayConfigured():', isChillPayConfigured());
    
    if (isChillPayConfigured()) {
      console.log('Creating ChillPay payment link...');
      try {
        const payLinkResponse = await createPayLink({
          referenceNo: `${transaction._id}`,
          amount,
          customerName,
          customerEmail: metadata?.customerEmail || '',
          customerPhone: metadata?.customerPhone || '',
          description: `Warp for ${code}`,
          returnUrl: metadata?.returnUrl || `${process.env.PUBLIC_BASE_URL || 'http://localhost:5173'}/warp/${code}`,
          notifyUrl: metadata?.notifyUrl || `${process.env.PUBLIC_API_BASE_URL || 'http://localhost:7001'}/api/v1/payments/webhook`,
          productImage: metadata?.productImage,
          productDescription: metadata?.productDescription || socialLink,
          paymentLimit: metadata?.paymentLimit,
          expiresInMinutes: metadata?.expiresInMinutes,
        });

        console.log('payLinkResponse', payLinkResponse.data);
        

        const paymentUrl =
          payLinkResponse?.data?.paymentUrl ||
          payLinkResponse?.paymentUrl ||
          payLinkResponse?.result?.paymentUrl ||
          payLinkResponse?.data?.qrImage ||
          '';

        await WarpTransaction.findByIdAndUpdate(transaction._id, {
          $set: {
            'metadata.payLink': paymentUrl,
            'metadata.payLinkResponse': payLinkResponse,
            'metadata.payLinkToken':
              payLinkResponse?.data?.payLinkToken || payLinkResponse?.data?.payLinkId || null,
          },
        });

        await appendActivity(transaction._id, {
          action: 'payment_link_created',
          description: 'ChillPay payment link issued',
          actor: 'system',
        });

        responsePayload = {
          ...responsePayload,
          paymentUrl,
          paymentReference:
            payLinkResponse?.data?.payLinkToken || payLinkResponse?.referenceNo || transaction._id.toString(),
        };
      } catch (err) {
        const status = err.response?.status;
        const errData = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        console.error('ChillPay PayLink error:', status, errData);

        await appendActivity(transaction._id, {
          action: 'payment_link_failed',
          description: `Failed to create ChillPay link: ${errData}`,
          actor: 'system',
        });

        return res.status(502).json({
          message: 'Failed to create payment link',
          details: errData,
          status,
        });
      }
    } else {
      leaderboardEmitter.emit('update');
      displayEmitter.emit('update');
    }

    return res.status(201).json(responsePayload);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create transaction' });
  }
});

router.get('/transactions/activity-log', adminAuth, async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 20;
    const entries = await listRecentActivities({ limit });
    return res.status(200).json({ entries });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load activity log' });
  }
});

router.post('/transactions/:id/check-status', adminAuth, async (req, res) => {
  try {
    const result = await checkTransactionStatus({
      transactionId: req.params.id,
      actor: req.admin?.email || 'admin',
    });

    if (result.status === 'unconfigured') {
      return res.status(400).json({ message: result.note });
    }

    return res.status(200).json({
      status: result.status,
      chillpayStatus: result.chillpayStatus,
      note: result.note,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to check transaction status' });
  }
});

// Public endpoint for customers to create transactions (requires LINE login)
router.post('/public/transactions', userAuth, async (req, res) => {
  try {
    const {
      code,
      customerAvatar,
      socialLink,
      quote,
      displaySeconds: displaySecondsInput,
      amount: amountInput,
      metadata,
      packageId,
    } = req.body;
    const submittedCustomerName = req.body.customerName || req.user.displayName;
    
    console.log('PUBLIC: submittedCustomerName:', submittedCustomerName);
    console.log('PUBLIC: req.body.customerName:', req.body.customerName);
    console.log('PUBLIC: req.user.displayName:', req.user?.displayName);

    if (!code || !submittedCustomerName || !socialLink) {
      return res.status(400).json({ 
        message: 'code, customerName, and socialLink are required' 
      });
    }

    const profile = await WarpProfile.findOne({ code });

    let displaySeconds = Number(displaySecondsInput);
    let amount = Number(amountInput);
    let packageRef = null;

    if (packageId) {
      packageRef = await WarpPackage.findOne({ _id: packageId, isActive: true }).lean();
      if (!packageRef) {
        return res.status(400).json({ message: 'Invalid packageId' });
      }
      displaySeconds = packageRef.seconds;
      amount = packageRef.price;
    }

    if (!displaySeconds || !amount) {
      return res.status(400).json({ message: 'displaySeconds and amount are required' });
    }

    const transaction = await WarpTransaction.create({
      warpProfile: profile ? profile._id : undefined,
      code,
      customerName: submittedCustomerName,
      customerAvatar: customerAvatar || req.user.pictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.displayName)}&background=6366f1&color=ffffff&size=200`, // Use uploaded image, then LINE profile picture, then generated avatar
      socialLink,
      quote,
      displaySeconds,
      amount,
      currency: 'THB',
      packageId: packageRef?._id,
      status: isChillPayConfigured() ? 'pending' : 'paid',
      metadata: {
        ...metadata,
        source: metadata?.source || 'public-customer',
        lineUserId: req.user.lineUserId,
        userId: req.user._id,
        lineDisplayName: req.user.displayName,
        linePictureUrl: req.user.pictureUrl,
      },
    });

    await appendActivity(transaction._id, {
      action: 'created',
      description: `Transaction created by customer: ${req.user.displayName}`,
      actor: 'customer',
    });

    let responsePayload = {
      id: transaction._id,
      code: transaction.code,
      customerName: transaction.customerName,
      totalAmount: transaction.amount,
      displaySeconds: transaction.displaySeconds,
      status: transaction.status,
      packageId: transaction.packageId,
    };

    console.log('PUBLIC: isChillPayConfigured():', isChillPayConfigured());
    
    if (isChillPayConfigured()) {
      console.log('PUBLIC: Creating ChillPay payment link...');
      try {
        const payLinkResponse = await createPayLink({
          referenceNo: `${transaction._id}`,
          amount,
          customerName: submittedCustomerName,
          customerEmail: metadata?.customerEmail || '',
          customerPhone: metadata?.customerPhone || '',
          description: `Warp for ${code}`,
          returnUrl: metadata?.returnUrl || `${process.env.PUBLIC_BASE_URL || 'http://localhost:5173'}/warp/${code}`,
          notifyUrl: metadata?.notifyUrl || `${process.env.PUBLIC_API_BASE_URL || 'http://localhost:7001'}/api/v1/payments/webhook`,
          productImage: metadata?.productImage,
          productDescription: metadata?.productDescription || socialLink,
          paymentLimit: metadata?.paymentLimit,
          expiresInMinutes: metadata?.expiresInMinutes,
        });

        console.log('PUBLIC: payLinkResponse', payLinkResponse.data);
        
        const paymentUrl =
          payLinkResponse?.data?.paymentUrl ||
          payLinkResponse?.paymentUrl ||
          payLinkResponse?.result?.paymentUrl ||
          payLinkResponse?.data?.qrImage ||
          '';
          
        console.log('PUBLIC: paymentUrl', paymentUrl);

        await WarpTransaction.findByIdAndUpdate(transaction._id, {
          $set: {
            'metadata.payLink': paymentUrl,
            'metadata.payLinkResponse': payLinkResponse,
            'metadata.payLinkToken':
              payLinkResponse?.data?.payLinkToken || payLinkResponse?.data?.payLinkId || null,
          },
        });

        await appendActivity(transaction._id, {
          action: 'payment_link_created',
          description: 'ChillPay payment link issued',
          actor: 'system',
        });

        responsePayload = {
          ...responsePayload,
          paymentUrl,
          paymentReference:
            payLinkResponse?.data?.payLinkToken || payLinkResponse?.referenceNo || transaction._id.toString(),
        };
        
        console.log('PUBLIC: Final responsePayload', responsePayload);
      } catch (err) {
        console.log('PUBLIC: ChillPay error:', err.message);
        await appendActivity(transaction._id, {
          action: 'payment_link_error',
          description: `ChillPay error: ${err.message}`,
          actor: 'system',
        });
      }
    }

    if (!isChillPayConfigured()) {
      console.log('PUBLIC: ChillPay not configured, emitting updates');
      leaderboardEmitter.emit('update');
      displayEmitter.emit('update');
    }

    console.log('PUBLIC: Returning response:', responsePayload);
    return res.status(201).json(responsePayload);
  } catch (error) {
    return res.status(500).json({ 
      message: 'Failed to create transaction', 
      details: error.message 
    });
  }
});

router.post('/public/transactions/check-status', async (req, res) => {
  try {
    const { transactionId, reference } = req.body || {};

    if (!transactionId && !reference) {
      return res.status(400).json({ message: 'transactionId or reference is required' });
    }

    let transaction = null;

    if (transactionId) {
      transaction = await WarpTransaction.findById(transactionId);
    } else if (reference) {
      transaction = await WarpTransaction.findOne({ 'metadata.payLinkToken': reference });
    }

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const result = await checkTransactionStatus({
      transactionId: transaction._id,
      reference,
      actor: 'customer',
    });

    if (result.status === 'unconfigured') {
      return res.status(400).json({ message: result.note });
    }

    return res.status(200).json({
      status: result.status,
      chillpayStatus: result.chillpayStatus,
      note: result.note,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to check status', details: error.message });
  }
});

router.post('/public/display/next', async (req, res) => {
  try {
    const now = new Date();

    const currentDisplaying = await WarpTransaction.findOne({ status: 'displaying' })
      .sort({ displayStartedAt: -1, createdAt: -1 })
      .lean();

    if (currentDisplaying) {
      return res.status(200).json({
        id: currentDisplaying._id,
        customerName: currentDisplaying.customerName,
        customerAvatar: currentDisplaying.customerAvatar,
        socialLink: currentDisplaying.socialLink,
        quote: currentDisplaying.quote,
        displaySeconds: currentDisplaying.displaySeconds,
        metadata: currentDisplaying.metadata || {},
        selfDisplayName: currentDisplaying.metadata?.selfDisplayName || currentDisplaying.customerName,
      });
    }

    const transaction = await WarpTransaction.findOneAndUpdate(
      { status: 'paid' },
      {
        $set: {
          status: 'displaying',
          displayStartedAt: now,
          'metadata.displayStartedAt': now,
        },
      },
      {
        sort: { createdAt: 1 },
        new: true,
      }
    );

    if (!transaction) {
      return res.status(204).send();
    }

    const estimatedEnd = new Date(now.getTime() + (transaction.displaySeconds || 0) * 1000);

    await WarpTransaction.findByIdAndUpdate(transaction._id, {
      $set: {
        'metadata.displayStartedAt': now,
        'metadata.displayEstimatedEndAt': estimatedEnd,
      },
    });

    await appendActivity(transaction._id, {
      action: 'display_started',
      description: `Warp display started for ${transaction.customerName}`,
      actor: 'display-system',
    });

    displayEmitter.emit('update');

    return res.status(200).json({
      id: transaction._id,
      customerName: transaction.customerName,
      customerAvatar: transaction.customerAvatar,
      socialLink: transaction.socialLink,
      quote: transaction.quote,
      displaySeconds: transaction.displaySeconds,
      metadata: transaction.metadata || {},
      selfDisplayName: transaction.metadata?.selfDisplayName || transaction.customerName,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to lock next display warp' });
  }
});

router.post('/public/display/:id/complete', async (req, res) => {
  try {
    const now = new Date();
    const transaction = await WarpTransaction.findOneAndUpdate(
      { _id: req.params.id, status: 'displaying' },
      {
        $set: {
          status: 'displayed',
          displayCompletedAt: now,
          'metadata.displayCompletedAt': now,
        },
      },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Display session not found' });
    }

    await appendActivity(transaction._id, {
      action: 'display_completed',
      description: 'Warp display marked as completed',
      actor: 'display-system',
    });

    displayEmitter.emit('update');

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to complete display session' });
  }
});

router.post('/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
    const signature = req.headers['x-chillpay-signature'];

    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const payload = rawBody ? JSON.parse(rawBody) : {};
    const referenceNo = payload?.referenceNo;
    const status = payload?.status;
    const amount = Number(payload?.amount || 0);

    if (!referenceNo) {
      return res.status(400).json({ message: 'Missing referenceNo' });
    }

    const transaction = await WarpTransaction.findById(referenceNo);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const updates = {};
    const activities = [];

    if (typeof status === 'string') {
      let newStatus = transaction.status;
      if (status.toLowerCase() === 'success') {
        newStatus = 'paid';
      } else if (status.toLowerCase() === 'fail') {
        newStatus = 'failed';
      }

      if (newStatus !== transaction.status) {
        updates.status = newStatus;
        activities.push({
          action: 'status_changed',
          description: `Status updated to ${newStatus} via ChillPay webhook`,
          actor: 'chillpay-webhook',
        });
      }
    }

    updates[`metadata.webhookPayload`] = payload;
    updates[`metadata.paidAmount`] = amount;

    await WarpTransaction.findByIdAndUpdate(transaction._id, {
      $set: updates,
    });

    for (const activity of activities) {
      await appendActivity(transaction._id, activity);
    }

    if (updates.status === 'paid') {
      leaderboardEmitter.emit('update');
      displayEmitter.emit('update');
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process webhook' });
  }
});

module.exports = router;
