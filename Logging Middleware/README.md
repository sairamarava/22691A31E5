# URL Shortener Logging Middleware

A simple, reusable logging middleware package for full-stack URL shortener web applications. This package provides structured logging with automatic retry logic and context-rich information.

## Features

- **Framework-agnostic**: Works with any Node.js backend and frontend framework
- **Reliable delivery**: Automatic retry logic with exponential backoff
- **Context-rich logging**: Includes metadata, error information, and performance metrics
- **Production-ready**: Lightweight and optimized for production environments
- **Easy integration**: Simple API for both backend and frontend

## Installation

```bash
npm install
```

## Quick Start

### Basic Logging

```javascript
const { Log } = require("./src/index");

// Simple logging
Log(
  "backend",
  "info",
  "service",
  "New URL shortened successfully: abc123 → https://example.com"
);
Log("backend", "error", "handler", "Shorten URL failed: invalid input type");
```

### Backend Express Integration

```javascript
const express = require("express");
const { requestLogger, errorLogger, loggedController } = require("./src/index");

const app = express();

// Add request logging middleware
app.use(requestLogger());

// Add error logging middleware
app.use(errorLogger());

// Use logged controller wrapper
app.post(
  "/shorten",
  loggedController("handler", "shortenUrl", async (req, res) => {
    // Your controller logic here
    res.json({ shortUrl: "abc123" });
  })
);
```

### Frontend Integration

```javascript
const { frontendLogger } = require("./src/index");

// Log URL shortener events
frontendLogger.logUrlShortenerEvent("shorten", true, {
  originalUrl: "https://example.com",
  shortCode: "abc123",
});

// Log component lifecycle (for React)
frontendLogger.logComponentLifecycle("UrlShortener", "mount", {
  url: "https://example.com",
});
```

## API Reference

### Core Functions

#### `Log(stack, level, package, message, metadata)`

Main logging function that sends logs to the remote server.

**Parameters:**

- `stack` (string): "backend" or "frontend"
- `level` (string): "debug", "info", "warn", "error", or "fatal"
- `package` (string): Package/module name
- `message` (string): Log message
- `metadata` (object, optional): Additional context data

**Examples:**

```javascript
Log("backend", "info", "service", "URL shortened successfully", {
  shortCode: "abc123",
});
Log("frontend", "error", "component", "Failed to load component", {
  componentName: "UrlForm",
});
```

### Backend Middleware

#### `requestLogger(config)`

Express middleware for logging HTTP requests and responses.

**Configuration options:**

- `logRequestBody` (boolean): Log request body (default: true)
- `logResponseBody` (boolean): Log response body (default: false)
- `sensitiveFields` (array): Fields to redact (default: ['password', 'token', 'authorization', 'cookie'])
- `maxBodySize` (number): Maximum body size to log (default: 1024 bytes)
- `skipSuccessfulRequests` (boolean): Skip logging successful requests (default: false)
- `skipPaths` (array): Paths to skip logging (default: ['/health', '/metrics', '/favicon.ico'])

#### `errorLogger()`

Express middleware for logging unhandled errors.

#### `loggedController(packageName, controllerName, handler)`

Wrapper for controller functions to add automatic logging.

#### `loggedService(packageName, serviceName, serviceFunction)`

Wrapper for service functions to add automatic logging.

#### `loggedQuery(packageName, queryName, queryFunction)`

Wrapper for database queries to add automatic logging.

### Frontend Logger

#### `frontendLogger.logUrlShortenerEvent(event, success, data)`

Log URL shortener specific events.

**Parameters:**

- `event` (string): Event type ('shorten', 'redirect', 'analytics', 'copy', 'share')
- `success` (boolean): Whether the event was successful
- `data` (object, optional): Additional event data

#### `frontendLogger.logComponentLifecycle(componentName, lifecycle, props, error)`

Log React component lifecycle events.

**Parameters:**

- `componentName` (string): Name of the component
- `lifecycle` (string): Lifecycle event ('mount', 'update', 'unmount', 'error')
- `props` (object, optional): Component props
- `error` (Error, optional): Error object if lifecycle event failed

## Configuration

### Logger Configuration

```javascript
const { Logger } = require("./src/index");

const customLogger = new Logger({
  apiUrl: "http://20.244.56.144/evaluation-service/logs",
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 5000,
  enableConsoleLog: true,
  enableMetadata: true,
});
```

### Frontend Configuration

```javascript
const { FrontendLogger } = require("./src/index");

const customFrontendLogger = new FrontendLogger({
  enableNetworkLogging: true,
  enableErrorTracking: true,
  enablePerformanceTracking: true,
  enableUserActions: false,
  maxLogBuffer: 100,
});
```

## Best Practices

1. **Use descriptive messages**: Include relevant IDs, method names, and context
2. **Include metadata**: Add structured data to help with debugging
3. **Use appropriate log levels**: debug < info < warn < error < fatal
4. **Avoid logging sensitive data**: The middleware automatically redacts common sensitive fields
5. **Use structured logging**: Include context like request IDs, user IDs, etc.

## Examples

### URL Shortener Backend Example

```javascript
const express = require("express");
const {
  requestLogger,
  errorLogger,
  loggedService,
  Log,
} = require("./src/index");

const app = express();

app.use(requestLogger());

const shortenUrlService = loggedService(
  "service",
  "shortenUrl",
  async (originalUrl) => {
    // Simulate URL shortening logic
    const shortCode = Math.random().toString(36).substr(2, 8);

    Log(
      "backend",
      "info",
      "service",
      `URL shortened successfully: ${shortCode} → ${originalUrl}`,
      {
        originalUrl,
        shortCode,
        timestamp: Date.now(),
      }
    );

    return { shortCode, originalUrl };
  }
);

app.post("/shorten", async (req, res) => {
  try {
    const { url } = req.body;
    const result = await shortenUrlService(url);
    res.json(result);
  } catch (error) {
    Log("backend", "error", "handler", "Failed to shorten URL", {
      error: error.message,
      requestBody: req.body,
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use(errorLogger());
```

### Frontend React Example

```javascript
import React, { useState } from "react";
import { useLogger } from "./src/index";

function UrlShortener() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const logger = useLogger();

  React.useEffect(() => {
    logger.logComponentLifecycle("UrlShortener", "mount", { initialUrl: url });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      setShortUrl(data.shortCode);

      logger.logUrlShortenerEvent("shorten", true, {
        originalUrl: url,
        shortCode: data.shortCode,
        responseTime: Date.now(),
      });
    } catch (error) {
      logger.logUrlShortenerEvent("shorten", false, {
        originalUrl: url,
        error: error.message,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL to shorten"
        required
      />
      <button type="submit">Shorten</button>
      {shortUrl && <p>Short URL: {shortUrl}</p>}
    </form>
  );
}
```

## License

MIT
