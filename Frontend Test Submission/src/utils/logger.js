class FrontendLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.sessionId = this.generateSessionId();
    this.init();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  init() {
    this.info('Frontend Logger initialized', { sessionId: this.sessionId });
  }

  formatLogEntry(level, message, metadata = {}) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      metadata: {
        ...metadata,
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent
      },
      id: Date.now() + Math.random()
    };
  }

  addLog(logEntry) {
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    try {
      const recentLogs = this.logs.slice(0, 100);
      localStorage.setItem('app_logs', JSON.stringify(recentLogs));
    } catch (error) {
      // Silent fail for storage errors
    }
  }

  info(message, metadata = {}) {
    const logEntry = this.formatLogEntry('info', message, metadata);
    this.addLog(logEntry);
  }

  error(message, metadata = {}) {
    const logEntry = this.formatLogEntry('error', message, metadata);
    this.addLog(logEntry);
  }

  warn(message, metadata = {}) {
    const logEntry = this.formatLogEntry('warn', message, metadata);
    this.addLog(logEntry);
  }

  debug(message, metadata = {}) {
    const logEntry = this.formatLogEntry('debug', message, metadata);
    this.addLog(logEntry);
  }

  userAction(action, metadata = {}) {
    this.info(`User Action: ${action}`, {
      ...metadata,
      actionType: 'user_interaction'
    });
  }

  apiCall(method, url, status, responseTime, metadata = {}) {
    const level = status >= 400 ? 'error' : 'info';
    this[level](`API Call: ${method} ${url}`, {
      ...metadata,
      method,
      url,
      status,
      responseTime,
      actionType: 'api_call'
    });
  }

  navigation(from, to, metadata = {}) {
    this.info('Navigation', {
      ...metadata,
      from,
      to,
      actionType: 'navigation'
    });
  }

  getLogs(level = null, limit = 50) {
    let filteredLogs = this.logs;
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level.toUpperCase());
    }
    return filteredLogs.slice(0, limit);
  }

  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('app_logs');
    } catch (error) {
      // Silent fail for storage errors
    }
    this.info('Logs cleared');
  }
}

const logger = new FrontendLogger();

window.addEventListener('error', (event) => {
  logger.error('Unhandled Error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection', {
    reason: event.reason,
    stack: event.reason?.stack
  });
});

export default logger;
