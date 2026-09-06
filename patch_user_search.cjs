const fs = require('fs');

let c = fs.readFileSync('src/screens/UserSearch.jsx', 'utf8');

// Replace overlays
c = c.replaceAll('bg-white/20 backdrop-blur-[1px]', 'bg-black/40 backdrop-blur-[2px]');

// Recent searches text
c = c.replace(
  '<p className="text-base font-bold text-header flex items-center">',
  '<p className={`text-base font-bold flex items-center ${hasWallpaper ? \'text-white drop-shadow-md\' : \'text-header\'}`}>'
);
c = c.replace(
  '<p className="text-sm text-body truncate">@{item.username || \'user\'} {item.branch ? `• ${item.branch}` : \'\'}</p>',
  '<p className={`text-sm truncate ${hasWallpaper ? \'text-white/90 drop-shadow-sm\' : \'text-body\'}`}>@{item.username || \'user\'} {item.branch ? `• ${item.branch}` : \'\'}</p>'
);
c = c.replace(
  '<button onClick={(e) => removeRecentSearch(isText ? item : item.id, e)} className="p-2 text-body hover:text-header relative z-10">',
  '<button onClick={(e) => removeRecentSearch(isText ? item : item.id, e)} className={`p-2 relative z-10 ${hasWallpaper ? \'text-white/70 hover:text-white\' : \'text-body hover:text-header\'}`}>'
);

// Live searches text
c = c.replace(
  '<p className="text-sm font-bold text-header flex items-center">',
  '<p className={`text-sm font-bold flex items-center ${hasWallpaper ? \'text-white drop-shadow-md\' : \'text-header\'}`}>'
);
c = c.replace(
  '<p className="text-xs text-body truncate">@{user.username || \'user\'} {user.branch ? `• ${user.branch}` : \'\'}</p>',
  '<p className={`text-xs truncate ${hasWallpaper ? \'text-white/90 drop-shadow-sm\' : \'text-body\'}`}>@{user.username || \'user\'} {user.branch ? `• ${user.branch}` : \'\'}</p>'
);

fs.writeFileSync('src/screens/UserSearch.jsx', c);
