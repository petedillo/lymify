/**
 * Logger utility for the application
 * Enabled in development mode but disabled in production
 */

const config = require('../config');

/**
 * Check if the application is running in development mode
 * @returns {boolean} True if in development mode, false otherwise
 */
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV;
};

/**
 * Log information messages
 * @param {...any} args - Arguments to log
 */
const info = (...args) => {
  if (isDevelopment()) {
    console.log('[INFO]', ...args);
  }
};

/**
 * Log warning messages
 * @param {...any} args - Arguments to log
 */
const warn = (...args) => {
  if (isDevelopment()) {
    console.warn('[WARN]', ...args);
  }
};

/**
 * Log error messages
 * @param {...any} args - Arguments to log
 */
const error = (...args) => {
  if (isDevelopment()) {
    console.error('[ERROR]', ...args);
  }
};

/**
 * Log debug messages
 * @param {...any} args - Arguments to log
 */
const debug = (...args) => {
  if (isDevelopment()) {
    console.log('[DEBUG]', ...args);
  }
};

module.exports = {
  info,
  warn,
  error,
  debug
};
