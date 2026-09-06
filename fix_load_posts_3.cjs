const fs = require('fs');

const replacement = `  const loadPosts = async (communityId) => {
    setIsLoadingPosts(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error(postsError);
        setPosts([]);
        setIsLoadingPosts(false);
        return;
      }

      let fetchedPosts = postsData || [];
      if (fetchedPosts.length > 0) {
        const userIds = [...new Set(fetchedPosts.map(p => p.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .in('id', userIds);
          
        const profileMap = {};
        if (profilesData) {
          profilesData.forEach(p => { profileMap[p.id] = p; });
        }
        
        fetchedPosts = fetchedPosts.map(p => ({
          ...p,
          profiles: profileMap[p.user_id] || null
        }));
      }

      setPosts(fetchedPosts);
    } catch (e) {
      console.error(e);
      setPosts([]);
    }
    setIsLoadingPosts(false);
  };`;

let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

const startIdx = content.indexOf('  const loadPosts = async (communityId) => {');
const endString = 'setIsLoadingPosts(false);\r\n  };';
let endIdx = content.indexOf(endString, startIdx);

if (endIdx === -1) {
  // Try LF
  const endStringLF = 'setIsLoadingPosts(false);\n  };';
  endIdx = content.indexOf(endStringLF, startIdx);
  if (endIdx !== -1) {
    endIdx += endStringLF.length;
  }
} else {
  endIdx += endString.length;
}

if (endIdx !== -1) {
  content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync('src/screens/Explore.jsx', content);
  console.log('Success');
} else {
  console.log('Could not find end of loadPosts');
}
