const fs = require('fs');

let content = fs.readFileSync('src/screens/UserSearch.jsx', 'utf8');

const replacement = `          searchResults.map(user => {
            const isFollowing = followingMap[user.id];
            let eff = null;
            if (user.interests && user.interests.startsWith('{')) {
              try {
                const parsed = JSON.parse(user.interests);
                if (parsed.profileEffects) eff = parsed.profileEffects;
              } catch(e) {}
            }
            
            const hasWallpaper = user.is_premium && eff && eff.wallpaper && eff.wallpaper !== 'none';
            const isCustomPhoto = hasWallpaper && eff.wallpaper === 'custom' && eff.customWallpaperUrl;
            
            const wallpaperStyle = hasWallpaper ? {
              background: isCustomPhoto ? \`url('\${eff.customWallpaperUrl}')\` :
                          eff.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                          eff.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                          eff.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : 'var(--theme-surface)',
              backgroundSize: isCustomPhoto ? 'cover' : eff.wallpaper === 'waves' ? 'auto' : '20px 20px',
              backgroundPosition: 'center'
            } : {};

            return (
              <div key={user.id} onClick={() => openUserPopup(user)}
                className={\`px-3 py-3 flex items-center gap-3 cursor-pointer transition-all relative overflow-hidden \${hasWallpaper ? 'rounded-xl mb-2 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.15)]' : 'hover:bg-black/5 border-b border-primary/5'}\`}
                style={wallpaperStyle}
              >
                {/* Soft scrim only for custom photo wallpapers */}
                {isCustomPhoto && (
                  <div className="absolute inset-0 bg-black/20 pointer-events-none rounded-xl" />
                )}

                <div className={\`relative z-10 w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md \${user.is_premium ? 'ring-2 ring-white/70' : 'bg-surface border border-primary/15'}\`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-primary/5 flex items-center justify-center">
                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={20} className="text-primary/50" />}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={\`text-sm font-bold flex items-center \${isCustomPhoto ? 'text-white drop-shadow-sm' : 'text-[var(--theme-header)]'}\`}>
                      {user.name}
                      {user.is_premium && <VerifiedBadge />}
                    </p>
                    {user.college && <span className="text-[9px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">{user.college}</span>}
                  </div>
                  <p className={\`text-xs truncate \${isCustomPhoto ? 'text-white drop-shadow-sm opacity-90' : 'text-[var(--theme-body)]'}\`}>
                    @{user.username || 'user'} {user.branch ? \`• \${user.branch}\` : ''}
                  </p>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); toggleFollow(user.id); }}
                  className={\`relative z-10 px-4 py-1.5 rounded-lg text-xs transition-all \${hasWallpaper ? 'bg-white/80 text-gray-900 backdrop-blur-md hover:bg-white/95 border border-white/40 font-medium' : isFollowing ? 'bg-surface border border-primary/20 text-header font-semibold' : 'bg-primary text-white font-semibold shadow-sm'}\`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })
        )}
      </div>`;

const startIdx = content.indexOf('          searchResults.map(user => {');
const endIdx = content.indexOf('      {/* User Profile Popup (Instagram Style) */}');

if (startIdx !== -1 && endIdx !== -1) {
    const endSegment = content.substring(endIdx);
    const endOfMapIdx = content.substring(0, endIdx).lastIndexOf('      </div>');
    content = content.substring(0, startIdx) + replacement + '\n' + content.substring(endOfMapIdx);
    fs.writeFileSync('src/screens/UserSearch.jsx', content);
    console.log('Success UserSearch mapping');
} else {
    console.log('Failed to find UserSearch mapping boundaries', startIdx, endIdx);
}
