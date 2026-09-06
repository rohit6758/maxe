const fs = require('fs');
let u = fs.readFileSync('src/screens/UserSearch.jsx', 'utf8');
u = u.replace(/\`url\(\$\{eff\.customWallpaperUrl\}\)\`/g, "\`url('\${eff.customWallpaperUrl}')\`");
fs.writeFileSync('src/screens/UserSearch.jsx', u);

let up = fs.readFileSync('src/components/UserProfilePopup.jsx', 'utf8');
up = up.replace(/\`url\(\$\{eff\.customWallpaperUrl\}\)\`/g, "\`url('\${eff.customWallpaperUrl}')\`");
fs.writeFileSync('src/components/UserProfilePopup.jsx', up);
