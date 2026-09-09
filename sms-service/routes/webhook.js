/**
 * routes/webhook.js
 * Defines all SMS webhook routes with middleware chain.
 */

const router     = require('express').Router();
const { validateWebhookBody, handleValidationErrors } = require('../middleware/requestValidator');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const { webhookLimiter }  = require('../middleware/rateLimiter');
const { receiveSms, healthCheck } = require('../controllers/webhookController');

// GET /api/sms-webhook/health — no auth needed (monitoring)
router.get('/health', healthCheck);

// POST /api/sms-webhook — full security middleware chain
router.post(
  '/',
  webhookLimiter,
  apiKeyAuth,
  validateWebhookBody,
  handleValidationErrors,
  receiveSms,
);

module.exports = router;
