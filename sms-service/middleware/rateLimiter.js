/**
 * middleware/rateLimiter.js
 * Applies express-rate-limit to all webhook routes.
 * Default: 20 requests per minute per IP.
 */

const rateLimit = require('express-rate-limit');
const logger    = require('../utils/logger');

const webhookLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60_000, // 1 minute
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 20,     // 20 requests/min
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (req, res) => {
    logger.warn(`[RateLimit] IP ${req.ip} exceeded webhook rate limit`);
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please slow down.',
    });
  },
});

module.exports = { webhookLimiter };
