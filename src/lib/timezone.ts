// Utility functions for handling Asia/Makassar timezone (WITA)

/**
 * Get current timestamp in proper format for database storage
 * PostgreSQL TIMESTAMPTZ automatically converts to UTC - this is correct behavior
 * @returns ISO string that PostgreSQL will store as UTC
 */
export const getTimestampForDB = (): string => {
  // Simply return current time as ISO string
  // PostgreSQL TIMESTAMPTZ will handle timezone conversion automatically
  return new Date().toISOString();
};

/**
 * Get current date and time in Asia/Makassar timezone (WITA)
 * @returns Date object adjusted to WITA timezone
 */
export const getNowMakassar = (): Date => {
  // Get the current date/time in WITA timezone
  const now = new Date();
  
  // Format the current time in WITA timezone and parse it back
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const dateString = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}T${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}:${parts.find(p => p.type === 'second')?.value}`;
  
  return new Date(dateString);
};

/**
 * Get today's date in YYYY-MM-DD format using WITA timezone
 * @returns String date in YYYY-MM-DD format
 */
export const getTodayDateWITA = (): string => {
  const now = new Date();
  
  // Get date in WITA timezone directly
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return formatter.format(now);
};

/**
 * Convert a date to WITA timezone
 * @param date - Date to convert or null for current date
 * @returns Date object in WITA timezone
 */
export const toWITATimezone = (date?: Date | null): Date => {
  const targetDate = date || new Date();
  return new Date(
    targetDate.toLocaleString("en-US", { timeZone: "Asia/Makassar" })
  );
};

/**
 * Format time for display in Indonesian locale with WITA timezone
 * @param date - Date object or string
 * @returns Formatted time string
 */
export const formatTimeWITA = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Makassar',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date for display in Indonesian locale
 * @param date - Date object or string
 * @returns Formatted date string
 */
export const formatDateWITA = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Makassar'
  });
};