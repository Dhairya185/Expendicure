/**
 * server.js — Expendicure SMS Webhook Microservice Entry Point
 * ============================================================
 * Express server with:
 *   - Helmet (security headers)
 *   - CORS (restricted to frontend origin)
 *   - Morgan (HTTP request logging)
 *   - JSON body parsing (5kb limit)
 *   - SMS webhook routes
 * ============================================================
 */

require('dotenv').config();

const express  = require('express');
const helmet   = require('helmet');
const cors     = require('cors');
const morgan   = require('morgan');
const logger   = require('./utils/logger');
const { testConnection } = require('./config/db');
const webhookRouter      = require('./routes/webhook');

const app  = express();
const PORT = parseInt(process.env.PORT) || 4000;

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — only allow the configured frontend origin ─────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods:     ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Webhook-Secret', 'Authorization'],
}));

// ── HTTPS enforcement (behind proxy in prod) ──────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// ── Body parsing (hard-limit 5kb to prevent abuse) ───────────────────────────
app.use(express.json({ limit: '5kb' }));
app.use(express.urlencoded({ extended: false, limit: '5kb' }));

// ── HTTP request logging ──────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/sms-webhook', webhookRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service:  'Expendicure SMS Webhook Microservice',
    version:  '1.0.0',
    status:   'running',
    docs:     'POST /api/sms-webhook with X-Webhook-Secret header',
    health:   'GET /api/sms-webhook/health',
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Cannot ${req.method} ${req.path}` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  logger.error('[Server] Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  await testConnection();   // Crash fast if DB is misconfigured

  app.listen(PORT, () => {
    logger.info(`🚀 SMS Webhook Service running on http://localhost:${PORT}`);
    logger.info(`   Webhook endpoint: POST http://localhost:${PORT}/api/sms-webhook`);
    logger.info(`   Health check:     GET  http://localhost:${PORT}/api/sms-webhook/health`);
  });
}

start().catch(err => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});

module.exports = app; // exported for Jest supertest
