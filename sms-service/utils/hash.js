/**
 * utils/hash.js
 * SHA-256 hashing utility for SMS deduplication.
 * Hashes the raw message + sender to produce a unique fingerprint.
 */

const crypto = require('crypto');

/**
 * hashSms(message, sender)
 * Produces a deterministic hex digest from message + sender.
 * Used as a UNIQUE constraint on sms_transactions to prevent duplicate insertions.
 *
 * @param {string} message
 * @param {string} sender
 * @returns {string} 64-character hex string (SHA-256)
 */
function hashSms(message, sender = '') {
  return crypto
    .createHash('sha256')
    .update(`${sender.trim()}::${message.trim()}`)
    .digest('hex');
}

module.exports = { hashSms };
