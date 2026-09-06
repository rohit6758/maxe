const fs = require('fs');
let p = fs.readFileSync('src/screens/Profile.jsx', 'utf8');

p = p.replace(
  "userProfile?.is_premium && profileEffects?.wallpaper !== 'none'",
  "userProfile?.is_premium && profileEffects?.wallpaper && profileEffects.wallpaper !== 'none'"
);

p = p.replace(
  /\`url\(\$\{profileEffects\.customWallpaperUrl\}\)\`/g,
  "\`url('\${profileEffects.customWallpaperUrl}')\`"
);

fs.writeFileSync('src/screens/Profile.jsx', p);
