const {
  Log,
  logger,
  requestLogger,
  errorLogger,
  frontendLogger,
} = require("./src/index");

// Example 1: Basic logging
console.log("=== Basic Logging Examples ===");

// Backend service logging
Log(
  "backend",
  "info",
  "service",
  "New URL shortened successfully: abc123 → https://example.com"
);
Log("backend", "error", "handler", "Shorten URL failed: invalid input type");
Log("backend", "debug", "database", "Query executed successfully", {
  query: "SELECT * FROM urls WHERE short_code = ?",
  params: ["abc123"],
  executionTime: "15ms",
});

// Frontend logging
Log("frontend", "info", "component", "URL form submitted", {
  url: "https://example.com",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
});

// Example 2: Logger with metadata
console.log("\n=== Logger with Metadata Examples ===");

logger.info("backend", "service", "URL shortening operation started", {
  requestId: "req-123",
  userId: "user-456",
  originalUrl: "https://www.verylongurl.com/path/to/resource",
  timestamp: Date.now(),
});

logger.error("backend", "database", "Connection failed", {
  connectionString: "postgresql://localhost:5432/urlshortener",
  error: "ECONNREFUSED",
  retryAttempt: 3,
});

// Example 3: Error logging
console.log("\n=== Error Logging Examples ===");

const sampleError = new Error("Database connection timeout");
sampleError.code = "ETIMEDOUT";

logger.logError(
  "backend",
  "database",
  sampleError,
  "Failed to connect to database",
  {
    host: "localhost",
    port: 5432,
    database: "urlshortener",
    timeout: 5000,
  }
);

// Example 4: Frontend URL shortener events
console.log("\n=== Frontend URL Shortener Events ===");

frontendLogger.logUrlShortenerEvent("shorten", true, {
  originalUrl: "https://example.com",
  shortCode: "abc123",
  responseTime: 250,
});

frontendLogger.logUrlShortenerEvent("redirect", true, {
  shortCode: "abc123",
  originalUrl: "https://example.com",
  userAgent: "Mozilla/5.0...",
  referrer: "https://google.com",
});

frontendLogger.logUrlShortenerEvent("copy", true, {
  shortCode: "abc123",
  method: "clipboard-api",
});

// Example 5: Component lifecycle logging
console.log("\n=== Component Lifecycle Examples ===");

frontendLogger.logComponentLifecycle("UrlShortener", "mount", {
  props: { initialUrl: "" },
  state: { loading: false },
});

frontendLogger.logComponentLifecycle("UrlForm", "update", {
  prevProps: { url: "" },
  nextProps: { url: "https://example.com" },
});

const componentError = new Error("Failed to render component");
frontendLogger.logComponentLifecycle(
  "UrlList",
  "error",
  {
    props: { urls: [] },
  },
  componentError
);

// Example 6: Service and query logging helpers
console.log("\n=== Service and Query Examples ===");

// Simulate a service function
const urlShorteningService = async (originalUrl) => {
  // Simulate some processing time
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (!originalUrl || !originalUrl.startsWith("http")) {
    throw new Error("Invalid URL format");
  }

  const shortCode = Math.random().toString(36).substr(2, 8);
  return { shortCode, originalUrl };
};

// Simulate a database query
const findUrlByShortCode = async (shortCode) => {
  // Simulate query time
  await new Promise((resolve) => setTimeout(resolve, 50));

  if (shortCode === "abc123") {
    return {
      id: 1,
      shortCode,
      originalUrl: "https://example.com",
      createdAt: new Date(),
    };
  }

  return null;
};

// Example usage with logging wrappers
(async () => {
  try {
    console.log("\n=== Async Operations Examples ===");

    // Log a successful service call
    const result = await urlShorteningService("https://example.com");
    logger.info("backend", "service", "URL shortening completed", {
      originalUrl: "https://example.com",
      shortCode: result.shortCode,
      processingTime: "100ms",
    });

    // Log a database query
    const urlRecord = await findUrlByShortCode("abc123");
    logger.info("backend", "database", "URL lookup completed", {
      shortCode: "abc123",
      found: !!urlRecord,
      queryTime: "50ms",
    });

    // Log a failed operation
    try {
      await urlShorteningService("invalid-url");
    } catch (error) {
      logger.logError("backend", "service", error, "URL shortening failed", {
        input: "invalid-url",
        validation: "URL format check failed",
      });
    }
  } catch (error) {
    logger.logError("backend", "example", error, "Example execution failed");
  }
})();

console.log("\n=== All examples completed ===");
console.log(
  "Check the console output above and monitor the remote logging endpoint for delivered logs."
);
console.log(
  "Note: Network requests to the logging endpoint will be sent asynchronously."
);

// Example 7: Performance and analytics logging
setTimeout(() => {
  console.log("\n=== Performance Analytics Examples ===");

  // Log performance metrics
  logger.info("frontend", "performance", "Page load completed", {
    loadTime: 1250,
    domContentLoaded: 800,
    firstPaint: 600,
    largestContentfulPaint: 1100,
  });

  // Log user analytics
  logger.info("frontend", "analytics", "User interaction recorded", {
    action: "button-click",
    element: "shorten-button",
    timestamp: Date.now(),
    sessionId: "session-789",
  });

  // Log business metrics
  logger.info("backend", "metrics", "Daily URL shortening stats", {
    totalUrls: 1500,
    uniqueUsers: 350,
    clicksToday: 2850,
    topDomain: "example.com",
    avgResponseTime: "180ms",
  });
}, 2000);
