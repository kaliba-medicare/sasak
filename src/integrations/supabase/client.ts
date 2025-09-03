import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nvyjyxyjtibrhhgoybez.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52eWp5eHlqdGlicmhoZ295YmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2Nzc2MzEsImV4cCI6MjA3MjI1MzYzMX0.9HuvWEajGLLBui30yXzUfkV1FXpk2Q_2gfAYa52IKNU";

// The auth configuration has been removed to prevent crashes in non-browser environments.
// The default settings are secure and will use localStorage when available.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
