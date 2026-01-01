/**
 * @fileoverview Structured logging module using pino
 *
 * Provides a configured pino logger with:
 * - JSON output for production
 * - Pretty-printed output for development
 * - Configurable log levels via LOG_LEVEL env var
 *
 * @module lib/logger
 */

import pino from 'pino';

/**
 * Determine if we're in development mode
 * @type {boolean}
 */
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Logger configuration
 * @type {import('pino').LoggerOptions}
 */
const config = {
  level: process.env.LOG_LEVEL || 'info',

  // Add base context to all logs
  base: {
    service: 'mission-control',
    pid: process.pid
  },

  // Timestamp in ISO format
  timestamp: pino.stdTimeFunctions.isoTime
};

// In development, use pino-pretty for readable output
if (isDev) {
  config.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname,service'
    }
  };
}

/**
 * Configured pino logger instance
 *
 * @example
 * import logger from './lib/logger.js';
 *
 * logger.info('Server started');
 * logger.info({ port: 3847 }, 'Listening');
 * logger.error({ err }, 'Failed to parse');
 * logger.debug({ path }, 'File changed');
 *
 * @type {import('pino').Logger}
 */
const logger = pino(config);

/**
 * Create a child logger with additional context
 *
 * @example
 * const wsLogger = createChild({ component: 'websocket' });
 * wsLogger.info('Client connected');
 *
 * @param {Object} bindings - Additional context to include in logs
 * @returns {import('pino').Logger} Child logger instance
 */
export function createChild(bindings) {
  return logger.child(bindings);
}

export default logger;

