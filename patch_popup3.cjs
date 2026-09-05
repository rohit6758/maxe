const fs = require('fs');
let c = fs.readFileSync('src/components/UserProfilePopup.jsx', 'utf8');

const regex = /  const effectiveTheme = isMe \? theme : \(profile\?\.is_premium \? 'venice' : 'default'\);\s*const dec = THEME_DECORATIONS\[effectiveTheme\] \|\| THEME_DECORATIONS\.default;\s*const eff = isMe \? profileEffects : \(profile\?\.is_premium \? \{ banner:'gradient', avatar:'neon-pulse', wallpaper:'waves' \} : \{ banner:'none', avatar:'none', wallpaper:'none' \}\);/m;

const replacement = `  let dbEffects = null;
  let dbTheme = null;
  if (profile?.interests && profile?.interests.startsWith('{')) {
    try {
      const parsed = JSON.parse(profile.interests);
      if (parsed.profileEffects) dbEffects = parsed.profileEffects;
      if (parsed.theme) dbTheme = parsed.theme;
    } catch(e) {}
  }

  const effectiveTheme = isMe ? theme : (dbTheme || (profile?.is_premium ? 'venice' : 'default'));
  const dec = THEME_DECORATIONS[effectiveTheme] || THEME_DECORATIONS.default;
  const eff = isMe ? profileEffects : (dbEffects || (profile?.is_premium ? { banner:'gradient', avatar:'neon-pulse', wallpaper:'waves' } : { banner:'none', avatar:'none', wallpaper:'none' }));`;

if (regex.test(c)) {
  c = c.replace(regex, replacement);
  fs.writeFileSync('src/components/UserProfilePopup.jsx', c);
  console.log('patched UserProfilePopup.jsx');
} else {
  console.log('could not patch UserProfilePopup.jsx');
}
