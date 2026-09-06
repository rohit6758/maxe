const fs = require('fs');
let content = fs.readFileSync('src/screens/UserSearch.jsx', 'utf8');

const subscriptionCode = `  useEffect(() => {
    // Realtime Sync Fix: Listen to UPDATE events on the profiles table for ALL rows so changes reflect globally
    const subscription = supabase
      .channel('global-profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        setSearchResults(prev => prev.map(u => u.id === payload.new.id ? { ...u, ...payload.new } : u));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('maxe_recent_searches');`;

content = content.replace("  useEffect(() => {\n    const saved = localStorage.getItem('maxe_recent_searches');", subscriptionCode);
content = content.replace("  useEffect(() => {\r\n    const saved = localStorage.getItem('maxe_recent_searches');", subscriptionCode);

fs.writeFileSync('src/screens/UserSearch.jsx', content);
