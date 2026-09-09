/**
 * middleware/apiKeyAuth.js
 * Validates the X-Webhook-Secret header against the env secret.
 * All webhook requests MUST pass this before reaching the controller.
 */

const logger = require('../utils/logger');

function apiKeyAuth(req, res, next) {
  const secret = req.headers['x-webhook-secret'];

  if (!secret) {
    logger.warn(`[Auth] Missing X-Webhook-Secret header — IP: ${req.ip}`);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: X-Webhook-Secret header is required',
    });
  }

  if (secret !== process.env.WEBHOOK_SECRET) {
    logger.warn(`[Auth] Invalid webhook secret — IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Invalid webhook secret',
    });
  }

  next();
}

module.exports = apiKeyAuth;
