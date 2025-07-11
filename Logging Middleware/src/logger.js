// Try to require axios, fallback to null if not available
let axios;
try {
  axios = require("axios");
} catch (error) {
  axios = null;
  console.warn("axios not available - remote logging will be disabled");
}

/**
 * Default configuration for the logger
 */
const DEFAULT_CONFIG = {
  apiUrl: "http://20.244.56.144/evaluation-service/logs",
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 5000,
  enableConsoleLog: true,
  enableMetadata: true,
};

/**
 * Logger class for handling log operations
 */
class Logger {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate log parameters
   */
  validateParams(stack, level, packageName, message) {
    const validStacks = ["backend", "frontend"];
    const validLevels = ["debug", "info", "warn", "error", "fatal"];

    if (!validStacks.includes(stack)) {
      throw new Error(
        `Invalid stack: ${stack}. Must be one of: ${validStacks.join(", ")}`
      );
    }

    if (!validLevels.includes(level)) {
      throw new Error(
        `Invalid level: ${level}. Must be one of: ${validLevels.join(", ")}`
      );
    }

    if (!packageName || typeof packageName !== "string") {
      throw new Error("Package name must be a non-empty string");
    }

    if (!message || typeof message !== "string") {
      throw new Error("Message must be a non-empty string");
    }
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Send log to remote server with retry logic
   */
  async sendLogToServer(payload) {
    // If axios is not available, skip remote logging
    if (!axios) {
      if (this.config.enableConsoleLog) {
        console.warn("Remote logging disabled - axios not available");
      }
      return;
    }

    let lastError = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await axios.post(this.config.apiUrl, payload, {
          timeout: this.config.timeout,
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "URL-Shortener-Logger/1.0.0",
          },
        });
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error;

        if (this.config.enableConsoleLog) {
          console.warn(
            `Log delivery attempt ${attempt} failed:`,
            error.message
          );
        }

        if (attempt < this.config.maxRetries) {
          await this.sleep(this.config.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    // All retries failed
    if (this.config.enableConsoleLog) {
      console.error(
        "Failed to deliver log after all retries. Falling back to console:",
        payload
      );
      console.error("Last error:", lastError.message);
    }
  }

  /**
   * Log to console with appropriate level
   */
  logToConsole(level, message, metadata) {
    if (!this.config.enableConsoleLog) return;

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case "debug":
        console.debug(logMessage, metadata || "");
        break;
      case "info":
        console.info(logMessage, metadata || "");
        break;
      case "warn":
        console.warn(logMessage, metadata || "");
        break;
      case "error":
      case "fatal":
        console.error(logMessage, metadata || "");
        break;
    }
  }

  /**
   * Main logging function
   */
  async log(stack, level, packageName, message, metadata = {}) {
    try {
      // Validate parameters
      this.validateParams(stack, level, packageName, message);

      // Create log payload
      const payload = {
        stack,
        level,
        package: packageName,
        message,
        timestamp: new Date().toISOString(),
        ...(this.config.enableMetadata && metadata && { metadata }),
      };

      // Log to console immediately
      this.logToConsole(level, message, metadata);

      // Send to remote server (async, don't wait)
      this.sendLogToServer(payload).catch((error) => {
        // Silent failure - already handled in sendLogToServer
      });
    } catch (error) {
      if (this.config.enableConsoleLog) {
        console.error("Logger error:", error.message);
      }
    }
  }

  /**
   * Convenience methods for different log levels
   */
  async debug(stack, packageName, message, metadata = {}) {
    return this.log(stack, "debug", packageName, message, metadata);
  }

  async info(stack, packageName, message, metadata = {}) {
    return this.log(stack, "info", packageName, message, metadata);
  }

  async warn(stack, packageName, message, metadata = {}) {
    return this.log(stack, "warn", packageName, message, metadata);
  }

  async error(stack, packageName, message, metadata = {}) {
    return this.log(stack, "error", packageName, message, metadata);
  }

  async fatal(stack, packageName, message, metadata = {}) {
    return this.log(stack, "fatal", packageName, message, metadata);
  }

  /**
   * Log an error object with structured information
   */
  async logError(stack, packageName, error, context = "", metadata = {}) {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.code && { code: error.code }),
    };

    const message = context ? `${context}: ${error.message}` : error.message;

    return this.log(stack, "error", packageName, message, {
      ...metadata,
      error: errorInfo,
    });
  }
}

/**
 * Global logger instance
 */
const logger = new Logger();

/**
 * Standalone Log function for easy import
 */
const Log = (stack, level, packageName, message, metadata = {}) => {
  return logger.log(stack, level, packageName, message, metadata);
};

module.exports = {
  Logger,
  logger,
  Log,
};
