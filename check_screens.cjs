const fs = require('fs');
const files = [
  'src/screens/StudyTrackerModal.jsx',
  'src/screens/CalendarModal.jsx'
];

files.forEach(f => {
  const lines = fs.readFileSync(f,'utf8').split('\n');
  console.log('\n=== ' + f + ' ===');
  lines.forEach((l,i) => {
    if(l.includes('session') || l.includes('supabase') || l.includes('insert') || l.includes('save') || l.includes('notif')) {
      console.log(i+1, l.trim());
    }
  });
});
