const fs = require('fs');
let c = fs.readFileSync('src/screens/Explore.jsx', 'utf8');
c = c.replace(
  "setShowShareModal(false);\n      setShareData({ subject_name: '', title: '', type: 'pdf', url: '', file: null });",
  "setShowShareModal(false);\n      setShareData({ subject_name: '', title: '', type: 'pdf', url: '', file: null });\n      loadPosts(selectedCommunity.id);"
);
fs.writeFileSync('src/screens/Explore.jsx', c);
