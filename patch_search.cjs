const fs = require('fs');

let c = fs.readFileSync('src/screens/UserSearch.jsx', 'utf8');

const regex = /<div key=\{user\.id\} onClick=\{\(\) => openUserPopup\(user\)\} className="px-2 py-3 flex items-center gap-3\\ncursor-pointer hover:bg-black\/5 transition-colors">/m;
const oldBlock = `<div key={user.id} onClick={() => openUserPopup(user)} className="px-2 py-3 flex items-center gap-3 cursor-pointer hover:bg-black/5 transition-colors">`;

const newBlock = `              let eff = null;
              if (user.interests && user.interests.startsWith('{')) {
                try {
                  const parsed = JSON.parse(user.interests);
                  if (parsed.profileEffects) eff = parsed.profileEffects;
                } catch(e) {}
              }
              const hasWallpaper = user.is_premium && eff && eff.wallpaper && eff.wallpaper !== 'none';
              const wallpaperStyle = hasWallpaper ? {
                background: eff.wallpaper === 'custom' && eff.customWallpaperUrl ? \`url(\${eff.customWallpaperUrl})\` :
                            eff.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                            eff.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                            eff.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : 'var(--theme-surface)',
                backgroundSize: eff.wallpaper === 'custom' ? 'cover' : eff.wallpaper === 'waves' ? 'auto' : '20px 20px',
                backgroundPosition: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              } : {};

              return (
                <div key={user.id} onClick={() => openUserPopup(user)} 
                  className={\`px-3 py-3 flex items-center gap-3 cursor-pointer transition-colors \${hasWallpaper ? 'rounded-xl mb-2 border border-primary/10' : 'hover:bg-black/5'}\`}
                  style={wallpaperStyle}
                >
                  {hasWallpaper && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] rounded-xl pointer-events-none"></div>}
                  <div className="relative z-10 \`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-sm \${user.is_premium ? 'bg-gradient-to-tr from-primary to-accent p-0.5' : 'bg-surface border border-primary/15'}\`}">`;

if (c.includes(oldBlock)) {
  const s1 = c.indexOf(oldBlock);
  const before = c.substring(0, s1 - 25); // remove the return ( 
  const replaceStr = "            return (\n                " + oldBlock + '\n                  <div className={`w-12 h-12';
  
  c = c.replace(replaceStr, newBlock + ' rounded-full');
  
  fs.writeFileSync('src/screens/UserSearch.jsx', c);
  console.log('patched UserSearch.jsx');
} else {
  console.log('could not patch UserSearch.jsx');
}
