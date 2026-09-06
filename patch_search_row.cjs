const fs = require('fs');
let c = fs.readFileSync('src/screens/UserSearch.jsx', 'utf8');

c = c.replace(/\{hasWallpaper && <div className="absolute inset-0 bg-black\/40 backdrop-blur-\[2px\] pointer-events-none"><\/div>\}/g, 
  '{hasWallpaper && <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>}');

c = c.replace(/className="font-bold text-sm text-header truncate flex items-center gap-1"/g, 
  'className={`font-bold text-sm truncate flex items-center gap-1 ${hasWallpaper ? \'text-white drop-shadow-md\' : \'text-header\'}`}');

c = c.replace(/className="text-xs text-primary font-medium truncate"/g, 
  'className={`text-xs font-medium truncate ${hasWallpaper ? \'text-white/80\' : \'text-primary\'}`}');

// X button
c = c.replace(/<X size=\{20\} \/>/g, '<X size={20} className={hasWallpaper ? "text-white/80" : ""} />');

fs.writeFileSync('src/screens/UserSearch.jsx', c);
console.log('patched UserSearch UI');
