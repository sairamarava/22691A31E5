// Simple test without axios dependency
const { Log } = require("./src/index");

console.log("🧪 Testing URL Shortener Logging Middleware (Local Only)");
console.log("======================================================\n");

// Test 1: Basic Log function
console.log("Test 1: Basic Log function");
Log("backend", "info", "test", "Testing basic log function");
Log("frontend", "debug", "test", "Testing frontend debug log");

// Test 2: URL Shortener specific logs
console.log("\nTest 2: URL Shortener specific logs");
Log(
  "backend",
  "info",
  "service",
  "New URL shortened successfully: abc123 → https://example.com"
);
Log("backend", "error", "handler", "Shorten URL failed: invalid input type");

console.log("\n✅ Local tests completed!");
console.log(
  "📡 Note: Network requests to remote server will fail without axios installed"
);
