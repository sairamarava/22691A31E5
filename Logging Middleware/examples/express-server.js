const express = require("express");
const {
  requestLogger,
  errorLogger,
  loggedController,
  loggedService,
  Log,
} = require("../src/index");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(
  requestLogger({
    logRequestBody: true,
    logResponseBody: false,
    skipSuccessfulRequests: false,
    skipPaths: ["/health"],
  })
);

// Mock database
const urlDatabase = new Map();

// Service functions with logging
const shortenUrlService = loggedService(
  "service",
  "shortenUrl",
  async (originalUrl, userId = null) => {
    // Validate URL
    if (!originalUrl || !originalUrl.startsWith("http")) {
      throw new Error("Invalid URL format");
    }

    // Check if URL already exists
    for (const [shortCode, data] of urlDatabase.entries()) {
      if (data.originalUrl === originalUrl) {
        Log(
          "backend",
          "info",
          "service",
          "URL already exists, returning existing short code",
          {
            originalUrl,
            existingShortCode: shortCode,
            userId,
          }
        );
        return { shortCode, originalUrl, isExisting: true };
      }
    }

    // Generate new short code
    const shortCode = Math.random().toString(36).substr(2, 8);

    // Store in database
    urlDatabase.set(shortCode, {
      originalUrl,
      shortCode,
      createdAt: new Date(),
      userId,
      clicks: 0,
    });

    Log(
      "backend",
      "info",
      "service",
      `New URL shortened successfully: ${shortCode} → ${originalUrl}`,
      {
        originalUrl,
        shortCode,
        userId,
        totalUrls: urlDatabase.size,
      }
    );

    return { shortCode, originalUrl, isExisting: false };
  }
);

const getUrlService = loggedService("service", "getUrl", async (shortCode) => {
  const urlData = urlDatabase.get(shortCode);

  if (!urlData) {
    Log("backend", "warn", "service", `Short code not found: ${shortCode}`, {
      shortCode,
      totalUrls: urlDatabase.size,
    });
    return null;
  }

  // Increment click count
  urlData.clicks++;

  Log(
    "backend",
    "info",
    "service",
    `URL redirect for ${shortCode} → ${urlData.originalUrl}`,
    {
      shortCode,
      originalUrl: urlData.originalUrl,
      clicks: urlData.clicks,
      userId: urlData.userId,
    }
  );

  return urlData;
});

const getAnalyticsService = loggedService(
  "service",
  "getAnalytics",
  async (shortCode) => {
    const urlData = urlDatabase.get(shortCode);

    if (!urlData) {
      return null;
    }

    const analytics = {
      shortCode: urlData.shortCode,
      originalUrl: urlData.originalUrl,
      clicks: urlData.clicks,
      createdAt: urlData.createdAt,
      userId: urlData.userId,
    };

    Log("backend", "info", "service", `Analytics retrieved for ${shortCode}`, {
      shortCode,
      clicks: urlData.clicks,
      createdAt: urlData.createdAt,
    });

    return analytics;
  }
);

// Routes with logged controllers
app.post(
  "/shorten",
  loggedController("handler", "shortenUrl", async (req, res) => {
    const { url, userId } = req.body;

    if (!url) {
      Log(
        "backend",
        "error",
        "handler",
        "Shorten URL failed: missing URL parameter",
        {
          requestBody: req.body,
          userAgent: req.get("User-Agent"),
        }
      );
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const result = await shortenUrlService(url, userId);

      res.json({
        success: true,
        shortCode: result.shortCode,
        shortUrl: `http://localhost:${PORT}/${result.shortCode}`,
        originalUrl: result.originalUrl,
        isExisting: result.isExisting,
      });
    } catch (error) {
      Log("backend", "error", "handler", "Shorten URL failed: service error", {
        error: error.message,
        url,
        userId,
        stack: error.stack,
      });

      res.status(500).json({ error: "Failed to shorten URL" });
    }
  })
);

