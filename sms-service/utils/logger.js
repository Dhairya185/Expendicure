/**
 * utils/logger.js
 * Winston-based structured logger.
 * Logs to console (dev) and to /logs/*.log files (production).
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs   = require('fs');

// Ensure logs directory exists
const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  defaultMeta: { service: 'expendicure-sms-service' },
  transports: [
    // Console — colourised in dev
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? JSON.stringify(meta, null, 0)
            : '';
          return `[${timestamp}] ${level}: ${message} ${metaStr}`;
        }),
      ),
    }),
    // File — errors
    new transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
    }),
    // File — combined
    new transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
    }),
  ],
});

module.exports = logger;
