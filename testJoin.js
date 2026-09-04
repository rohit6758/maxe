const supabaseUrl = 'https://dgveleeduexjklzojkcj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVsZWVkdWV4amtsem9qa2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDEyMDcsImV4cCI6MjEwMjcxNzIwN30.ooXU0bn3GKu8iMW0Pf9chK9n0LEx-9wHCYeIgENbOKc'

async function testJoin() {
  const getSub = await fetch(`${supabaseUrl}/rest/v1/subjects?select=*,resources(id,type,title)&limit=1`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  const subData = await getSub.json();
  console.log(JSON.stringify(subData, null, 2));
}

testJoin();
