const mongoose = require('mongoose');
const WarpTransaction = require('../models/WarpTransaction');

const DISPLAY_STATUSES = ['paid', 'displaying', 'displayed'];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function computeRange(range, from, to) {
  const now = new Date();
  switch (range) {
    case 'day': {
      const start = startOfDay(now);
      return { start, end: endOfDay(now) };
    }
    case 'week': {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
      return { start, end: endOfDay(now) };
    }
    case 'month': {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      return { start, end: endOfDay(now) };
    }
    case 'custom': {
      if (!from || !to) {
        throw new Error('Custom range requires `from` and `to` values');
      }
      return { start: startOfDay(new Date(from)), end: endOfDay(new Date(to)) };
    }
    default:
      return null;
  }
}

async function getDashboardOverview() {
  const todayRange = computeRange('day');

  const [totals, queue] = await Promise.all([
    WarpTransaction.aggregate([
      { $match: { status: { $in: DISPLAY_STATUSES } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalWarpSeconds: { $sum: '$displaySeconds' },
          totalWarps: { $sum: 1 },
        },
      },
    ]),
    WarpTransaction.aggregate([
      {
        $match: {
          status: 'paid',
        },
      },
      { $count: 'count' },
    ]),
  ]);

  const [todayRevenue] = await WarpTransaction.aggregate([
    {
      $match: {
        status: { $in: DISPLAY_STATUSES },
        createdAt: { $gte: todayRange.start, $lte: todayRange.end },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalWarps: { $sum: 1 },
      },
    },
  ]);

  const summary = totals[0] || { totalRevenue: 0, totalWarpSeconds: 0, totalWarps: 0 };

  return {
    totalRevenue: summary.totalRevenue || 0,
    totalWarps: summary.totalWarps || 0,
    totalWarpSeconds: summary.totalWarpSeconds || 0,
    queueLength: queue[0]?.count || 0,
    today: {
      revenue: todayRevenue?.totalRevenue || 0,
      warps: todayRevenue?.totalWarps || 0,
    },
  };
}

async function getStatistics({ range = 'week', from, to }) {
  const dateRange = computeRange(range, from, to);

  const match = {
    status: { $in: DISPLAY_STATUSES },
  };

  if (dateRange) {
    match.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$amount' },
        warps: { $sum: 1 },
        seconds: { $sum: '$displaySeconds' },
      },
    },
  ];

  const [summaryDoc] = await WarpTransaction.aggregate(pipeline);

  const timeline = await WarpTransaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        revenue: { $sum: '$amount' },
        warps: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);


  return {
    summary: {
      revenue: summaryDoc?.revenue || 0,
      warps: summaryDoc?.warps || 0,
      seconds: summaryDoc?.seconds || 0,
    },
    timeline: timeline.map((item) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      revenue: item.revenue,
      warps: item.warps,
    })),
    gender: [], // Empty array since gender field is removed
    ageRanges: [], // Empty array since ageRange field is removed
  };
}

async function getCustomerDirectory({ page = 1, limit = 20, search }) {
  const skip = (Number(page) - 1) * Number(limit);

  const match = { status: { $in: DISPLAY_STATUSES } };

  if (search) {
    match.customerName = { $regex: search, $options: 'i' };
  }

  const aggregation = await WarpTransaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$customerName',
        customerAvatar: { $last: '$customerAvatar' },
        socialLink: { $last: '$socialLink' },
        totalWarps: { $sum: 1 },
        totalSeconds: { $sum: '$displaySeconds' },
        totalAmount: { $sum: '$amount' },
        lastWarpAt: { $max: '$createdAt' },
      },
    },
    { $sort: { totalAmount: -1, lastWarpAt: -1 } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const totalCount = await WarpTransaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$customerName',
      },
    },
    { $count: 'count' },
  ]);

  return {
    data: aggregation.map((item) => ({
      customerName: item._id,
      customerAvatar: item.customerAvatar,
      socialLink: item.socialLink,
      totalWarps: item.totalWarps,
      totalSeconds: item.totalSeconds,
      totalAmount: item.totalAmount,
      lastWarpAt: item.lastWarpAt,
    })),
    total: totalCount[0]?.count || 0,
  };
}

module.exports = {
  getDashboardOverview,
  getStatistics,
  getCustomerDirectory,
};
