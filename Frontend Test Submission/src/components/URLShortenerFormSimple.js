import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Alert,
  Snackbar,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import apiService from '../services/apiService';
import logger from '../utils/logger';

const URLShortenerForm = () => {
  const [urls, setUrls] = useState(['']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Simple URL validation
  const isValidURL = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleAddURL = () => {
    if (urls.length < 5) {
      setUrls([...urls, '']);
    }
  };

  const handleRemoveURL = (index) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const handleURLChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);

    try {
      // Filter out empty URLs and validate
      const validUrls = urls.filter(url => url.trim());
      
      if (validUrls.length === 0) {
        throw new Error('Please enter at least one URL');
      }

      // Basic validation
      for (const url of validUrls) {
        if (!isValidURL(url)) {
          throw new Error(`Invalid URL: ${url}`);
        }
      }

      logger.userAction('Submit URL Forms', { count: validUrls.length });

      // Submit URLs to API
      const apiCalls = validUrls.map(url => 
        apiService.createShortUrl({ 
          url: url.trim(),
          validity: 30 
        })
      );
      
      const apiResults = await Promise.all(apiCalls);
      setResults(apiResults.map(r => r.data));
      
      setSnackbar({
        open: true,
        message: 'URLs shortened successfully',
        severity: 'success'
      });
      
      logger.info('URLs shortened successfully', { count: apiResults.length });

    } catch (error) {
      logger.error('Error shortening URLs', { error: error.message });
      setSnackbar({
        open: true,
        message: error.message || 'Error shortening URLs',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      logger.userAction('Copy Short URL', { index });
      setSnackbar({
        open: true,
        message: 'Copied to clipboard',
        severity: 'success'
      });
    } catch (error) {
      logger.error('Error copying to clipboard', { error: error.message });
      setSnackbar({
        open: true,
        message: 'Failed to copy to clipboard',
        severity: 'error'
      });
    }
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Shorten Your URLs
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Enter up to 5 URLs to shorten them
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          {urls.map((url, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item xs={10}>
                <TextField
                  fullWidth
                  label={`URL ${index + 1}`}
                  value={url}
                  onChange={(e) => handleURLChange(index, e.target.value)}
                  placeholder="https://example.com"
                  disabled={loading}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={2}>
                {urls.length > 1 && (
                  <IconButton
                    onClick={() => handleRemoveURL(index)}
                    disabled={loading}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Grid>
            </Grid>
          ))}

          <Box sx={{ mb: 3 }}>
            {urls.length < 5 && (
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddURL}
                disabled={loading}
                variant="outlined"
                sx={{ mr: 2 }}
              >
                Add URL
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={loading || urls.every(url => !url.trim())}
            >
              {loading ? <CircularProgress size={24} /> : 'Shorten URLs'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {results.length > 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Shortened URLs
          </Typography>
          <List>
            {results.map((result, index) => (
              <ListItem key={index} divider={index !== results.length - 1}>
                <ListItemText
                  primary={result.shortLink || `Short URL ${index + 1}`}
                  secondary={`Original: ${result.originalUrl || 'N/A'}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleCopy(result.shortLink || '', index)}
                    color="primary"
                  >
                    <CopyIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default URLShortenerForm;
