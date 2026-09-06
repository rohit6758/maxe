const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.jsx', 'utf8');

const oldSaveEffects = `  const saveEffectsToDb = async (t, e) => {
    if (session) {
      const payload = JSON.stringify({ theme: t, profileEffects: e });
      await supabase.from('profiles').update({ interests: payload }).eq('id', currentSession.user.id);
    }
  };`;

const newSaveEffects = `  const saveEffectsToDb = async (t, e) => {
    if (session) {
      const payload = JSON.stringify({ theme: t, profileEffects: e });
      const { error } = await supabase.from('profiles').update({ interests: payload }).eq('id', session.user.id);
      if (error) {
        console.error("Failed to save effects to DB (Check if 'interests' column is type 'text'):", error);
      }
    }
  };`;

content = content.replace(oldSaveEffects, newSaveEffects);

// also fix updateProfileEffects
const oldUpdateProfile = `  const updateProfileEffects = async (effects) => {
    setProfileEffectsState(effects);
    const payload = JSON.stringify({ theme, profileEffects: effects });
    if (session) {
      await supabase.from('profiles').update({ interests: payload }).eq('id', session.user.id);
    }
  };`;
  
const newUpdateProfile = `  const updateProfileEffects = async (effects) => {
    setProfileEffectsState(effects);
    const payload = JSON.stringify({ theme, profileEffects: effects });
    if (session) {
      const { error } = await supabase.from('profiles').update({ interests: payload }).eq('id', session.user.id);
      if (error) console.error("Profile effect save error:", error);
    }
  };`;

content = content.replace(oldUpdateProfile, newUpdateProfile);

fs.writeFileSync('src/context/AppContext.jsx', content);
