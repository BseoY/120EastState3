/**
 * Date formatting utility functions for 120 East State
 * Provides consistent date formatting across the application
 * Handles timezone conversions properly for international users
 */

/**
 * Format a date with user's local timezone and language preferences
 * @param {string|Date} dateInput - Date string from API or Date object
 * @param {object} options - Formatting options for toLocaleDateString
 * @returns {string} Formatted date string
 */
export const formatLocalDate = (dateInput, options = {}) => {
  if (!dateInput) return 'Unknown date';
  
  try {
    const date = new Date(dateInput);
    
    // Default formatting options
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Get user's timezone
    };
    
    // Merge default options with any provided options
    const mergedOptions = { ...defaultOptions, ...options };
    
    return date.toLocaleDateString(navigator.language || 'en-US', mergedOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date with time in user's local timezone
 * @param {string|Date} dateInput - Date string from API or Date object
 * @returns {string} Formatted date and time string
 */
export const formatLocalDateTime = (dateInput) => {
  if (!dateInput) return 'Unknown date/time';
  
  try {
    const date = new Date(dateInput);
    
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    return date.toLocaleString(navigator.language || 'en-US', options);
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return 'Invalid date/time';
  }
};

/**
 * Convert a date string to ISO format for date inputs and filtering
 * @param {string|Date} dateInput - Date string from API or Date object 
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export const toISODateString = (dateInput) => {
  if (!dateInput) return '';
  
  try {
    const date = new Date(dateInput);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error converting to ISO date:', error);
    return '';
  }
};

/**
 * Format a date for datetime-local input while preserving local timezone
 * @param {Date} date - The date to format
 * @returns {string} Date string formatted for datetime-local input (YYYY-MM-DDThh:mm)
 */
export const formatLocalDateTimeForInput = (date) => {
  if (!date) return '';
  
  try {
    // Get the local timezone offset in minutes
    const timezoneOffset = date.getTimezoneOffset();
    
    // Create a new date adjusted for the local timezone
    const localDate = new Date(date.getTime() - timezoneOffset * 60000);
    
    // Format to YYYY-MM-DDThh:mm
    return localDate.toISOString().slice(0, 16);
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};
