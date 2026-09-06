const https = require('https');

const data = JSON.stringify({ interests: '{"profileEffects": {}}' });

const options = {
  hostname: 'dgveleeduexjklzojkcj.supabase.co',
  port: 443,
  path: '/rest/v1/profiles?id=eq.69823188-ee3a-4721-ba92-e026130950ac',
  method: 'PATCH',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVsZWVkdWV4amtsem9qa2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDEyMDcsImV4cCI6MjEwMjcxNzIwN30.ooXU0bn3GKu8iMW0Pf9chK9n0LEx-9wHCYeIgENbOKc',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVsZWVkdWV4amtsem9qa2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDEyMDcsImV4cCI6MjEwMjcxNzIwN30.ooXU0bn3GKu8iMW0Pf9chK9n0LEx-9wHCYeIgENbOKc',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log('statusCode:', res.statusCode);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', e => {
  console.error(e);
});

req.write(data);
req.end();
