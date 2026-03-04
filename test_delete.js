import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeleteError() {
  console.log("Fetching profiles...");
  const { data: profiles, error: fetchErr } = await supabase.from('profiles').select('user_id, name').limit(1);
  
  if (fetchErr || !profiles?.length) {
    console.error("Fetch err:", fetchErr);
    return;
  }
  
  const targetId = profiles[0].user_id;
  console.log(`Trying to delete user_id: ${targetId}`);
  
  const { data, error } = await supabase.from('profiles').delete().eq('user_id', targetId).select();
  
  console.log("Delete result:");
  console.log("Data:", data);
  console.log("Error:", error);
}

checkDeleteError();
