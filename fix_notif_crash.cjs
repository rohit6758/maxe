const fs = require('fs');
let content = fs.readFileSync('src/components/NotificationsMenu.jsx', 'utf8');

content = content.replace(
  "supabase.channel('my_notifications')", 
  "supabase.channel(`my_notifications_${Math.random()}`)"
);

fs.writeFileSync('src/components/NotificationsMenu.jsx', content);
