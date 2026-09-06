const fs = require('fs');
let content = fs.readFileSync('src/screens/UserSearch.jsx', 'utf8');
const regex = /<\/div>\s*<\/div>\s*\{\/\* User Profile Popup/g;
content = content.replace(regex, '</div>\n      \n      {/* User Profile Popup');
fs.writeFileSync('src/screens/UserSearch.jsx', content);
