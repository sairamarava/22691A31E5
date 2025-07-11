const { logger } = require("./logger");

/**
 * Default configuration for request logging
 */
const DEFAULT_REQUEST_CONFIG = {
  logRequestBody: true,
  logResponseBody: false,
  sensitiveFields: ["password", "token", "authorization", "cookie"],
  maxBodySize: 1024, // 1KB
  skipSuccessfulRequests: false,
  skipPaths: ["/health", "/metrics", "/favicon.ico"],
};

/**
 * Sanitize sensitive data from objects
 */
function sanitizeData(data, sensitiveFields) {
  if (!data || typeof data !== "object") return data;

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}

/**
 * Truncate large objects/strings
 */
function truncateData(data, maxSize) {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  if (str.length > maxSize) {
    return str.substring(0, maxSize) + "... [TRUNCATED]";
  }
  return data;
}

/**
 * Extract request context for logging
 */
function extractRequestContext(req) {
  return {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
  };
}

/**
 * Express middleware for request logging
 */
function requestLogger(config = {}) {
  const finalConfig = { ...DEFAULT_REQUEST_CONFIG, ...config };

  return (req, res, next) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    // Skip certain paths
    if (finalConfig.skipPaths.includes(req.path)) {
      return next();
    }

    // Extract request context
    const context = extractRequestContext(req);

    // Sanitize and truncate request data
    const sanitizedContext = {
      ...context,
      body: finalConfig.logRequestBody
        ? truncateData(
            sanitizeData(context.body, finalConfig.sensitiveFields),
            finalConfig.maxBodySize
          )
        : undefined,
      headers: sanitizeData(context.headers, finalConfig.sensitiveFields),
    };

    // Log incoming request
    logger.info("backend", "middleware", `Incoming ${req.method} ${req.url}`, {
      requestId,
      ...sanitizedContext,
    });

    // Capture response
    const originalSend = res.send;
    let responseBody;

    res.send = function (data) {
      responseBody = data;
      return originalSend.call(this, data);
    };

    // Log response when request completes
    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const level =
        statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

      // Skip successful requests if configured
      if (finalConfig.skipSuccessfulRequests && statusCode < 400) {
        return;
      }

      const metadata = {
        requestId,
        statusCode,
        duration,
        method: req.method,
        url: req.url,
      };

      if (finalConfig.logResponseBody && responseBody) {
        metadata.responseBody = truncateData(
          responseBody,
          finalConfig.maxBodySize
        );
      }

      logger.log(
        "backend",
        level,
        "middleware",
        `${req.method} ${req.url} - ${statusCode} (${duration}ms)`,
        metadata
      );
    });

    next();
  };
}

/**
 * Middleware for handling uncaught errors
 */
function errorLogger() {
  return (error, req, res, next) => {
    const requestId = Math.random().toString(36).substr(2, 9);

    logger.logError("backend", "middleware", error, "Unhandled request error", {
      requestId,
      method: req.method,
      url: req.url,
      headers: sanitizeData(
        req.headers,
        DEFAULT_REQUEST_CONFIG.sensitiveFields
      ),
      body: req.body,
      params: req.params,
      query: req.query,
    });

    next(error);
  };
}

/**
 * Wrapper for controller functions to add logging
 */
function loggedController(packageName, controllerName, handler) {
  return async (req, res, next) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    try {
      logger.debug(
        "backend",
        packageName,
        `Controller ${controllerName} started`,
        {
          requestId,
          method: req.method,
          url: req.url,
        }
      );

      const result = await handler(req, res, next);

      const duration = Date.now() - startTime;
      logger.info(
        "backend",
        packageName,
        `Controller ${controllerName} completed successfully`,
        {
          requestId,
          duration,
          statusCode: res.statusCode,
        }
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logError(
        "backend",
        packageName,
        error,
        `Controller ${controllerName} failed`,
        {
          requestId,
          duration,
          method: req.method,
          url: req.url,
        }
      );

      next(error);
    }
  };
}

/**
 * Wrapper for service functions to add logging
 */
function loggedService(packageName, serviceName, serviceFunction) {
  return async (...args) => {
    const startTime = Date.now();
    const operationId = Math.random().toString(36).substr(2, 9);

    try {
      logger.debug("backend", packageName, `Service ${serviceName} started`, {
        operationId,
        args: args.length > 0 ? truncateData(args, 200) : undefined,
      });

      const result = await serviceFunction(...args);

      const duration = Date.now() - startTime;
      logger.info(
        "backend",
        packageName,
        `Service ${serviceName} completed successfully`,
        {
          operationId,
          duration,
          resultType: typeof result,
        }
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logError(
        "backend",
        packageName,
        error,
        `Service ${serviceName} failed`,
        {
          operationId,
          duration,
          args: args.length > 0 ? truncateData(args, 200) : undefined,
        }
      );

      throw error;
    }
  };
}

/**
 * Database query logger wrapper
 */
function loggedQuery(packageName, queryName, queryFunction) {
  return loggedService(packageName, `Query:${queryName}`, queryFunction)();
}

module.exports = {
  requestLogger,
  errorLogger,
  loggedController,
  loggedService,
  loggedQuery,
};
