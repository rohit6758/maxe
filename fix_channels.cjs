const fs = require('fs');

// Fix Explore.jsx - all static channel names cause "already subscribed" crashes when component re-renders
let exploreContent = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

exploreContent = exploreContent
  .replace("supabase.channel('my_memberships')", 'supabase.channel(`my_memberships_${Date.now()}`)')
  .replace("supabase.channel('community_posts')", 'supabase.channel(`community_posts_${Date.now()}`)')
  .replace("supabase.channel('user_request_status')", 'supabase.channel(`user_request_status_${Date.now()}`)');

fs.writeFileSync('src/screens/Explore.jsx', exploreContent);

// Also check UserSearch.jsx
let searchContent = fs.readFileSync('src/screens/UserSearch.jsx', 'utf8');
let fixed = searchContent.replace(/supabase\.channel\('([^']+)'\)/g, (match, name) => {
  return `supabase.channel(\`${name}_\${Date.now()}\`)`;
});
fs.writeFileSync('src/screens/UserSearch.jsx', fixed);

console.log('Done - all static channel names fixed');
