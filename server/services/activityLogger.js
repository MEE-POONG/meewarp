const WarpTransaction = require('../models/WarpTransaction');

async function appendActivity(transactionId, entry) {
  return WarpTransaction.findByIdAndUpdate(
    transactionId,
    {
      $push: {
        activityLog: {
          ...entry,
          createdAt: entry?.createdAt || new Date(),
        },
      },
    },
    { new: true, projection: { activityLog: 0 } }
  );
}

async function listRecentActivities({ limit = 20 } = {}) {
  const transactions = await WarpTransaction.find({
    activityLog: { $exists: true, $ne: [] },
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select({
      code: 1,
      customerName: 1,
      amount: 1,
      status: 1,
      activityLog: { $slice: -5 },
      updatedAt: 1,
    })
    .lean();

  return transactions;
}

module.exports = {
  appendActivity,
  listRecentActivities,
};
