import fs from 'fs';
const supabaseUrl = 'https://dgveleeduexjklzojkcj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVsZWVkdWV4amtsem9qa2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDEyMDcsImV4cCI6MjEwMjcxNzIwN30.ooXU0bn3GKu8iMW0Pf9chK9n0LEx-9wHCYeIgENbOKc'

async function getOpenAPI() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`);
  const data = await res.json();
  fs.writeFileSync('openapi.json', JSON.stringify(data, null, 2));
  console.log('OpenAPI spec written.');
}

getOpenAPI();
