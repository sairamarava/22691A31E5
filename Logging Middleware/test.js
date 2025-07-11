const { Log, logger } = require("./src/index");

console.log("🧪 Testing URL Shortener Logging Middleware");
console.log("===========================================\n");

// Test 1: Basic Log function
console.log("Test 1: Basic Log function");
Log("backend", "info", "test", "Testing basic log function");
Log("frontend", "debug", "test", "Testing frontend debug log");
Log("backend", "error", "test", "Testing error log with metadata", {
  testId: "test-001",
  timestamp: Date.now(),
});

// Test 2: Logger instance methods
console.log("\nTest 2: Logger instance methods");
logger.info("backend", "service", "URL shortening service started", {
  version: "1.0.0",
  environment: "test",
});

logger.warn("frontend", "component", "Component rendered with warnings", {
  componentName: "UrlForm",
  warnings: ["Missing prop validation"],
});

logger.error("backend", "database", "Database connection failed", {
  host: "localhost",
  port: 5432,
  error: "ECONNREFUSED",
});

// Test 3: Error logging
console.log("\nTest 3: Error logging");
const testError = new Error("Sample error for testing");
testError.code = "TEST_ERROR";
logger.logError("backend", "handler", testError, "Test error context", {
  requestId: "req-123",
  userId: "user-456",
});

// Test 4: URL Shortener specific logs
console.log("\nTest 4: URL Shortener specific logs");
Log(
  "backend",
  "info",
  "service",
  "New URL shortened successfully: abc123 → https://example.com",
  {
    originalUrl: "https://example.com",
    shortCode: "abc123",
    userId: "user-789",
  }
);

Log("backend", "error", "handler", "Shorten URL failed: invalid input type", {
  input: "not-a-url",
  validationError: "Invalid URL format",
});

Log("frontend", "info", "component", "URL shortening form submitted", {
  url: "https://test.com",
  userAgent: "Mozilla/5.0...",
});

// Test 5: Different log levels
console.log("\nTest 5: Different log levels");
logger.debug("backend", "debug-test", "Debug message for development");
logger.info("backend", "info-test", "Informational message");
logger.warn("backend", "warn-test", "Warning message");
logger.error("backend", "error-test", "Error message");
logger.fatal("backend", "fatal-test", "Fatal error message");

console.log("\n✅ All tests completed!");
console.log(
  "📡 Logs are being sent to: http://20.244.56.144/evaluation-service/logs"
);
console.log("🔍 Check the console output above for immediate feedback");
console.log(
  "⏱️  Remote logs will be delivered asynchronously with retry logic"
);

// Test validation errors
console.log("\n🔍 Testing validation (these should show errors):");

try {
  Log("invalid", "info", "test", "This should fail");
} catch (error) {
  console.log("✅ Validation caught invalid stack:", error.message);
}

try {
  Log("backend", "invalid", "test", "This should fail");
} catch (error) {
  console.log("✅ Validation caught invalid level:", error.message);
}

try {
  Log("backend", "info", "", "This should fail");
} catch (error) {
  console.log("✅ Validation caught empty package name:", error.message);
}

try {
  Log("backend", "info", "test", "");
} catch (error) {
  console.log("✅ Validation caught empty message:", error.message);
}

console.log(
  "\n🎉 Testing complete! You can now test with Postman or run the Express server."
);
