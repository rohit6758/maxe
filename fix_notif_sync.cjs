const fs = require('fs');

// 1. Profile.jsx toggleFollow
let profileContent = fs.readFileSync('src/screens/Profile.jsx', 'utf8');
const profileTarget = `await supabase.from('follows').insert([{ follower_id: session.user.id, following_id: userId }]);`;
const profileReplacement = `await supabase.from('follows').insert([{ follower_id: session.user.id, following_id: userId }]);
      try {
        await supabase.from('notifications').insert([{ 
          user_id: userId, 
          content: \`@\${userProfile?.username || 'someone'} started following you!\` 
        }]);
      } catch (e) { console.error("Notification failed", e); }`;
profileContent = profileContent.replace(profileTarget, profileReplacement);
fs.writeFileSync('src/screens/Profile.jsx', profileContent);


// 2. UserSearch.jsx toggleFollow
let searchContent = fs.readFileSync('src/screens/UserSearch.jsx', 'utf8');
const searchTarget = `await supabase.from('follows').insert([{ follower_id: session.user.id, following_id: userId }]);`;
const searchReplacement = `await supabase.from('follows').insert([{ follower_id: session.user.id, following_id: userId }]);
      try {
        await supabase.from('notifications').insert([{ 
          user_id: userId, 
          content: \`@\${userProfile?.username || 'someone'} started following you!\` 
        }]);
      } catch (e) { console.error("Notification failed", e); }`;
searchContent = searchContent.replace(searchTarget, searchReplacement);
fs.writeFileSync('src/screens/UserSearch.jsx', searchContent);


// 3. Explore.jsx handleCreatePost
let exploreContent = fs.readFileSync('src/screens/Explore.jsx', 'utf8');
const exploreTarget = `const { error } = await supabase.from('community_posts').insert([{
        community_id: selectedCommunity.id,
        user_id: session.user.id,
        content: newPostContent
      }]);

      if (error) throw error;`;
const exploreReplacement = `const { error } = await supabase.from('community_posts').insert([{
        community_id: selectedCommunity.id,
        user_id: session.user.id,
        content: newPostContent
      }]);

      if (error) throw error;
      
      try {
        const { data: mems } = await supabase.from('community_members').select('user_id').eq('community_id', selectedCommunity.id);
        if (mems) {
          const notifs = mems.filter(m => m.user_id !== session.user.id).map(m => ({
            user_id: m.user_id,
            content: \`@\${userProfile?.username || 'someone'} posted in \${selectedCommunity.name}\`
          }));
          if (notifs.length > 0) {
            await supabase.from('notifications').insert(notifs);
          }
        }
      } catch (e) { console.error("Notification failed", e); }`;
exploreContent = exploreContent.replace(exploreTarget, exploreReplacement);
fs.writeFileSync('src/screens/Explore.jsx', exploreContent);
