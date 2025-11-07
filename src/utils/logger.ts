/**
 * Logger - Global logging utility
 * Provides structured logging with different log levels
 * @module utils/logger
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enablePrefix: boolean;
}

/**
 * Logger class for structured logging
 */
class Logger {
  private config: LoggerConfig;

  /**
   * Create a new Logger instance
   */
  constructor() {
    this.config = {
      level: LogLevel.ERROR,
      enableTimestamp: false,
      enablePrefix: true,
    };

    // Set log level from environment or default to ERROR in production
    if (typeof window !== 'undefined') {
      const envLevel = (window as Window & { __LOG_LEVEL__?: LogLevel }).__LOG_LEVEL__;
      if (envLevel !== undefined) {
        this.config.level = envLevel;
      } else if (process.env.NODE_ENV === 'development') {
        this.config.level = LogLevel.DEBUG;
      }
    }
  }

  /**
   * Set log level
   * @param level - Log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   * @returns Current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Enable or disable timestamps
   * @param enable - Enable timestamps
   */
  setTimestamp(enable: boolean): void {
    this.config.enableTimestamp = enable;
  }

  /**
   * Enable or disable prefix
   * @param enable - Enable prefix
   */
  setPrefix(enable: boolean): void {
    this.config.enablePrefix = enable;
  }

  /**
   * Format log message
   * @private
   */
  private formatMessage(level: string, message: string, ...args: unknown[]): string {
    const parts: string[] = [];

    if (this.config.enableTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    if (this.config.enablePrefix) {
      parts.push(`[${level}]`);
    }

    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Log debug message
   * @param message - Log message
   * @param args - Additional arguments
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.config.level <= LogLevel.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message);
      if (args.length > 0) {
        console.debug(formatted, ...args);
      } else {
        console.debug(formatted);
      }
    }
  }

  /**
   * Log info message
   * @param message - Log message
   * @param args - Additional arguments
   */
  info(message: string, ...args: unknown[]): void {
    if (this.config.level <= LogLevel.INFO) {
      const formatted = this.formatMessage('INFO', message);
      if (args.length > 0) {
        console.info(formatted, ...args);
      } else {
        console.info(formatted);
      }
    }
  }

  /**
   * Log warning message
   * @param message - Log message
   * @param args - Additional arguments
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.config.level <= LogLevel.WARN) {
      const formatted = this.formatMessage('WARN', message);
      if (args.length > 0) {
        console.warn(formatted, ...args);
      } else {
        console.warn(formatted);
      }
    }
  }

  /**
   * Log error message
   * @param message - Log message
   * @param args - Additional arguments
   */
  error(message: string, ...args: unknown[]): void {
    if (this.config.level <= LogLevel.ERROR) {
      const formatted = this.formatMessage('ERROR', message);
      if (args.length > 0) {
        console.error(formatted, ...args);
      } else {
        console.error(formatted);
      }
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Export to window for global access
if (typeof window !== 'undefined') {
  (window as unknown as Window & { logger: Logger }).logger = logger;
}

// Export for module systems
export default logger;

