import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import URLShortenerForm from '../components/URLShortenerForm';
import logger from '../utils/logger';

const HomePage = () => {
  logger.info('Rendering HomePage component');

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
            URL Shortener
          </Typography>
          <Typography variant="subtitle1" gutterBottom align="center" color="textSecondary" sx={{ mb: 4 }}>
            Shorten up to 5 URLs at once and track their performance
          </Typography>
          <URLShortenerForm />
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage;
