import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, CircularProgress } from '@mui/material';
import StatisticsTable from '../components/StatisticsTable';
import logger from '../utils/logger';
import apiService from '../services/apiService';

const StatisticsPage = () => {
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    logger.info('Fetching statistics data');
    const fetchStatistics = async () => {
      try {
        const data = await apiService.getAllUrls();
        setStatistics(data);
        logger.info('Successfully fetched statistics data');
      } catch (err) {
        logger.error('Error fetching statistics:', err);
        setError('Failed to load statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
            URL Statistics
          </Typography>
          <Typography variant="subtitle1" gutterBottom align="center" color="textSecondary" sx={{ mb: 4 }}>
            View detailed analytics for all shortened URLs
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" align="center">
              {error}
            </Typography>
          ) : (
            <StatisticsTable statistics={statistics} />
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default StatisticsPage;
