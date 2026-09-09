/**
 * config/db.js
 * MySQL2 connection pool for the SMS webhook service.
 * Uses environment variables — never hardcode credentials.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'expendicure',
  port:               parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+05:30',              // IST — matches Indian bank timestamps
  charset:            'utf8mb4',
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
});

/**
 * Test the DB connection on startup.
 * Logs success or throws to crash-fast on misconfiguration.
 */
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('[DB] MySQL connection pool established ✓');
    conn.release();
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
