import axios from 'axios';
import logger from '../utils/logger';

const API_BASE_URL = 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const startTime = Date.now();
    config.metadata = { startTime };
    
    logger.info('API Request Started', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    logger.error('API Request Error', {
      error: error.message,
      config: error.config
    });
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    const endTime = Date.now();
    const duration = endTime - response.config.metadata.startTime;
    
    logger.apiCall(
      response.config.method?.toUpperCase(),
      response.config.url,
      response.status,
      duration,
      {
        responseData: response.data
      }
    );
    
    return response;
  },
  (error) => {
    const endTime = Date.now();
    const duration = error.config?.metadata ? 
      endTime - error.config.metadata.startTime : 0;
    
    logger.apiCall(
      error.config?.method?.toUpperCase() || 'UNKNOWN',
      error.config?.url || 'UNKNOWN',
      error.response?.status || 0,
      duration,
      {
        errorMessage: error.message,
        errorResponse: error.response?.data
      }
    );
    
    return Promise.reject(error);
  }
);

class ApiService {
  async createShortUrl(urlData) {
    try {
      logger.userAction('Create Short URL', { originalUrl: urlData.url });
      logger.info('Sending request to backend', { 
        url: '/shorturls', 
        data: urlData,
        baseURL: API_BASE_URL 
      });
      
      const response = await apiClient.post('/shorturls', urlData);
      
      logger.info('Short URL created successfully', {
        shortLink: response.data.shortLink,
        expiry: response.data.expiry
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to create short URL', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method
      });
      
      throw {
        message: error.response?.data?.message || 'Failed to create short URL',
        status: error.response?.status || 500,
        details: error.response?.data
      };
    }
  }

  async getUrlStatistics(shortcode) {
    try {
      logger.userAction('Get URL Statistics', { shortcode });
      
      const response = await apiClient.get(`/shorturls/${shortcode}`);
      
      logger.info('URL statistics retrieved successfully', {
        shortcode,
        totalClicks: response.data.totalClicks
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to get URL statistics', {
        shortcode,
        error: error.message
      });
      
      throw {
        message: error.response?.data?.message || 'Failed to get URL statistics',
        status: error.response?.status || 500,
        details: error.response?.data
      };
    }
  }

  async getAllUrls() {
    try {
      logger.userAction('Get All URLs');
      
      const response = await apiClient.get('/all-urls');
      
      logger.info('All URLs retrieved successfully', {
        count: response.data.data?.length || 0
      });
      
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      logger.error('Failed to get all URLs', {
        error: error.message
      });
      
      throw {
        message: error.response?.data?.message || 'Failed to get all URLs',
        status: error.response?.status || 500,
        details: error.response?.data
      };
    }
  }

  async createMultipleShortUrls(urlDataArray) {
    try {
      logger.userAction('Create Multiple Short URLs', {
        count: urlDataArray.length
      });

      const promises = urlDataArray.map(urlData => 
        this.createShortUrl(urlData).catch(error => ({
          success: false,
          error: error.message,
          originalData: urlData
        }))
      );

      const results = await Promise.all(promises);
      
      const successful = results.filter(result => result.success);
      const failed = results.filter(result => !result.success);
      
      logger.info('Multiple URLs creation completed', {
        total: urlDataArray.length,
        successful: successful.length,
        failed: failed.length
      });

      return {
        results,
        summary: {
          total: urlDataArray.length,
          successful: successful.length,
          failed: failed.length
        }
      };
    } catch (error) {
      logger.error('Failed to create multiple short URLs', {
        error: error.message
      });
      
      throw {
        message: 'Failed to create multiple short URLs',
        details: error
      };
    }
  }
}

const apiService = new ApiService();
export default apiService;