app.get(
  "/:shortCode",
  loggedController("handler", "redirectUrl", async (req, res) => {
    const { shortCode } = req.params;

    try {
      const urlData = await getUrlService(shortCode);

      if (!urlData) {
        Log(
          "backend",
          "warn",
          "handler",
          `Redirect failed: short code not found: ${shortCode}`,
          {
            shortCode,
            userAgent: req.get("User-Agent"),
            referrer: req.get("Referrer"),
          }
        );
        return res.status(404).json({ error: "Short URL not found" });
      }

      // Log successful redirect
      Log(
        "backend",
        "info",
        "handler",
        `Successful redirect: ${shortCode} → ${urlData.originalUrl}`,
        {
          shortCode,
          originalUrl: urlData.originalUrl,
          clicks: urlData.clicks,
          userAgent: req.get("User-Agent"),
          referrer: req.get("Referrer"),
        }
      );

      res.redirect(urlData.originalUrl);
    } catch (error) {
      Log("backend", "error", "handler", "Redirect failed: service error", {
        error: error.message,
        shortCode,
        stack: error.stack,
      });

      res.status(500).json({ error: "Internal server error" });
    }
  })
);

app.get(
  "/analytics/:shortCode",
  loggedController("handler", "getAnalytics", async (req, res) => {
    const { shortCode } = req.params;

    try {
      const analytics = await getAnalyticsService(shortCode);

      if (!analytics) {
        return res.status(404).json({ error: "Short URL not found" });
      }

      res.json(analytics);
    } catch (error) {
      Log("backend", "error", "handler", "Analytics retrieval failed", {
        error: error.message,
        shortCode,
        stack: error.stack,
      });

      res.status(500).json({ error: "Failed to retrieve analytics" });
    }
  })
);

// Health check endpoint (skipped by request logger)
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Get all URLs (for testing)
app.get(
  "/urls",
  loggedController("handler", "getAllUrls", async (req, res) => {
    const urls = Array.from(urlDatabase.values());

    Log("backend", "info", "handler", "All URLs retrieved", {
      totalUrls: urls.length,
      userAgent: req.get("User-Agent"),
    });

    res.json(urls);
  })
);

// Error handling middleware
app.use(errorLogger());

// Global error handler
app.use((error, req, res, next) => {
  Log("backend", "fatal", "server", "Unhandled server error", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  Log(
    "backend",
    "info",
    "server",
    `URL shortener server started on port ${PORT}`,
    {
      port: PORT,
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    }
  );

  console.log(
    `🚀 URL Shortener API server running on http://localhost:${PORT}`
  );
  console.log(`📊 Try these endpoints:`);
  console.log(`   POST /shorten - Shorten a URL`);
  console.log(`   GET /:shortCode - Redirect to original URL`);
  console.log(`   GET /analytics/:shortCode - Get analytics for URL`);
  console.log(`   GET /urls - Get all URLs`);
  console.log(`   GET /health - Health check`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  Log("backend", "info", "server", "Server shutting down gracefully", {
    totalUrls: urlDatabase.size,
    uptime: process.uptime(),
  });

  console.log("\n🛑 Server shutting down...");
  process.exit(0);
});

// Log some sample data on startup
setTimeout(() => {
  Log("backend", "info", "server", "Sample URLs added for testing", {
    sampleUrls: [
      "https://example.com",
      "https://google.com",
      "https://github.com",
    ],
  });

  // Add some sample URLs
  urlDatabase.set("abc123", {
    originalUrl: "https://example.com",
    shortCode: "abc123",
    createdAt: new Date(),
    userId: "user-123",
    clicks: 5,
  });

  urlDatabase.set("def456", {
    originalUrl: "https://google.com",
    shortCode: "def456",
    createdAt: new Date(),
    userId: "user-456",
    clicks: 12,
  });
}, 1000);
