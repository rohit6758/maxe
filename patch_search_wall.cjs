const fs = require('fs');
let c = fs.readFileSync('src/screens/UserSearch.jsx', 'utf8');

// Target: the entire searchResults.map(...) return block
// We need to find and replace just the inner div that renders each result row

const OLD = `            return (
              <div key={user.id} onClick={() => openUserPopup(user)} 
                className={\`px-3 py-3 flex items-center gap-3 cursor-pointer transition-all relative overflow-hidden \${hasWallpaper ? 'rounded-xl mb-2 border border-primary/20 shadow-sm' : 'hover:bg-black/5'}\`}
                style={wallpaperStyle}
              >
                {hasWallpaper && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] pointer-events-none"></div>}
                
                <div className={\`relative z-10 w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-sm \${user.is_premium ? 'bg-gradient-to-tr from-primary to-accent p-0.5' : 'bg-surface border border-primary/15'}\`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-primary/5 flex items-center justify-center">
                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={20} className="text-primary/50" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-bold text-header flex items-center">
                      {user.name}
                      {user.is_premium && <VerifiedBadge />}
                    </p>
                    {user.college && <span className="text-[9px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">{user.college}</span>}
                  </div>
                  <p className="text-xs text-body truncate">@{user.username || 'user'} {user.branch ? \`• \${user.branch}\` : ''}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFollow(user.id); }}
                  className={\`relative z-10 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors \${isFollowing ? 'bg-surface text-header border border-primary/15' : 'bg-primary text-white shadow-sm'}\`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );`;

const NEW = `            return (
              <div key={user.id} onClick={() => openUserPopup(user)}
                className={\`px-3 py-3 flex items-center gap-3 cursor-pointer transition-all relative overflow-hidden \${hasWallpaper ? 'rounded-xl mb-2 border border-white/40 shadow-md' : 'hover:bg-black/5'}\`}
                style={wallpaperStyle}
              >
                {/* Soft scrim only for photo wallpapers */}
                {hasWallpaper && eff.wallpaper === 'custom' && (
                  <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                )}

                <div className={\`relative z-10 w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md \${user.is_premium ? 'ring-2 ring-white/70' : 'bg-surface border border-primary/15'}\`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-primary/5 flex items-center justify-center">
                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={20} className="text-primary/50" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-bold flex items-center"
                      style={hasWallpaper && eff.wallpaper === 'custom' ? {color:'#fff', textShadow:'0 1px 3px rgba(0,0,0,0.6)'} : {color:'var(--theme-header)'}}>
                      {user.name}
                      {user.is_premium && <VerifiedBadge />}
                    </p>
                    {user.college && <span className="text-[9px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">{user.college}</span>}
                  </div>
                  <p className="text-xs truncate"
                    style={hasWallpaper && eff.wallpaper === 'custom' ? {color:'rgba(255,255,255,0.85)'} : {color:'var(--theme-body)'}}>
                    @{user.username || 'user'} {user.branch ? \`• \${user.branch}\` : ''}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFollow(user.id); }}
                  className={\`relative z-10 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors \${isFollowing ? 'bg-white/80 text-header border border-primary/15 backdrop-blur-sm' : 'bg-primary text-white shadow-sm'}\`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );`;

if (c.includes(OLD)) {
  c = c.replace(OLD, NEW);
  fs.writeFileSync('src/screens/UserSearch.jsx', c);
  console.log('Patched search result rows!');
} else {
  // Try to find approximately
  const idx = c.indexOf("return (\n              <div key={user.id} onClick={() => openUserPopup(user)}");
  console.log('Could not match OLD. Return idx:', idx);
  if (idx > -1) console.log(c.substring(idx, idx + 200));
}
