const fs = require('fs');
let exploreContent = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

const regex = /(await supabase\.from\('community_posts'\)\.insert\(\[\{[\s\S]*?\}\]\);\s*if \(error\) throw error;)/;
const replacement = `$1
      
      try {
        const { data: mems } = await supabase.from('community_members').select('user_id').eq('community_id', selectedCommunity.id);
        if (mems) {
          const notifs = mems.filter(m => m.user_id !== session.user.id).map(m => ({
            user_id: m.user_id,
            content: \`@\${userProfile?.username || 'someone'} posted new material in \${selectedCommunity.name}\`
          }));
          if (notifs.length > 0) {
            await supabase.from('notifications').insert(notifs);
          }
        }
      } catch (e) { console.error("Notification failed", e); }`;

exploreContent = exploreContent.replace(regex, replacement);
fs.writeFileSync('src/screens/Explore.jsx', exploreContent);
