const supabaseUrl = 'https://dgveleeduexjklzojkcj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVsZWVkdWV4amtsem9qa2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDEyMDcsImV4cCI6MjEwMjcxNzIwN30.ooXU0bn3GKu8iMW0Pf9chK9n0LEx-9wHCYeIgENbOKc'

async function test() {
  const getSub = await fetch(`${supabaseUrl}/rest/v1/subjects?select=id&limit=1`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  const subData = await getSub.json();
  if(!subData.length) return console.log('no subjects');
  const subject_id = subData[0].id;

  async function tryInsert(type) {
    const res = await fetch(`${supabaseUrl}/rest/v1/resources`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ subject_id, title: 'test', url: 'https://test', type })
    });
    const data = await res.json();
    console.log(type, '=>', data.message || 'success');
  }

  await tryInsert('ai');
  await tryInsert('chat');
  await tryInsert('ai_chat');
  await tryInsert('youtube');
}

test();
