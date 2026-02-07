/**
 * Simple logging utility for the application
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[37m', // White
  RESET: '\x1b[0m'   // Reset
};

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'INFO';
    this.currentLevel = LOG_LEVELS[this.level] || LOG_LEVELS.INFO;
  }

  /**
   * Format log message with timestamp and level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   * @returns {string} Formatted log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const color = LOG_COLORS[level] || LOG_COLORS.RESET;
    const reset = LOG_COLORS.RESET;
    
    let formattedMessage = `${color}[${timestamp}] ${level}: ${message}${reset}`;
    
    if (Object.keys(meta).length > 0) {
      formattedMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return formattedMessage;
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    if (this.currentLevel >= LOG_LEVELS.ERROR) {
      console.error(this.formatMessage('ERROR', message, meta));
    }
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    if (this.currentLevel >= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage('WARN', message, meta));
    }
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    if (this.currentLevel >= LOG_LEVELS.INFO) {
      console.log(this.formatMessage('INFO', message, meta));
    }
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (this.currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, meta));
    }
  }

  /**
   * Log authentication events
   * @param {string} event - Event type
   * @param {Object} details - Event details
   */
  auth(event, details = {}) {
    this.info(`AUTH: ${event}`, {
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log security events
   * @param {string} event - Security event
   * @param {Object} details - Event details
   */
  security(event, details = {}) {
    this.warn(`SECURITY: ${event}`, {
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log database operations
   * @param {string} operation - Database operation
   * @param {Object} details - Operation details
   */
  database(operation, details = {}) {
    this.debug(`DATABASE: ${operation}`, {
      ...details,
      timestamp: new Date().toISOString()
    });
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;