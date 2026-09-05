const fs = require('fs');
let c = fs.readFileSync('src/Layout.jsx', 'utf8');
c = c.replace(/style=\{\{.*?\}\}/g, '');
fs.writeFileSync('src/Layout.jsx', c);
