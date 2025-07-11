const { v4: uuidv4 } = require('uuid');
const { logger } = require('../middleware/logger');

class URLStorage {
  constructor() {
    this.urls = new Map(); // shortcode -> url data
    this.clicks = new Map(); // shortcode -> array of click data
    logger.info('URL Storage initialized');
  }

  // Generate a random shortcode
  generateShortcode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Check if shortcode exists
  shortcodeExists(shortcode) {
    return this.urls.has(shortcode);
  }

  // Generate unique shortcode
  generateUniqueShortcode() {
    let shortcode;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      shortcode = this.generateShortcode();
      attempts++;
      if (attempts > maxAttempts) {
        shortcode = this.generateShortcode(8); // Increase length if too many collisions
        break;
      }
    } while (this.shortcodeExists(shortcode));
    
    logger.info('Generated unique shortcode', { shortcode, attempts });
    return shortcode;
  }

  // Validate shortcode format
  isValidShortcode(shortcode) {
    if (!shortcode || typeof shortcode !== 'string') return false;
    if (shortcode.length < 3 || shortcode.length > 20) return false;
    return /^[a-zA-Z0-9]+$/.test(shortcode);
  }

  // Create short URL
  createShortURL(originalUrl, validityMinutes = 30, customShortcode = null) {
    try {
      let shortcode;
      
      if (customShortcode) {
        if (!this.isValidShortcode(customShortcode)) {
          throw new Error('Invalid shortcode format. Use alphanumeric characters, 3-20 length.');
        }
        if (this.shortcodeExists(customShortcode)) {
          throw new Error('Shortcode already exists. Please choose a different one.');
        }
        shortcode = customShortcode;
      } else {
        shortcode = this.generateUniqueShortcode();
      }

      const now = new Date();
      const expiry = new Date(now.getTime() + validityMinutes * 60 * 1000);
      
      const urlData = {
        id: uuidv4(),
        originalUrl,
        shortcode,
        createdAt: now.toISOString(),
        expiresAt: expiry.toISOString(),
        validityMinutes,
        isActive: true
      };

      this.urls.set(shortcode, urlData);
      this.clicks.set(shortcode, []);
      
      logger.info('Short URL created', { 
        shortcode, 
        originalUrl, 
        validityMinutes,
        expiresAt: expiry.toISOString()
      });
      
      return urlData;
    } catch (error) {
      logger.error('Error creating short URL', { 
        originalUrl, 
        customShortcode, 
        error: error.message 
      });
      throw error;
    }
  }

  // Get URL data by shortcode
  getURLData(shortcode) {
    const urlData = this.urls.get(shortcode);
    if (!urlData) {
      logger.warn('URL not found', { shortcode });
      return null;
    }

    // Check if expired
    const now = new Date();
    const expiry = new Date(urlData.expiresAt);
    
    if (now > expiry) {
      logger.info('URL expired', { shortcode, expiresAt: urlData.expiresAt });
      return null;
    }

    return urlData;
  }

  // Record a click
  recordClick(shortcode, clickData) {
    try {
      const clicks = this.clicks.get(shortcode) || [];
      const clickRecord = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        ip: clickData.ip,
        userAgent: clickData.userAgent,
        referrer: clickData.referrer || 'Direct',
        location: clickData.location || 'Unknown'
      };
      
      clicks.push(clickRecord);
      this.clicks.set(shortcode, clicks);
      
      logger.info('Click recorded', { shortcode, ip: clickData.ip });
      return clickRecord;
    } catch (error) {
      logger.error('Error recording click', { shortcode, error: error.message });
      throw error;
    }
  }

  // Get statistics for a shortcode
  getStatistics(shortcode) {
    const urlData = this.urls.get(shortcode);
    if (!urlData) {
      logger.warn('Statistics requested for non-existent URL', { shortcode });
      return null;
    }

    const clicks = this.clicks.get(shortcode) || [];
    
    const stats = {
      shortcode,
      originalUrl: urlData.originalUrl,
      createdAt: urlData.createdAt,
      expiresAt: urlData.expiresAt,
      totalClicks: clicks.length,
      clicks: clicks.map(click => ({
        timestamp: click.timestamp,
        referrer: click.referrer,
        location: click.location,
        userAgent: click.userAgent
      }))
    };

    logger.info('Statistics retrieved', { shortcode, totalClicks: clicks.length });
    return stats;
  }

  // Get all URLs (for statistics page)
  getAllURLs() {
    const allUrls = [];
    for (const [shortcode, urlData] of this.urls.entries()) {
      const clicks = this.clicks.get(shortcode) || [];
      allUrls.push({
        ...urlData,
        totalClicks: clicks.length
      });
    }
    
    logger.info('All URLs retrieved', { count: allUrls.length });
    return allUrls;
  }

  // Clean up expired URLs (utility method)
  cleanupExpiredURLs() {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [shortcode, urlData] of this.urls.entries()) {
      const expiry = new Date(urlData.expiresAt);
      if (now > expiry) {
        this.urls.delete(shortcode);
        this.clicks.delete(shortcode);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.info('Expired URLs cleaned up', { count: cleanedCount });
    }
    
    return cleanedCount;
  }
}

// Singleton instance
const urlStorage = new URLStorage();

module.exports = urlStorage;
