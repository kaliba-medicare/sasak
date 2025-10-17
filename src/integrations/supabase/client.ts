import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nvyjyxyjtibrhhgoybez.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52eWp5eHlqdGlicmhoZ295YmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2Nzc2MzEsImV4cCI6MjA3MjI1MzYzMX0.9HuvWEajGLLBui30yXzUfkV1FXpk2Q_2gfAYa52IKNU";

// The auth configuration has been removed to prevent crashes in non-browser environments.
// The default settings are secure and will use localStorage when available.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Add IP geolocation function with better error handling
export const getIPLocation = async () => {
  try {
    // Add a timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching IP location:', error);
    // Return a minimal object with null values instead of null
    return {
      ip: null,
      latitude: null,
      longitude: null
    };
  }
};