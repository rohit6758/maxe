const fs = require('fs');
let c = fs.readFileSync('src/screens/Profile.jsx', 'utf8');

// 1. Check imports - add THEME_DECORATIONS and AvatarDecoration if missing
if (!c.includes('THEME_DECORATIONS')) {
  c = c.replace(
    "import ProSettingsModal from '../components/ProSettingsModal';",
    "import ProSettingsModal from '../components/ProSettingsModal';\nimport { THEME_DECORATIONS } from '../components/ProSettingsModal';\nimport AvatarDecoration from '../components/AvatarDecoration';"
  );
}

// 2. Replace the whole profile card view (non-editing state) with the screenshot layout
const OLD_CARD = `      {!isEditing ? (
        <div className="card p-4 relative overflow-hidden">
          {/* Nitro Gradient Banner if active */}
          {userProfile?.is_premium && profileEffects?.banner === 'gradient' && (
            <div className="absolute top-0 left-0 right-0 h-16 opacity-30 pointer-events-none" style={{background: 'linear-gradient(90deg, var(--theme-primary), color-mix(in srgb, var(--theme-ring) 50%, transparent))'}} />
          )}

          {/* Compact profile row */}
          <div className="flex items-center gap-4 relative z-10 mt-2">
            <div
              onClick={() => setShowAvatarPopup(true)}
              className="relative w-20 h-20 shrink-0 cursor-pointer hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center border-[3px]"
                style={{borderColor: 'color-mix(in srgb, var(--theme-primary) 35%, transparent)', background:'color-mix(in srgb, var(--theme-sidebar) 60%, white)'}}>
                {userProfile?.avatar_url
                  ? <img src={userProfile?.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <User size={32} style={{color:'var(--theme-primary)'}} />}
              </div>
            </div>
            
            <div className="flex-1 min-w-0 bg-white/60 backdrop-blur-sm p-3 rounded-2xl shadow-sm">
              <h2 className="text-base font-black flex items-center gap-1.5 truncate" style={{color:'var(--theme-header)'}}>
                {userProfile?.name || 'Your Name'}
                {userProfile?.is_premium && <VerifiedBadge />}
              </h2>
              <p className="text-sm font-bold mt-0.5" style={{color:'var(--theme-primary)'}}>@{userProfile?.username || 'username'}</p>
              <p className="text-xs font-semibold mt-0.5" style={{color:'var(--theme-body)'}}>{userProfile?.branch || ''}{userProfile?.college ? \` • \${userProfile.college}\` : ''}</p>
              <div className="flex gap-4 mt-2">
                <button onClick={() => openNetwork('followers')} className="flex items-center gap-1.5 hover:opacity-80">
                  <span className="text-sm font-black" style={{color:'var(--theme-header)'}}>{followerCount}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{color:'var(--theme-body)'}}>Followers</span>
                </button>
                <button onClick={() => openNetwork('following')} className="flex items-center gap-1.5 hover:opacity-80">
                  <span className="text-sm font-black" style={{color:'var(--theme-header)'}}>{followingCount}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{color:'var(--theme-body)'}}>Following</span>
                </button>
              </div>
            </div>
          </div>
          {userProfile?.bio && (
            <div className="relative z-10 mt-3 bg-white/50 backdrop-blur-sm p-2 rounded-xl">
              <p className="text-xs leading-relaxed" style={{color:'var(--theme-body)'}}>{userProfile.bio}</p>
            </div>
          )}`;

