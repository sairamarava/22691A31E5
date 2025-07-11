import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import apiService from '../services/apiService';

const URLShortenerForm = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      if (!url.trim()) {
        throw new Error('Please enter a URL');
      }

      const response = await apiService.createShortUrl({ 
        url: url.trim(),
        validity: 30 
      });
      
      setResult(response.data);
    } catch (error) {
      setError(error.message || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        URL Shortener
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Enter URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          disabled={loading}
          sx={{ mb: 2 }}
        />
        
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !url.trim()}
        >
          {loading ? 'Shortening...' : 'Shorten URL'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Shortened URL:</Typography>
          <Typography color="primary" sx={{ wordBreak: 'break-all' }}>
            {result.shortLink}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default URLShortenerForm;