const fs = require('fs');

// 1. Profile.jsx
let p = fs.readFileSync('src/screens/Profile.jsx', 'utf8');
p = p.replace(/\`url\(\$\{profileEffects\.customWallpaperUrl\}\)\`/g, "\`url('\${profileEffects.customWallpaperUrl}')\`");
p = p.replace(
  '{userProfile?.is_premium && profileEffects?.wallpaper && profileEffects.wallpaper !== \'none\' && <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] pointer-events-none z-0"></div>}',
  ''
);
fs.writeFileSync('src/screens/Profile.jsx', p);

// 2. UserSearch.jsx
let u = fs.readFileSync('src/screens/UserSearch.jsx', 'utf8');
u = u.replace(/\`url\(\$\{eff\.customWallpaperUrl\}\)\`/g, "\`url('\${eff.customWallpaperUrl}')\`");
fs.writeFileSync('src/screens/UserSearch.jsx', u);

// 3. UserProfilePopup.jsx
let up = fs.readFileSync('src/components/UserProfilePopup.jsx', 'utf8');
up = up.replace(/\`url\(\$\{eff\.customWallpaperUrl\}\)\`/g, "\`url('\${eff.customWallpaperUrl}')\`");
fs.writeFileSync('src/components/UserProfilePopup.jsx', up);

// 4. ProSettingsModal.jsx
let ps = fs.readFileSync('src/components/ProSettingsModal.jsx', 'utf8');
ps = ps.replace(/\`url\(\$\{profileEffects\.customWallpaperUrl\}\)\`/g, "\`url('\${profileEffects.customWallpaperUrl}')\`");
fs.writeFileSync('src/components/ProSettingsModal.jsx', ps);
