const fs = require('fs');
let c = fs.readFileSync('src/context/AppContext.jsx', 'utf8');

const NEW_SETTERS = `  const saveEffectsToDb = async (t, e) => {
    if (!session?.user?.id) return;
    try {
      const payload = JSON.stringify({ theme: t, profileEffects: e });
      await supabase.from('profiles').update({ interests: payload }).eq('id', session.user.id);
    } catch(err) {
      console.error('Failed to sync effects to DB', err);
    }
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('maxe_theme', newTheme);
    saveEffectsToDb(newTheme, profileEffects);
  };
  
  const setProfileEffects = (newEffects) => {
    setProfileEffectsState(newEffects);
    localStorage.setItem('maxe_effects', JSON.stringify(newEffects));
    saveEffectsToDb(theme, newEffects);
  };`;

const regex = /  const setTheme = \(newTheme\) => \{[\s\S]*?localStorage\.setItem\('maxe_effects', JSON\.stringify\(newEffects\)\);\s*\};/m;

if (regex.test(c)) {
  c = c.replace(regex, NEW_SETTERS);
  fs.writeFileSync('src/context/AppContext.jsx', c);
  console.log('patched AppContext.jsx');
} else {
  console.log('could not patch AppContext');
}
