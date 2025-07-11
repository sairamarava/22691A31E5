const { Logger } = require("./logger");

/**
 * Frontend logger class extending the base logger
 */
class FrontendLogger extends Logger {
  constructor(config = {}) {
    super(config);
    this.browserConfig = {
      enableNetworkLogging: true,
      enableErrorTracking: true,
      enablePerformanceTracking: true,
      enableUserActions: false,
      maxLogBuffer: 100,
      ...config,
    };

    this.actionBuffer = [];
    this.errorCount = 0;
    this.isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    // Only initialize browser logging if we're in a browser environment
    if (typeof window !== "undefined") {
      this.initializeBrowserLogging();
    }
  }

  /**
   * Initialize browser-specific logging features
   */
  initializeBrowserLogging() {
    if (this.browserConfig.enableErrorTracking) {
      this.setupErrorTracking();
    }

    if (this.browserConfig.enablePerformanceTracking) {
      this.setupPerformanceTracking();
    }

    if (this.browserConfig.enableUserActions) {
      this.setupUserActionTracking();
    }

    if (this.browserConfig.enableNetworkLogging) {
      this.setupNetworkLogging();
    }

    this.setupOnlineOfflineTracking();
  }

  /**
   * Setup global error tracking
   */
  setupErrorTracking() {
    window.addEventListener("error", (event) => {
      this.errorCount++;
      const error = new Error(event.message);
      error.stack = event.error
        ? event.error.stack
        : "No stack trace available";

      this.logError("frontend", "global", error, "Global error", {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        errorCount: this.errorCount,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.errorCount++;
      const error = new Error(event.reason);

      this.logError(
        "frontend",
        "global",
        error,
        "Unhandled promise rejection",
        {
          reason: event.reason,
          errorCount: this.errorCount,
        }
      );
    });
  }

  /**
   * Setup performance tracking
   */
  setupPerformanceTracking() {
    window.addEventListener("load", () => {
      setTimeout(() => {
        const metrics = this.getPerformanceMetrics();
        this.info("frontend", "performance", "Page load completed", metrics);
      }, 0);
    });
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    const metrics = {};

    if (typeof performance !== "undefined") {
      const navigation = performance.getEntriesByType("navigation")[0];
      if (navigation) {
        metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        metrics.domContentLoaded =
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart;
      }

      // Paint metrics
      const paintEntries = performance.getEntriesByType("paint");
      paintEntries.forEach((entry) => {
        if (entry.name === "first-paint") {
          metrics.firstPaint = entry.startTime;
        } else if (entry.name === "first-contentful-paint") {
          metrics.firstContentfulPaint = entry.startTime;
        }
      });
    }

    return metrics;
  }

  /**
   * Setup user action tracking
   */
  setupUserActionTracking() {
    document.addEventListener("click", (event) => {
      const target = event.target;
      this.trackUserAction({
        type: "click",
        element:
          target.tagName +
          (target.id ? `#${target.id}` : "") +
          (target.className ? `.${target.className}` : ""),
        timestamp: Date.now(),
      });
    });

    document.addEventListener("input", (event) => {
      const target = event.target;
      this.trackUserAction({
        type: "input",
        element: target.tagName + (target.id ? `#${target.id}` : ""),
        value:
          target.type === "password"
            ? "[REDACTED]"
            : target.value.substring(0, 50),
        timestamp: Date.now(),
      });
    });

    window.addEventListener("popstate", () => {
      this.trackUserAction({
        type: "navigation",
        value: window.location.pathname,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Track user actions
   */
  trackUserAction(action) {
    this.actionBuffer.push(action);

    if (this.actionBuffer.length > this.browserConfig.maxLogBuffer) {
      this.actionBuffer.shift();
    }

    this.debug("frontend", "user-action", `User ${action.type}`, {
      element: action.element,
      value: action.value,
      recentActions: this.actionBuffer.slice(-5),
    });
  }

  /**
   * Setup network request logging
   */
  setupNetworkLogging() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (input, init = {}) => {
      const startTime = Date.now();
      const url = typeof input === "string" ? input : input.toString();
      const method = init.method || "GET";

      try {
        this.debug("frontend", "network", `${method} ${url} - Request started`);

        const response = await originalFetch(input, init);
        const duration = Date.now() - startTime;

        const level = response.ok ? "info" : "warn";
        this.log(
          "frontend",
          level,
          "network",
          `${method} ${url} - ${response.status} (${duration}ms)`,
          {
            status: response.status,
            statusText: response.statusText,
            duration,
          }
        );

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.logError(
          "frontend",
          "network",
          error,
          `${method} ${url} - Request failed`,
          {
            duration,
            isOnline: this.isOnline,
          }
        );
        throw error;
      }
    };
  }

  /**
   * Setup online/offline tracking
   */
  setupOnlineOfflineTracking() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.info("frontend", "network", "Connection restored");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.warn("frontend", "network", "Connection lost");
    });
  }

  /**
   * Log React component lifecycle events
   */
  logComponentLifecycle(componentName, lifecycle, props = {}, error = null) {
    const level = error ? "error" : "debug";
    const message = `Component ${componentName} ${lifecycle}`;

    if (error) {
      this.logError("frontend", "component", error, message, {
        componentName,
        lifecycle,
        props,
      });
    } else {
      this.log("frontend", level, "component", message, {
        componentName,
        lifecycle,
        props,
      });
    }
  }

  /**
   * Log URL shortener specific events
   */
  logUrlShortenerEvent(event, success, data = {}) {
    const level = success ? "info" : "error";
    const message = `URL shortener ${event} ${
      success ? "successful" : "failed"
    }`;

    this.log("frontend", level, "url-shortener", message, {
      event,
      success,
      ...data,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      timestamp: Date.now(),
    });
  }

  /**
   * Get current browser context for logging
   */
  getBrowserContext() {
    if (typeof window === "undefined") return {};

    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      performance: this.getPerformanceMetrics(),
    };
  }
}

/**
 * Global frontend logger instance
 */
const frontendLogger = new FrontendLogger();

/**
 * React hook for logging (for React applications)
 */
function useLogger() {
  return {
    log: frontendLogger.log.bind(frontendLogger),
    debug: frontendLogger.debug.bind(frontendLogger),
    info: frontendLogger.info.bind(frontendLogger),
    warn: frontendLogger.warn.bind(frontendLogger),
    error: frontendLogger.error.bind(frontendLogger),
    fatal: frontendLogger.fatal.bind(frontendLogger),
    logError: frontendLogger.logError.bind(frontendLogger),
    logComponentLifecycle:
      frontendLogger.logComponentLifecycle.bind(frontendLogger),
    logUrlShortenerEvent:
      frontendLogger.logUrlShortenerEvent.bind(frontendLogger),
    getBrowserContext: frontendLogger.getBrowserContext.bind(frontendLogger),
  };
}

module.exports = {
  FrontendLogger,
  frontendLogger,
  useLogger,
};
