const fs = require('fs');
let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

// 1. Fix missing z-index
content = content.replace(
    '<div className="flex-1">',
    '<div className="flex-1 relative z-10">'
);
content = content.replace(
    '<button onClick={(e) => { e.stopPropagation(); openMembersModal(); }} className="btn-outline text-sm flex items-center gap-1 py-1.5 px-2 mr-1">',
    '<button onClick={(e) => { e.stopPropagation(); openMembersModal(); }} className="btn-outline text-sm flex items-center gap-1 py-1.5 px-2 mr-1 relative z-10">'
);
content = content.replace(
    '<button onClick={() => setShowShareModal(true)} className="btn-primary text-sm flex items-center gap-1 py-1.5 px-3">',
    '<button onClick={() => setShowShareModal(true)} className="btn-primary text-sm flex items-center gap-1 py-1.5 px-3 relative z-10">'
);

fs.writeFileSync('src/screens/Explore.jsx', content);
