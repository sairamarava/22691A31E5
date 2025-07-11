const express = require('express');
const urlStorage = require('../models/urlStorage');
const { 
  isValidURL, 
  isValidValidity, 
  getLocationFromIP, 
  getRealIP, 
  sanitizeInput,
  formatErrorResponse,
  formatSuccessResponse
} = require('../utils/helpers');
const { logger } = require('../middleware/logger');

const router = express.Router();

// POST /shorturls - Create a new short URL
router.post('/shorturls', async (req, res) => {
  try {
    logger.info('Create short URL request received', { body: req.body });
    
    const { url, validity, shortcode } = req.body;
    

    
    const cleanUrl = sanitizeInput(url);
    const cleanShortcode = shortcode ? sanitizeInput(shortcode) : null;
    const validityMinutes = validity || 30;

    
    // Validate validity period
    if (!isValidValidity(validityMinutes)) {
      logger.warn('Invalid validity period', { validity: validityMinutes });
      return res.status(400).json(formatErrorResponse('Validity must be a positive integer representing minutes (max 525600).'));
    }
    
    // Create short URL
    const urlData = urlStorage.createShortURL(cleanUrl, validityMinutes, cleanShortcode);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const shortLink = `${baseUrl}/${urlData.shortcode}`;
    
    const response = {
      shortLink,
      expiry: urlData.expiresAt
    };
    
    logger.info('Short URL created successfully', { 
      shortcode: urlData.shortcode, 
      originalUrl: cleanUrl 
    });
    
    res.status(201).json(response);
    
  } catch (error) {
    logger.error('Error creating short URL', { 
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    
    if (error.message.includes('shortcode')) {
      return res.status(409).json(formatErrorResponse(error.message));
    }
    
    res.status(500).json(formatErrorResponse('Internal server error while creating short URL'));
  }
});

// GET /shorturls/:shortcode - Get statistics for a short URL
router.get('/shorturls/:shortcode', async (req, res) => {
  try {
    const { shortcode } = req.params;
    const cleanShortcode = sanitizeInput(shortcode);
    
    logger.info('Statistics request received', { shortcode: cleanShortcode });
    
    if (!cleanShortcode) {
      logger.warn('Empty shortcode in statistics request');
      return res.status(400).json(formatErrorResponse('Shortcode is required'));
    }
    
    const statistics = urlStorage.getStatistics(cleanShortcode);
    
    if (!statistics) {
      logger.warn('Statistics requested for non-existent shortcode', { shortcode: cleanShortcode });
      return res.status(404).json(formatErrorResponse('Short URL not found or has expired'));
    }
    
    logger.info('Statistics retrieved successfully', { 
      shortcode: cleanShortcode, 
      totalClicks: statistics.totalClicks 
    });
    
    res.json(statistics);
    
  } catch (error) {
    logger.error('Error retrieving statistics', { 
      error: error.message,
      shortcode: req.params.shortcode
    });
    
    res.status(500).json(formatErrorResponse('Internal server error while retrieving statistics'));
  }
});

// GET /all-urls - Get all URLs for statistics page
router.get('/all-urls', async (req, res) => {
  try {
    logger.info('All URLs request received');
    
    const allUrls = urlStorage.getAllURLs();
    
    logger.info('All URLs retrieved successfully', { count: allUrls.length });
    
    res.json(formatSuccessResponse(allUrls, 'All URLs retrieved successfully'));
    
  } catch (error) {
    logger.error('Error retrieving all URLs', { error: error.message });
    res.status(500).json(formatErrorResponse('Internal server error while retrieving URLs'));
  }
});

// GET /:shortcode - Redirect to original URL
router.get('/:shortcode', async (req, res) => {
  try {
    const { shortcode } = req.params;
    const cleanShortcode = sanitizeInput(shortcode);
    
    logger.info('Redirect request received', { shortcode: cleanShortcode });
    
    if (!cleanShortcode) {
      logger.warn('Empty shortcode in redirect request');
      return res.status(400).json(formatErrorResponse('Invalid shortcode'));
    }
    
    const urlData = urlStorage.getURLData(cleanShortcode);
    
    if (!urlData) {
      logger.warn('Redirect attempted for non-existent or expired URL', { shortcode: cleanShortcode });
      return res.status(404).json(formatErrorResponse('Short URL not found or has expired'));
    }
    
    // Record the click
    const clientIP = getRealIP(req);
    const location = getLocationFromIP(clientIP);
    const clickData = {
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referrer') || req.get('Referer'),
      location
    };
    
    urlStorage.recordClick(cleanShortcode, clickData);
    
    logger.info('Redirecting to original URL', { 
      shortcode: cleanShortcode, 
      originalUrl: urlData.originalUrl,
      clientIP,
      location
    });
    
    // Redirect to original URL
    res.redirect(302, urlData.originalUrl);
    
  } catch (error) {
    logger.error('Error during redirect', { 
      error: error.message,
      shortcode: req.params.shortcode
    });
    
    res.status(500).json(formatErrorResponse('Internal server error during redirect'));
  }
});

module.exports = router;
