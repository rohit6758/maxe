const fs = require('fs');
let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

const oldUpdate = `const { data, error } = await supabase.from('communities').update({ avatar_url: publicUrl }).eq('id', selectedCommunity.id).select().single();
      if (error) throw error;
      
      setCommunities(communities.map(c => c.id === selectedCommunity.id ? data : c));
      setSelectedCommunity(data);`;

const newUpdate = `const { error } = await supabase.from('communities').update({ avatar_url: publicUrl }).eq('id', selectedCommunity.id);
      if (error) throw error;
      
      const updatedComm = { ...selectedCommunity, avatar_url: publicUrl };
      setCommunities(communities.map(c => c.id === selectedCommunity.id ? updatedComm : c));
      setSelectedCommunity(updatedComm);`;

content = content.replace(oldUpdate, newUpdate);
fs.writeFileSync('src/screens/Explore.jsx', content);
