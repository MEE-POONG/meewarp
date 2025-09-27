const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const WarpTransaction = require('../models/WarpTransaction');

const DISPLAY_STATUSES = ['pending', 'paid', 'displaying', 'displayed', 'failed', 'cancelled'];

function buildMatch({ status, search, from, to }) {
  const match = {};

  if (status && DISPLAY_STATUSES.includes(status)) {
    match.status = status;
  }

  if (from || to) {
    match.createdAt = {};
    if (from) {
      match.createdAt.$gte = new Date(from);
    }
    if (to) {
      match.createdAt.$lte = new Date(to);
    }
  }

  if (search) {
    match.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }

  return match;
}

async function listOrders({ page = 1, limit = 20, status, search, from, to }) {
  const skip = (Number(page) - 1) * Number(limit);
  const match = buildMatch({ status, search, from, to });

  const [orders, total] = await Promise.all([
    WarpTransaction.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    WarpTransaction.countDocuments(match),
  ]);

  return {
    data: orders,
    total,
    page: Number(page),
    limit: Number(limit),
  };
}

function buildCsv(orders) {
  const parser = new Parser({
    fields: [
      { label: 'Order ID', value: '_id' },
      { label: 'Profile Code', value: 'code' },
      { label: 'Customer', value: 'customerName' },
      { label: 'Gender', value: 'customerGender' },
      { label: 'Age Range', value: 'customerAgeRange' },
      { label: 'Seconds', value: 'displaySeconds' },
      { label: 'Amount (THB)', value: 'amount' },
      { label: 'Status', value: 'status' },
      { label: 'Created At', value: (row) => row.createdAt?.toISOString() },
    ],
  });

  return Buffer.from(parser.parse(orders), 'utf8');
}

function buildPdf(orders, { from, to }) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  doc.fontSize(18).text('Warp Revenue Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
  if (from || to) {
    doc.text(`Range: ${from || 'N/A'} - ${to || 'N/A'}`);
  }

  doc.moveDown();

  const tableTop = doc.y;
  const columnWidths = [90, 90, 60, 60, 60, 60];
  const headers = ['Order ID', 'Customer', 'Seconds', 'Amount', 'Status', 'Created'];

  doc.font('Helvetica-Bold');
  headers.forEach((header, idx) => {
    doc.text(header, 40 + columnWidths.slice(0, idx).reduce((a, b) => a + b, 0), tableTop, {
      width: columnWidths[idx],
      align: 'left',
    });
  });

  doc.font('Helvetica').moveDown();

  orders.forEach((order) => {
    const y = doc.y + 2;
    const row = [
      order._id.toString(),
      order.customerName,
      `${order.displaySeconds}s`,
      `${order.amount.toFixed(2)} ฿`,
      order.status,
      new Date(order.createdAt).toLocaleString(),
    ];

    row.forEach((value, idx) => {
      doc.text(value, 40 + columnWidths.slice(0, idx).reduce((a, b) => a + b, 0), y, {
        width: columnWidths[idx],
        align: 'left',
      });
    });

    doc.moveDown();
  });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

async function exportOrders({ format = 'csv', status, search, from, to }) {
  const match = buildMatch({ status, search, from, to });
  const orders = await WarpTransaction.find(match).sort({ createdAt: -1 }).lean();

  if (format === 'pdf') {
    const buffer = await buildPdf(orders, { from, to });
    return {
      buffer,
      contentType: 'application/pdf',
      filename: `warp-revenue-${Date.now()}.pdf`,
    };
  }

  const buffer = buildCsv(orders);
  return {
    buffer,
    contentType: 'text/csv',
    filename: `warp-revenue-${Date.now()}.csv`,
  };
}

module.exports = {
  listOrders,
  exportOrders,
};
