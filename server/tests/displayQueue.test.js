const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const WarpTransaction = require('../models/WarpTransaction');

let mongoServer;
let app;

const adminCredentials = {
  email: 'admin@warp.dev',
  password: 'supersecret',
};

const createWarpPayload = {
  code: 'DJ001',
  name: 'Display DJ',
  socialLink: 'https://instagram.com/displaydj',
};

const createTransactionPayload = (overrides = {}) => ({
  code: 'DJ001',
  customerName: 'Customer Warp',
  customerAvatar: 'https://example.com/avatar.jpg',
  socialLink: 'https://instagram.com/customer',
  displaySeconds: 15,
  amount: 200,
  status: 'paid',
  ...overrides,
});

const loginAndGetAuthHeader = async () => {
  const response = await request(app).post('/api/v1/admin/login').send(adminCredentials);
  return `Bearer ${response.body.token}`;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { ip: '127.0.0.1', port: 0 },
  });

  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.PORT = '0';
  process.env.ADMIN_EMAIL = adminCredentials.email;
  process.env.ADMIN_PASSWORD = adminCredentials.password;
  process.env.ADMIN_JWT_SECRET = 'display-test-secret';
  process.env.ADMIN_JWT_EXPIRES_IN = '1h';

  ({ app } = require('../index'));

  await mongoose.connect(process.env.MONGODB_URI);
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase();
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Warp display queue', () => {
  let authHeader;

  beforeEach(async () => {
    authHeader = await loginAndGetAuthHeader();
    await request(app)
      .post('/api/v1/admin/warp')
      .set('Authorization', authHeader)
      .send(createWarpPayload);
  });

  test('locks and completes a single paid warp', async () => {
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', authHeader)
      .send(createTransactionPayload());

    const firstLock = await request(app).post('/api/v1/public/display/next');

    expect(firstLock.status).toBe(200);
    expect(firstLock.body).toMatchObject({
      customerName: 'Customer Warp',
      socialLink: 'https://instagram.com/customer',
    });

    const lockedId = firstLock.body.id;
    expect(lockedId).toBeDefined();

    const inProgress = await WarpTransaction.findById(lockedId);
    expect(inProgress.status).toBe('displaying');

    const secondCall = await request(app).post('/api/v1/public/display/next');
    expect(secondCall.status).toBe(200);
    expect(secondCall.body.id).toBe(lockedId);

    const completeResponse = await request(app).post(`/api/v1/public/display/${lockedId}/complete`);
    expect(completeResponse.status).toBe(200);

    const completed = await WarpTransaction.findById(lockedId);
    expect(completed.status).toBe('displayed');
    expect(completed.displayCompletedAt).toBeInstanceOf(Date);

    const afterCompletion = await request(app).post('/api/v1/public/display/next');
    expect(afterCompletion.status).toBe(204);
  });

  test('serves warps in FIFO order', async () => {
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', authHeader)
      .send(createTransactionPayload({ customerName: 'First Warp', displaySeconds: 10 }));

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', authHeader)
      .send(createTransactionPayload({ customerName: 'Second Warp', displaySeconds: 20, amount: 400 }));

    const first = await request(app).post('/api/v1/public/display/next');
    expect(first.status).toBe(200);
    expect(first.body.customerName).toBe('First Warp');

    await request(app).post(`/api/v1/public/display/${first.body.id}/complete`).expect(200);

    const second = await request(app).post('/api/v1/public/display/next');
    expect(second.status).toBe(200);
    expect(second.body.customerName).toBe('Second Warp');

    await request(app).post(`/api/v1/public/display/${second.body.id}/complete`).expect(200);

    const final = await request(app).post('/api/v1/public/display/next');
    expect(final.status).toBe(204);
  });
});
