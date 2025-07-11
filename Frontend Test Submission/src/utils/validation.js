import validator from 'validator';
import logger from './logger';

export const validateUrlFormData = (formData) => {
  const errors = {};
  const normalizedData = {
    url: formData.url?.trim(),
    validity: formData.validity ? parseInt(formData.validity, 10) : 30,
    shortcode: formData.shortcode?.trim()
  };

  // Validate URL
  if (!normalizedData.url) {
    errors.url = 'URL is required';
  } else if (!validator.isURL(normalizedData.url, {
    protocols: ['http', 'https'],
    require_protocol: true
  })) {
    errors.url = 'Please enter a valid URL (including http:// or https://)';
  }

  // Validate validity period
  if (normalizedData.validity !== 30) { // Only validate if different from default
    if (isNaN(normalizedData.validity) || normalizedData.validity < 1) {
      errors.validity = 'Validity must be a positive number';
    } else if (normalizedData.validity > 525600) { // 1 year in minutes
      errors.validity = 'Validity cannot exceed 1 year (525600 minutes)';
    }
  }

  // Validate shortcode if provided
  if (normalizedData.shortcode) {
    if (normalizedData.shortcode.length < 3) {
      errors.shortcode = 'Shortcode must be at least 3 characters long';
    } else if (normalizedData.shortcode.length > 20) {
      errors.shortcode = 'Shortcode cannot exceed 20 characters';
    } else if (!/^[a-zA-Z0-9]+$/.test(normalizedData.shortcode)) {
      errors.shortcode = 'Shortcode can only contain letters and numbers';
    }
  }

  const isValid = Object.keys(errors).length === 0;

  if (!isValid) {
    logger.warn('Form validation failed', { errors, formData });
  }

  return {
    isValid,
    errors,
    normalizedData
  };
};
