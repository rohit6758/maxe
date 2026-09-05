const fs = require('fs');
let c = fs.readFileSync('src/context/AppContext.jsx', 'utf8');

const syncLogic = `      if (data) {
        setUserProfile(data);
        // Auto-select the user's branch for the Hub if not already selected
        if (data.branch && !activeBranch) {
          setActiveBranch(data.branch);
        }
        
        // Sync local effects to DB if DB is empty
        const localTheme = localStorage.getItem('maxe_theme') || 'default';
        const localEff = localStorage.getItem('maxe_effects');
        if (!data.interests || !data.interests.includes('"profileEffects"')) {
           const payload = JSON.stringify({ theme: localTheme, profileEffects: localEff ? JSON.parse(localEff) : { banner: 'none', avatar: 'none' } });
           supabase.from('profiles').update({ interests: payload }).eq('id', userId).then(() => {
              console.log('Auto-synced local effects to DB');
           });
        }
      } else {`;

c = c.replace(/      if \(data\) \{\s*setUserProfile\(data\);\s*\/\/\s*Auto-select.*?\n\s*if \(data\.branch && !activeBranch\) \{\s*setActiveBranch\(data\.branch\);\s*\}\s*\} else \{/s, syncLogic);

fs.writeFileSync('src/context/AppContext.jsx', c);
console.log('patched AppContext');
