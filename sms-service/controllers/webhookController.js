/**
 * controllers/webhookController.js
 * ============================================================
 * POST /api/sms-webhook — core webhook handler.
 *
 * Pipeline:
 *   1. Hash raw SMS for dedup
 *   2. Log incoming webhook
 *   3. Check duplicate
 *   4. Parse SMS
 *   5. Filter non-transactions
 *   6. Detect category
 *   7. Resolve student_id
 *   8. Insert pending transaction
 *   9. Return structured response
 * ============================================================
 */

const { parseSms }           = require('../utils/smsParser');
const { detectCategory }     = require('../services/categoryService');
const { hashSms }            = require('../utils/hash');
const SmsTransaction         = require('../models/SmsTransaction');
const logger                 = require('../utils/logger');

/**
 * resolveStudentId
 * The SMS service needs a student_id to associate the transaction.
 * Priority: body.student_id → first student in DB (single-user mode).
 * In a multi-user deployment, you'd use JWT to identify the student.
 */
async function resolveStudentId(req) {
  if (req.body.student_id) return parseInt(req.body.student_id);

  // Single-user fallback: use the first student record
  const { pool } = require('../config/db');
  const [rows] = await pool.execute(
    `SELECT id FROM students ORDER BY id ASC LIMIT 1`
  );
  return rows.length > 0 ? rows[0].id : null;
}

/**
 * receiveSms — handles POST /api/sms-webhook
 */
async function receiveSms(req, res) {
  const { message, sender = '', timestamp } = req.body;
  const ip        = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  logger.info(`[Webhook] Received SMS from ${sender || 'UNKNOWN'} — IP: ${ip}`);

  // Step 1: Hash for deduplication
  const smsHash = hashSms(message, sender);

  // Step 2: Check duplicate BEFORE logging (avoid flooding webhook_logs)
  let isDup = false;
  try {
    isDup = await SmsTransaction.isDuplicate(smsHash);
  } catch (err) {
    logger.error('[Webhook] Duplicate check failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Database error during duplicate check' });
  }

  // Step 3: Parse SMS
  const parsed = parseSms(message, sender);

  // Step 4: Log to webhook_logs (async, don't block response)
  let webhookLogId = null;
  try {
    webhookLogId = await SmsTransaction.insertWebhookLog({
      sender,
      rawMessage:    message,
      smsHash,
      isDuplicate:   isDup,
      isTransaction: parsed?.isTransaction || false,
      parsedData:    parsed,
      httpStatus:    isDup ? 200 : (parsed?.isTransaction ? 201 : 200),
      ipAddress:     ip,
      userAgent,
    });
  } catch (err) {
    logger.warn('[Webhook] Failed to write webhook log', { error: err.message });
    // Non-fatal — continue processing
  }

  // Step 5: Return 200 if duplicate (idempotent)
  if (isDup) {
    logger.info(`[Webhook] Duplicate SMS detected — hash: ${smsHash.slice(0, 16)}...`);
    return res.status(200).json({
      success: true,
      duplicate: true,
      message: 'SMS already processed',
    });
  }

  // Step 6: Ignore non-transactional messages
  if (!parsed || !parsed.isTransaction) {
    logger.info(`[Webhook] Non-transactional SMS ignored — reason: ${parsed?.reason || 'unknown'}`);
    return res.status(200).json({
      success: true,
      transaction: false,
      message: 'SMS is not a bank transaction',
      reason: parsed?.reason || null,
    });
  }

  // Step 7: Detect category
  const category = detectCategory(parsed);
  parsed.category = category;

  // Step 8: Resolve student_id
  const studentId = await resolveStudentId(req);
  if (!studentId) {
    logger.error('[Webhook] No student found in DB — cannot associate transaction');
    return res.status(422).json({
      success: false,
      error: 'No user account found. Please register first.',
    });
  }

  // Step 9: Insert pending transaction
  let transactionId;
  try {
    transactionId = await SmsTransaction.insertSmsTransaction({
      studentId,
      amount:           parsed.amount,
      transactionType:  parsed.transactionType,
      merchant:         parsed.merchant,
      accountLast4:     parsed.accountLast4,
      category,
      rawMessage:       message,
      sender,
      refNumber:        parsed.refNumber,
      availableBalance: parsed.availableBalance,
      transactionDate:  parsed.transactionDate,
      smsHash,
      webhookLogId,
    });
  } catch (err) {
    logger.error('[Webhook] Failed to insert sms_transaction', { error: err.message });
    return res.status(500).json({ success: false, error: 'Failed to save transaction' });
  }

  logger.info(`[Webhook] Transaction saved — ID: ${transactionId}, type: ${parsed.transactionType}, amount: ₹${parsed.amount}`);

  return res.status(201).json({
    success:        true,
    transaction_id: transactionId,
    status:         'pending',
    parsed: {
      type:             parsed.type,
      transactionType:  parsed.transactionType,
      amount:           parsed.amount,
      merchant:         parsed.merchant,
      accountLast4:     parsed.accountLast4,
      category,
      refNumber:        parsed.refNumber,
      availableBalance: parsed.availableBalance,
      transactionDate:  parsed.transactionDate,
      channel:          parsed.channel,
      bank:             parsed.bank,
    },
  });
}

/**
 * healthCheck — GET /api/sms-webhook/health
 */
async function healthCheck(req, res) {
  try {
    const { pool } = require('../config/db');
    await pool.execute('SELECT 1');
    res.json({
      status: 'ok',
      service: 'expendicure-sms-service',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', error: err.message });
  }
}

module.exports = { receiveSms, healthCheck };
