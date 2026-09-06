const fs = require('fs');
let c = fs.readFileSync('src/screens/UserSearch.jsx', 'utf8');
c = c.replace('\\${hasWallpaper', '${hasWallpaper');
fs.writeFileSync('src/screens/UserSearch.jsx', c);
