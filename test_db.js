import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nvyjyxyjtibrhhgoybez.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52eWp5eHlqdGlicmhoZ295YmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2Nzc2MzEsImV4cCI6MjA3MjI1MzYzMX0.9HuvWEajGLLBui30yXzUfkV1FXpk2Q_2gfAYa52IKNU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  console.log("Testing connection...");
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log("Profiles data:", data);
  console.log("Profiles error:", error);
}

testUpdate();
