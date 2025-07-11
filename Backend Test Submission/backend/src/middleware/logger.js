const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, metadata = {}) {
    return JSON.stringify({
      timestamp: this.formatTimestamp(),
      level: level.toUpperCase(),
      message,
      metadata,
      pid: process.pid
    }) + '\n';
  }

  writeToFile(filename, content) {
    const filePath = path.join(this.logDir, filename);
    fs.appendFileSync(filePath, content);
  }

  info(message, metadata = {}) {
    const logEntry = this.formatMessage('info', message, metadata);
    this.writeToFile('app.log', logEntry);
    this.writeToFile('info.log', logEntry);
  }

  error(message, metadata = {}) {
    const logEntry = this.formatMessage('error', message, metadata);
    this.writeToFile('app.log', logEntry);
    this.writeToFile('error.log', logEntry);
  }

  warn(message, metadata = {}) {
    const logEntry = this.formatMessage('warn', message, metadata);
    this.writeToFile('app.log', logEntry);
    this.writeToFile('warn.log', logEntry);
  }

  debug(message, metadata = {}) {
    const logEntry = this.formatMessage('debug', message, metadata);
    this.writeToFile('app.log', logEntry);
    this.writeToFile('debug.log', logEntry);
  }

  http(req, res, responseTime) {
    const logEntry = this.formatMessage('http', 'HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      referrer: req.get('Referrer') || req.get('Referer')
    });
    this.writeToFile('app.log', logEntry);
    this.writeToFile('http.log', logEntry);
  }
}

// Singleton instance
const logger = new Logger();

// Middleware function
const loggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  });

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    logger.http(req, res, responseTime);
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = {
  logger,
  loggingMiddleware
};
