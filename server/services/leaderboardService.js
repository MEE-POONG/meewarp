const WarpTransaction = require('../models/WarpTransaction');

async function getTopSupporters(limit = 3) {
  const docs = await WarpTransaction.aggregate([
    {
      $match: {
        status: { $in: ['paid', 'displayed'] },
      },
    },
    {
      $group: {
        _id: {
          name: '$customerName',
        },
        totalAmount: { $sum: '$amount' },
        totalSeconds: { $sum: '$displaySeconds' },
        lastTransactionAt: { $max: '$createdAt' },
        avatars: {
          $addToSet: {
            $cond: [
              { $ifNull: ['$customerAvatar', false] },
              '$customerAvatar',
              '$metadata.productImage',
            ],
          },
        },
        // Get the most recent transaction for this customer
        recentTransaction: { $last: '$$ROOT' },
        // Also get the latest transaction with avatar
        latestWithAvatar: {
          $last: {
            $cond: [
              { $ifNull: ['$customerAvatar', false] },
              '$$ROOT',
              null
            ]
          }
        },
      },
    },
    {
      $sort: { totalAmount: -1, lastTransactionAt: -1 },
    },
    {
      $limit: limit,
    },
  ]);

  const result = docs.map((doc) => {
    // First try to find a valid avatar from the avatars array
    let customerAvatar = (doc.avatars || []).find((value) => Boolean(value));
    
    // If no avatar found, try to get from the latest transaction with avatar
    if (!customerAvatar && doc.latestWithAvatar) {
      customerAvatar = doc.latestWithAvatar.customerAvatar || doc.latestWithAvatar.metadata?.productImage;
    }
    
    // If still no avatar, try to get from the most recent transaction
    if (!customerAvatar && doc.recentTransaction) {
      customerAvatar = doc.recentTransaction.customerAvatar || doc.recentTransaction.metadata?.productImage;
    }
    
    // If still no avatar, use a fallback based on customer name
    if (!customerAvatar) {
      // Use ui-avatars.com as fallback
      const encodedName = encodeURIComponent(doc._id.name);
      customerAvatar = `https://ui-avatars.com/api/?background=312e81&color=fff&name=${encodedName}&size=200`;
    }
    
    
    return {
      customerName: doc._id.name,
      customerAvatar,
      totalAmount: doc.totalAmount,
      totalSeconds: doc.totalSeconds,
      lastTransactionAt: doc.lastTransactionAt,
    };
  });
  
  return result;
}

module.exports = {
  getTopSupporters,
};
