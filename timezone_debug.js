// Debug script to understand timezone behavior

console.log('=== TIMEZONE DEBUG ===');

// Simulate the current getWITAISOString function
const getWITAISOString = () => {
  const now = new Date();
  
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
  const dateString = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}T${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}:${parts.find(p => p.type === 'second')?.value}+08:00`;
  
  return dateString;
};

console.log('1. getWITAISOString() result:', getWITAISOString());
console.log('2. When passed to new Date():', new Date(getWITAISOString()));
console.log('3. When saved to DB, PostgreSQL might convert to UTC');

console.log('\n=== PROBLEM ANALYSIS ===');
console.log('Issue: PostgreSQL TIMESTAMPTZ automatically converts to UTC for storage');
console.log('Solution: We need to understand that this is normal behavior');
console.log('The key is ensuring consistent retrieval and display');

console.log('\n=== WHAT HAPPENS ===');
const witaString = getWITAISOString();
console.log('WITA String:', witaString);
console.log('Parsed as Date:', new Date(witaString).toISOString()); // This will be UTC
console.log('Displayed with WITA timezone:', new Date(witaString).toLocaleString('id-ID', { timeZone: 'Asia/Makassar' }));