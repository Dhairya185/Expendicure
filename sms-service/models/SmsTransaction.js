/**
 * models/SmsTransaction.js
 * ============================================================
 * Data Access Layer for sms_transactions and webhook_logs tables.
 * All queries use parameterized statements — SQL injection proof.
 * ============================================================
 */

const { pool } = require('../config/db');

// ─── Webhook Logs ─────────────────────────────────────────────────────────────

/**
 * insertWebhookLog — records every incoming webhook request.
 * @returns {number} insertId of the new webhook_logs row
 */
async function insertWebhookLog({ sender, rawMessage, smsHash, isDuplicate, isTransaction, parsedData, httpStatus, ipAddress, userAgent }) {
  const [result] = await pool.execute(
    `INSERT INTO webhook_logs
       (sender, raw_message, sms_hash, is_duplicate, is_transaction,
        parsed_data, http_status, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sender        || null,
      rawMessage,
      smsHash,
      isDuplicate   ? 1 : 0,
      isTransaction ? 1 : 0,
      parsedData ? JSON.stringify(parsedData) : null,
      httpStatus    || 200,
      ipAddress     || null,
      userAgent     || null,
    ]
  );
  return result.insertId;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

/**
 * isDuplicate — checks if an SMS has already been processed.
 * @returns {boolean}
 */
async function isDuplicate(smsHash) {
  const [rows] = await pool.execute(
    `SELECT id FROM sms_transactions WHERE sms_hash = ? LIMIT 1`,
    [smsHash]
  );
  return rows.length > 0;
}

// ─── SMS Transaction CRUD ─────────────────────────────────────────────────────

/**
 * insertSmsTransaction — insert a new pending transaction.
 * @returns {number} insertId
 */
async function insertSmsTransaction({
  studentId, amount, transactionType, merchant, accountLast4,
  category, rawMessage, sender, refNumber, availableBalance,
  transactionDate, smsHash, webhookLogId,
}) {
  const [result] = await pool.execute(
    `INSERT INTO sms_transactions
       (student_id, amount, transaction_type, merchant, account_last4,
        category, status, raw_message, sender, ref_number,
        available_balance, transaction_date, sms_hash, webhook_log_id)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
    [
      studentId,
      amount,
      transactionType  || 'Expense',
      merchant         || null,
      accountLast4     || null,
      category         || 'Uncategorized',
      rawMessage,
      sender           || null,
      refNumber        || null,
      availableBalance || null,
      transactionDate  ? new Date(transactionDate) : null,
      smsHash,
      webhookLogId     || null,
    ]
  );
  return result.insertId;
}

/**
 * getPendingTransactions — list all pending sms_transactions for a student.
 */
async function getPendingTransactions(studentId) {
  const [rows] = await pool.execute(
    `SELECT id, amount, transaction_type, merchant, account_last4, category,
            status, raw_message, sender, ref_number, available_balance,
            transaction_date, created_at
     FROM sms_transactions
     WHERE student_id = ? AND status = 'pending'
     ORDER BY created_at DESC`,
    [studentId]
  );
  return rows;
}

/**
 * getSmsTransactionById — get a single transaction (ownership checked).
 */
async function getSmsTransactionById(id, studentId) {
  const [rows] = await pool.execute(
    `SELECT * FROM sms_transactions WHERE id = ? AND student_id = ?`,
    [id, studentId]
  );
  return rows[0] || null;
}

/**
 * updateSmsTransaction — edit amount/merchant/category of a pending SMS tx.
 */
async function updateSmsTransaction(id, studentId, { amount, merchant, category }) {
  const fields = [];
  const values = [];

  if (amount    !== undefined) { fields.push('amount = ?');   values.push(amount);   }
  if (merchant  !== undefined) { fields.push('merchant = ?'); values.push(merchant); }
  if (category  !== undefined) { fields.push('category = ?'); values.push(category); }

  if (fields.length === 0) return false;

  values.push(id, studentId);
  const [result] = await pool.execute(
    `UPDATE sms_transactions SET ${fields.join(', ')} WHERE id = ? AND student_id = ?`,
    values
  );
  return result.affectedRows > 0;
}

/**
 * approveSmsTransaction — set status to 'approved'.
 * Also allows final edit of fields before approval.
 */
async function approveSmsTransaction(id, studentId, edits = {}) {
  // Apply any last-minute edits first
  if (Object.keys(edits).length > 0) {
    await updateSmsTransaction(id, studentId, edits);
  }

  const [result] = await pool.execute(
    `UPDATE sms_transactions SET status = 'approved' WHERE id = ? AND student_id = ? AND status = 'pending'`,
    [id, studentId]
  );
  return result.affectedRows > 0;
}

/**
 * deleteSmsTransaction — soft-mark as 'ignored' or hard delete.
 * We use hard delete for now (user explicitly dismissed it).
 */
async function deleteSmsTransaction(id, studentId) {
  const [result] = await pool.execute(
    `DELETE FROM sms_transactions WHERE id = ? AND student_id = ?`,
    [id, studentId]
  );
  return result.affectedRows > 0;
}

/**
 * getPendingCount — count of pending transactions for a student.
 * Used for the Dashboard badge.
 */
async function getPendingCount(studentId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count FROM sms_transactions WHERE student_id = ? AND status = 'pending'`,
    [studentId]
  );
  return rows[0].count;
}

module.exports = {
  insertWebhookLog,
  isDuplicate,
  insertSmsTransaction,
  getPendingTransactions,
  getSmsTransactionById,
  updateSmsTransaction,
  approveSmsTransaction,
  deleteSmsTransaction,
  getPendingCount,
};
