/**
 * tests/webhook.test.js
 * ============================================================
 * Integration tests for POST /api/sms-webhook
 * Uses Jest + Supertest (no real DB — mocks the model layer).
 * ============================================================
 */

const request = require('supertest');

// Mock DB and model before importing app
jest.mock('../config/db', () => ({
  pool: {
    execute: jest.fn(),
    getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
  },
  testConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock('../models/SmsTransaction', () => ({
  isDuplicate:          jest.fn().mockResolvedValue(false),
  insertWebhookLog:     jest.fn().mockResolvedValue(1),
  insertSmsTransaction: jest.fn().mockResolvedValue(42),
}));

// Mock student resolution (resolveStudentId inside controller)
const { pool } = require('../config/db');
pool.execute.mockResolvedValue([[{ id: 1 }]]);

const app = require('../server');

const VALID_SECRET = 'exp_sms_secret_change_me_in_production';

// ─── Helper ───────────────────────────────────────────────────────────────────
function smsPost(body, secret = VALID_SECRET) {
  return request(app)
    .post('/api/sms-webhook')
    .set('X-Webhook-Secret', secret)
    .set('Content-Type', 'application/json')
    .send(body);
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe('POST /api/sms-webhook — Authentication', () => {
  test('Returns 401 when X-Webhook-Secret header is missing', async () => {
    const res = await request(app)
      .post('/api/sms-webhook')
      .send({ message: 'test', sender: 'SBIINB' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Unauthorized/i);
  });

  test('Returns 403 when wrong secret is provided', async () => {
    const res = await smsPost({ message: 'test', sender: 'SBIINB' }, 'WRONG_SECRET');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Forbidden/i);
  });
});

// ─── Validation Tests ─────────────────────────────────────────────────────────

describe('POST /api/sms-webhook — Validation', () => {
  test('Returns 400 when message is missing', async () => {
    const res = await smsPost({ sender: 'SBIINB' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Validation/i);
  });

  test('Returns 400 when message is too short', async () => {
    const res = await smsPost({ message: 'Hi', sender: 'SBIINB' });
    expect(res.status).toBe(400);
  });
});

// ─── Transaction Processing Tests ─────────────────────────────────────────────

describe('POST /api/sms-webhook — Processing', () => {
  test('Processes valid SBI debit SMS and returns 201', async () => {
    const res = await smsPost({
      sender:  'SBIINB',
      message: 'Your A/c No. XX1234 debited for Rs.1,500.00 on 03-08-2026. Info: UPI/Zomato. Avl Bal:Rs.45,230.50',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.transaction_id).toBe(42);
    expect(res.body.status).toBe('pending');
    expect(res.body.parsed.amount).toBe(1500);
    expect(res.body.parsed.transactionType).toBe('Expense');
    expect(res.body.parsed.category).toBe('Food'); // Zomato → Food
  });

  test('Returns 200 with transaction=false for OTP SMS', async () => {
    const res = await smsPost({
      sender:  'SBIINB',
      message: 'Your OTP for SBI Internet Banking is 453721. Do not share this with anyone.',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.transaction).toBe(false);
  });

  test('Returns 200 duplicate=true for already-seen SMS', async () => {
    // Override mock to return true for this test
    const SmsTransaction = require('../models/SmsTransaction');
    SmsTransaction.isDuplicate.mockResolvedValueOnce(true);

    const res = await smsPost({
      sender:  'HDFCBK',
      message: 'Rs.850.00 debited from HDFC Bank Acct **3456 to VPA swiggy@paytm on 03-08-2026.',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.duplicate).toBe(true);
  });

  test('Detects Salary credit correctly', async () => {
    const res = await smsPost({
      sender:  'HDFCBK',
      message: 'Your A/c XX9999 credited with Rs.75,000.00 via NEFT. Info: SALARY Aug 2026. Avl Bal: Rs.90,000.00',
    });

    expect(res.status).toBe(201);
    expect(res.body.parsed.transactionType).toBe('Income');
    expect(res.body.parsed.category).toBe('Salary');
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────

describe('GET /api/sms-webhook/health', () => {
  test('Returns 200 with status ok', async () => {
    pool.execute.mockResolvedValueOnce([[{ 1: 1 }]]);
    const res = await request(app).get('/api/sms-webhook/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