const NEW_CARD = `      {!isEditing ? (
        <div className="card relative overflow-hidden" style={{
          padding: 0,
          ...(userProfile?.is_premium && profileEffects?.wallpaper && profileEffects.wallpaper !== 'none' ? {
            background: profileEffects.wallpaper === 'custom' && profileEffects.customWallpaperUrl ? \`url('\${profileEffects.customWallpaperUrl}')\` :
                        profileEffects.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                        profileEffects.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                        profileEffects.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : undefined,
            backgroundSize: profileEffects.wallpaper === 'custom' ? 'cover' : profileEffects.wallpaper === 'waves' ? 'auto' : '20px 20px',
            backgroundPosition: 'center',
          } : {})
        }}>
          {/* Nitro Gradient Banner */}
          {userProfile?.is_premium && profileEffects?.banner === 'gradient' && (
            <div className="absolute top-0 left-0 right-0 h-16 opacity-30 pointer-events-none" style={{background: 'linear-gradient(90deg, var(--theme-primary), color-mix(in srgb, var(--theme-ring) 50%, transparent))'}} />
          )}

          {/* Profile row - padded, text directly on background */}
          <div className="flex items-center gap-4 relative z-10 px-4 pt-4">
            <div
              onClick={() => setShowAvatarPopup(true)}
              className="relative w-20 h-20 shrink-0 cursor-pointer hover:scale-105 transition-transform">
              {userProfile?.is_premium && (
                <div className="absolute inset-0 pointer-events-none scale-[1.3] z-0">
                  {(THEME_DECORATIONS[theme] || THEME_DECORATIONS.default).elements}
                </div>
              )}
              {userProfile?.is_premium && profileEffects?.avatar !== 'none' && (
                <AvatarDecoration type={profileEffects?.avatar} />
              )}
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center border-[3px] relative z-10"
                style={{borderColor: 'color-mix(in srgb, var(--theme-primary) 50%, transparent)', background:'color-mix(in srgb, var(--theme-sidebar) 60%, white)'}}>
                {userProfile?.avatar_url
                  ? <img src={userProfile?.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <User size={32} style={{color:'var(--theme-primary)'}} />}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-black flex items-center gap-1.5" style={{color:'var(--theme-header)', textShadow:'0 1px 4px rgba(255,255,255,0.7)'}}>
                {userProfile?.name || 'Your Name'}
                {userProfile?.is_premium && <VerifiedBadge />}
              </h2>
              <p className="text-sm font-bold mt-0.5" style={{color:'var(--theme-primary)', textShadow:'0 1px 3px rgba(255,255,255,0.5)'}}>@{userProfile?.username || 'username'}</p>
              <p className="text-xs font-semibold mt-0.5" style={{color:'var(--theme-body)'}}>{userProfile?.branch || ''}{userProfile?.college ? \` • \${userProfile.college}\` : ''}</p>
              <div className="flex gap-4 mt-2">
                <button onClick={() => openNetwork('followers')} className="flex items-center gap-1.5 hover:opacity-80">
                  <span className="text-sm font-black" style={{color:'var(--theme-header)'}}>{followerCount}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{color:'var(--theme-body)'}}>Followers</span>
                </button>
                <button onClick={() => openNetwork('following')} className="flex items-center gap-1.5 hover:opacity-80">
                  <span className="text-sm font-black" style={{color:'var(--theme-header)'}}>{followingCount}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{color:'var(--theme-body)'}}>Following</span>
                </button>
              </div>
            </div>
          </div>
          {userProfile?.bio && (
            <div className="relative z-10 mt-2 px-4">
              <p className="text-xs leading-relaxed" style={{color:'var(--theme-body)'}}>{userProfile.bio}</p>
            </div>
          )}`;

if (c.includes(OLD_CARD)) {
  c = c.replace(OLD_CARD, NEW_CARD);
  // Also remove the separate "Profile" header card
  c = c.replace(`      {/* Compact Header */}\n      <div className="card px-4 py-3">\n        <h2 className="text-sm font-black" style={{color:'var(--theme-header)'}}>Profile</h2>\n      </div>\n\n`, '');
  fs.writeFileSync('src/screens/Profile.jsx', c);
  console.log('Done!');
} else {
  console.log('Could not match OLD_CARD - checking manually');
  const idx = c.indexOf('{!isEditing ? (');
  console.log('isEditing idx:', idx);
  if (idx > -1) console.log(c.substring(idx, idx + 300));
}
