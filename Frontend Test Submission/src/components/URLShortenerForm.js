import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Alert, 
  Grid, 
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon 
} from '@mui/icons-material';
import apiService from '../services/apiService';

const URLShortenerForm = () => {
  const [urlForms, setUrlForms] = useState([
    { url: '', validity: '', shortcode: '' }
  ]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddForm = () => {
    if (urlForms.length < 5) {
      setUrlForms([...urlForms, { url: '', validity: '', shortcode: '' }]);
    }
  };

  const handleRemoveForm = (index) => {
    if (urlForms.length > 1) {
      setUrlForms(urlForms.filter((_, i) => i !== index));
    }
  };

  const handleFormChange = (index, field, value) => {
    const newForms = [...urlForms];
    newForms[index][field] = value;
    setUrlForms(newForms);
  };

  const validateForm = (form) => {
    const errors = {};
    
    if (!form.url.trim()) {
      errors.url = 'URL is required';
    } else {
      try {
        new URL(form.url);
      } catch {
        errors.url = 'Please enter a valid URL';
      }
    }

    if (form.validity && (isNaN(form.validity) || form.validity < 1 || form.validity > 525600)) {
      errors.validity = 'Validity must be between 1 and 525600 minutes';
    }

    if (form.shortcode && (form.shortcode.length < 3 || form.shortcode.length > 20)) {
      errors.shortcode = 'Shortcode must be between 3 and 20 characters';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setResults([]);

    try {
      // Filter out empty forms
      const validForms = urlForms.filter(form => form.url.trim());
      
      if (validForms.length === 0) {
        throw new Error('Please enter at least one URL');
      }

      // Validate all forms
      const formErrors = validForms.map(validateForm);
      const hasErrors = formErrors.some(errors => Object.keys(errors).length > 0);
      
      if (hasErrors) {
        throw new Error('Please fix the validation errors in the forms');
      }

      // Prepare API calls
      const apiCalls = validForms.map(form => {
        const requestData = {
          url: form.url.trim(),
          validity: form.validity ? parseInt(form.validity) : 30
        };
        
        if (form.shortcode && form.shortcode.trim()) {
          requestData.shortcode = form.shortcode.trim();
        }
        
        return apiService.createShortUrl(requestData);
      });

      const responses = await Promise.all(apiCalls);
      setResults(responses.map(r => r.data));
      setSuccess(`Successfully shortened ${responses.length} URL(s)`);
      
      // Reset forms
      setUrlForms([{ url: '', validity: '', shortcode: '' }]);

    } catch (error) {
      setError(error.message || 'Failed to shorten URLs');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to copy to clipboard');
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          URL Shortener
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Enter up to 5 URLs with optional settings for each
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit}>
          {urlForms.map((form, index) => (
            <Accordion key={index} defaultExpanded sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  URL {index + 1} {form.url ? `- ${form.url.substring(0, 50)}...` : ''}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Original URL *"
                      value={form.url}
                      onChange={(e) => handleFormChange(index, 'url', e.target.value)}
                      placeholder="https://example.com"
                      disabled={loading}
                      required
                      helperText="Enter the long URL you want to shorten"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Validity Period (minutes)"
                      type="number"
                      value={form.validity}
                      onChange={(e) => handleFormChange(index, 'validity', e.target.value)}
                      placeholder="30"
                      disabled={loading}
                      inputProps={{ min: 1, max: 525600 }}
                      helperText="Optional. Default is 30 minutes"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Preferred Shortcode"
                      value={form.shortcode}
                      onChange={(e) => handleFormChange(index, 'shortcode', e.target.value)}
                      placeholder="mylink"
                      disabled={loading}
                      inputProps={{ minLength: 3, maxLength: 20 }}
                      helperText="Optional. 3-20 characters"
                    />
                  </Grid>
                  {urlForms.length > 1 && (
                    <Grid item xs={12}>
                      <Button
                        startIcon={<DeleteIcon />}
                        onClick={() => handleRemoveForm(index)}
                        disabled={loading}
                        color="error"
                        size="small"
                      >
                        Remove URL
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}

          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            {urlForms.length < 5 && (
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddForm}
                disabled={loading}
                variant="outlined"
              >
                Add Another URL
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={loading || urlForms.every(form => !form.url.trim())}
            >
              {loading ? 'Shortening...' : `Shorten ${urlForms.filter(f => f.url.trim()).length} URL(s)`}
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {results.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Shortened URLs
          </Typography>
          <List>
            {results.map((result, index) => (
              <ListItem key={index} divider={index !== results.length - 1}>
                <ListItemText
                  primary={
                    <Typography variant="body1" color="primary" sx={{ wordBreak: 'break-all' }}>
                      {result.shortLink || result.shortUrl || 'N/A'}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Original: {result.originalUrl || result.longUrl || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Expires: {result.expiresAt ? new Date(result.expiresAt).toLocaleString() : 'N/A'}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleCopy(result.shortLink || result.shortUrl || '')}
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
    </Box>
  );
};

export default URLShortenerForm;