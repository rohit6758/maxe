const fs = require('fs');
let content = fs.readFileSync('src/components/NotificationsMenu.jsx', 'utf8');

// Replace incorrectly escaped backticks and template literals
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$\{/g, '${');

fs.writeFileSync('src/components/NotificationsMenu.jsx', content);
