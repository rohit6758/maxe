const fs = require('fs');
let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');
content = content.replace(
  "supabase.storage.from('pdfs').upload(`community_avatars/${fileName}`",
  "supabase.storage.from('uploads').upload(`community_avatars/${fileName}`"
);
content = content.replace(
  "supabase.storage.from('pdfs').getPublicUrl(`community_avatars/${fileName}`",
  "supabase.storage.from('uploads').getPublicUrl(`community_avatars/${fileName}`"
);
fs.writeFileSync('src/screens/Explore.jsx', content);
console.log('Patched Explore.jsx bucket');
