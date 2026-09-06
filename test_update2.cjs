const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dgveleeduexjklzojkcj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVsZWVkdWV4amtsem9qa2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDEyMDcsImV4cCI6MjEwMjcxNzIwN30.ooXU0bn3GKu8iMW0Pf9chK9n0LEx-9wHCYeIgENbOKc');

async function check() {
  const { error } = await supabase.from('profiles')
    .update({
      name: "Rohit",
      username: "rohit",
      bio: "Test bio",
      branch: "CSE",
      college: "ANITS",
      avatar_url: "https://example.com/avatar.png"
    })
    .eq('id', '69823188-ee3a-4721-ba92-e026130950ac');
    
  console.log('Error:', error);
}

check();
