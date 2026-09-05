const fs = require('fs');
let c = fs.readFileSync('src/screens/UserSearch.jsx', 'utf8');

const regexRecent = /\{recentSearches\.map\(\(item, index\) => \{[\s\S]*?className="px-2 py-3 flex items-center gap-3 cursor-pointer hover:bg-black\/5 transition-colors"\s*>/;

const replacementRecent = `{recentSearches.map((item, index) => {
                  const isText = typeof item === 'string';
                  
                  let eff = null;
                  if (!isText && item.interests && item.interests.startsWith('{')) {
                    try {
                      const parsed = JSON.parse(item.interests);
                      if (parsed.profileEffects) eff = parsed.profileEffects;
                    } catch(e) {}
                  }
                  const hasWallpaper = !isText && item.is_premium && eff && eff.wallpaper && eff.wallpaper !== 'none';
                  const wallpaperStyle = hasWallpaper ? {
                    background: eff.wallpaper === 'custom' && eff.customWallpaperUrl ? \`url(\${eff.customWallpaperUrl})\` :
                                eff.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                                eff.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                                eff.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : 'var(--theme-surface)',
                    backgroundSize: eff.wallpaper === 'custom' ? 'cover' : eff.wallpaper === 'waves' ? 'auto' : '20px 20px',
                    backgroundPosition: 'center'
                  } : {};

                  return (
                    <div 
                      key={isText ? item : item.id} 
                      onClick={() => {
                        if (isText) {
                          setSearchQuery(item);
                          executeSearch(item);
                          saveRecentSearch(item); // bump to top
                        } else {
                          openUserPopup(item);
                        }
                      }} 
                      className={\`px-3 py-3 flex items-center gap-3 cursor-pointer transition-all relative overflow-hidden \${hasWallpaper ? 'rounded-xl mb-1 border border-primary/20 shadow-sm' : 'hover:bg-black/5'}\`}
                      style={wallpaperStyle}
                    >
                      {hasWallpaper && <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] pointer-events-none"></div>}`;

c = c.replace(regexRecent, replacementRecent);

// also fix the z-index for the contents of recent searches
const regexRecentContents = /<div className="flex-1 min-w-0">/;
c = c.replace(regexRecentContents, '<div className="flex-1 min-w-0 relative z-10">');

const regexRecentX = /<button onClick=\{\(e\) => removeRecentSearch\(isText \? item : item\.id, e\)\} className="p-2 text-body hover:text-header">/;
c = c.replace(regexRecentX, '<button onClick={(e) => removeRecentSearch(isText ? item : item.id, e)} className="p-2 text-body hover:text-header relative z-10">');

// also change the bg-white/60 to bg-white/20 in the live search results
c = c.replace(/bg-white\/60 backdrop-blur-\[1px\]/g, 'bg-white/20 backdrop-blur-[1px]');

fs.writeFileSync('src/screens/UserSearch.jsx', c);
console.log('patched UserSearch recent searches');
