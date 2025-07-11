const validator = require('validator');
const geoip = require('geoip-lite');
const { logger } = require('../middleware/logger');

// Validate URL format
const isValidURL = (url) => {
  try {
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: true
    });
  } catch (error) {
    logger.error('URL validation error', { url, error: error.message });
    return false;
  }
};

// Validate validity period (in minutes)
const isValidValidity = (validity) => {
  if (validity === undefined || validity === null) return true; // Allow default
  return Number.isInteger(validity) && validity > 0 && validity <= 525600; // Max 1 year
};

// Get geographical location from IP
const getLocationFromIP = (ip) => {
  try {
    // Handle localhost and private IPs
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return 'Local/Private Network';
    }

    const geo = geoip.lookup(ip);
    if (geo) {
      return `${geo.city || 'Unknown City'}, ${geo.region || 'Unknown Region'}, ${geo.country || 'Unknown Country'}`;
    }
    return 'Unknown Location';
  } catch (error) {
    logger.error('Geolocation lookup error', { ip, error: error.message });
    return 'Unknown Location';
  }
};

// Extract real IP from request
const getRealIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip ||
         '127.0.0.1';
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim();
};

// Format error response
const formatErrorResponse = (message, statusCode = 400, details = null) => {
  const errorResponse = {
    error: true,
    message,
    statusCode,
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    errorResponse.details = details;
  }
  
  return errorResponse;
};

// Format success response
const formatSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

// Clean up expired URLs periodically
const startCleanupJob = (urlStorage, intervalMinutes = 30) => {
  setInterval(() => {
    try {
      const cleanedCount = urlStorage.cleanupExpiredURLs();
      if (cleanedCount > 0) {
        logger.info('Periodic cleanup completed', { cleanedCount });
      }
    } catch (error) {
      logger.error('Cleanup job failed', { error: error.message });
    }
  }, intervalMinutes * 60 * 1000);
  
  logger.info('Cleanup job started', { intervalMinutes });
};

module.exports = {
  isValidURL,
  isValidValidity,
  getLocationFromIP,
  getRealIP,
  sanitizeInput,
  formatErrorResponse,
  formatSuccessResponse,
  startCleanupJob
};
