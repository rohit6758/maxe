const fs = require('fs');

// === 1. Explore.jsx — community post notification: add type:'community' ===
let explore = fs.readFileSync('src/screens/Explore.jsx', 'utf8');
explore = explore.replace(
  `content: \`@\${userProfile?.username || 'someone'} posted new material in \${selectedCommunity.name}\``,
  `content: \`@\${userProfile?.username || 'someone'} posted new material in \${selectedCommunity.name}\`, type: 'community'`
);
// accept/reject notifications
explore = explore.replace(
  `content: \`Your request to join \${selectedCommunity?.name} was accepted! 🎉\` }]);`,
  `content: \`Your request to join \${selectedCommunity?.name} was accepted! 🎉\`, type: 'request' }]);`
);
explore = explore.replace(
  `content: \`Your request to join \${selectedCommunity?.name} was declined.\` }]);`,
  `content: \`Your request to join \${selectedCommunity?.name} was declined.\`, type: 'request' }]);`
);
fs.writeFileSync('src/screens/Explore.jsx', explore);
console.log('Explore.jsx done');

// === 2. Profile.jsx — follow notification: add type:'follow' ===
let profile = fs.readFileSync('src/screens/Profile.jsx', 'utf8');
profile = profile.replace(
  `content: \`@\${userProfile?.username || 'someone'} started following you!\``,
  `content: \`@\${userProfile?.username || 'someone'} started following you!\`, type: 'follow'`
);
fs.writeFileSync('src/screens/Profile.jsx', profile);
console.log('Profile.jsx done');

// === 3. UserSearch.jsx — follow notification: add type:'follow' ===
let search = fs.readFileSync('src/screens/UserSearch.jsx', 'utf8');
search = search.replace(
  `content: \`@\${userProfile?.username || 'someone'} started following you!\``,
  `content: \`@\${userProfile?.username || 'someone'} started following you!\`, type: 'follow'`
);
fs.writeFileSync('src/screens/UserSearch.jsx', search);
console.log('UserSearch.jsx done');

// === 4. CalendarModal.jsx — add calendar notification on save ===
let cal = fs.readFileSync('src/screens/CalendarModal.jsx', 'utf8');
cal = cal.replace(
  `} else if (data) {
      setEvents(p => [...p, data[0]]);
      setForm({ title: '', type: 'exam', marks: '' });
      setShowForm(false);
    }`,
  `} else if (data) {
      setEvents(p => [...p, data[0]]);
      setForm({ title: '', type: 'exam', marks: '' });
      setShowForm(false);
      // Self-notification as a reminder marker
      try {
        await supabase.from('notifications').insert([{
          user_id: session.user.id,
          content: \`📅 Exam added: \${form.title} on \${getLocalYMD(selected)}\`,
          type: 'calendar'
        }]);
      } catch(e) {}
    }`
);
fs.writeFileSync('src/screens/CalendarModal.jsx', cal);
console.log('CalendarModal.jsx done');
