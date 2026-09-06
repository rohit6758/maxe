const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dgveleeduexjklzojkcj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVsZWVkdWV4amtsem9qa2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDEyMDcsImV4cCI6MjEwMjcxNzIwN30.ooXU0bn3GKu8iMW0Pf9chK9n0LEx-9wHCYeIgENbOKc');

async function check() {
  const { data, error } = await supabase.from('profiles').update({ interests: '{"theme":"default","profileEffects":{"wallpaper":"custom"}}' }).eq('username', 'rohit6758').select();
  console.log('data:', data);
  console.log('error:', error);
}
check();
