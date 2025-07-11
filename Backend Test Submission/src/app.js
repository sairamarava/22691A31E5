const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { logger, loggingMiddleware } = require('./middleware/logger');
const urlRoutes = require('./routes/urlRoutes');
const urlStorage = require('./models/urlStorage');
const { startCleanupJob } = require('./utils/helpers');

const app = express();
const PORT = process.env.PORT || 8080;


app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));


app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: {
    error: true,
    message: 'Too many requests from this IP, please try again later.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.set('trust proxy', 1);


app.use(loggingMiddleware);


app.use('/', urlRoutes);


app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'URL Shortener Microservice',
    version: '1.0.0'
  });
});


app.use('*', (req, res) => {
  logger.warn('404 - Route not found', { 
    method: req.method, 
    url: req.url,
    ip: req.ip
  });
  
  res.status(404).json({
    error: true,
    message: 'Route not found',
    statusCode: 404,
    timestamp: new Date().toISOString()
  });
});


app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal Server Error',
    statusCode: err.status || 500,
    timestamp: new Date().toISOString()
  });
});


process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});


app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
  
  console.log(`🚀 URL Shortener Microservice running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API Base URL: http://localhost:${PORT}`);
  

  startCleanupJob(urlStorage, 30); 
});

module.exports = app;
