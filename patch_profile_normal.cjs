const fs = require('fs');
let c = fs.readFileSync('src/screens/Profile.jsx', 'utf8');

c = c.replace(/<div className="card p-4 relative overflow-hidden" style=\{\{[\s\S]*?\}\s*\}\s*>\s*\{\/\* Nitro Gradient Banner/, '<div className="card p-4 relative overflow-hidden">\n          {/* Nitro Gradient Banner');

fs.writeFileSync('src/screens/Profile.jsx', c);
console.log('patched Profile');
