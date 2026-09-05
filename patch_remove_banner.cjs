const fs = require('fs');
let c = fs.readFileSync('src/components/UserProfilePopup.jsx', 'utf8');

c = c.replace(/\{profile\?\.is_premium && eff\?\.banner === 'gradient' && \([\s\S]*?<\/div>\s*\)\}/m, '');

fs.writeFileSync('src/components/UserProfilePopup.jsx', c);
console.log('removed banner');
