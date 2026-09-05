const fs = require('fs');
let c = fs.readFileSync('src/screens/Profile.jsx', 'utf8');

if (!c.includes('ProSettingsModal')) {
  c = c.replace(
    "import UserProfilePopup from '../components/UserProfilePopup';",
    "import UserProfilePopup from '../components/UserProfilePopup';\nimport ProSettingsModal from '../components/ProSettingsModal';"
  );
}

if (!c.includes('showProModal')) {
  c = c.replace(
    "const [selectedUser, setSelectedUser] = useState(null); // For Profile Popup",
    "const [selectedUser, setSelectedUser] = useState(null); // For Profile Popup\n  const [showProModal, setShowProModal] = useState(false);"
  );
}

const NEW_RETURN_START = `  return (
    <div className="space-y-3 pb-24 md:pb-8">

      {/* Compact Header */}
      <div className="card px-4 py-3">
        <h2 className="text-sm font-black" style={{color:'var(--theme-header)'}}>Profile</h2>
      </div>

      {!isEditing ? (
        <div className="card p-4 relative overflow-hidden" style={{
          ...(userProfile?.is_premium && profileEffects?.wallpaper && profileEffects?.wallpaper !== 'none' ? {
            background: profileEffects.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                        profileEffects.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                        profileEffects.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : 'var(--theme-surface)',
            backgroundSize: profileEffects.wallpaper === 'waves' ? 'auto' : '20px 20px'
          } : {})
        }}>
          {/* Nitro Gradient Banner if active */}
          {userProfile?.is_premium && profileEffects?.banner === 'gradient' && (
            <div className="absolute top-0 left-0 right-0 h-16 opacity-30 pointer-events-none" style={{background: 'linear-gradient(90deg, var(--theme-primary), color-mix(in srgb, var(--theme-ring) 50%, transparent))'}} />
          )}

          {/* Compact profile row */}
          <div className="flex items-center gap-3 relative z-10">
            <div
              onClick={() => setShowAvatarPopup(true)}
              className="relative w-16 h-16 shrink-0 cursor-pointer hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center border-2"
                style={{borderColor: 'color-mix(in srgb, var(--theme-primary) 35%, transparent)', background:'color-mix(in srgb, var(--theme-sidebar) 60%, white)'}}>
                {userProfile?.avatar_url
                  ? <img src={userProfile?.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <User size={28} style={{color:'var(--theme-primary)'}} />}
              </div>
            </div>
            
            <div className="flex-1 min-w-0 bg-white/50 backdrop-blur-sm p-2 rounded-xl">
              <h2 className="text-sm font-black flex items-center gap-1 truncate" style={{color:'var(--theme-header)'}}>
                {userProfile?.name || 'Your Name'}
                {userProfile?.is_premium && <VerifiedBadge />}
              </h2>
              <p className="text-xs font-semibold" style={{color:'var(--theme-primary)'}}>@{userProfile?.username || 'username'}</p>
              <p className="text-[11px]" style={{color:'var(--theme-body)'}}>{userProfile?.branch || ''}{userProfile?.college ? \` • \${userProfile.college}\` : ''}</p>
              <div className="flex gap-3 mt-1">
                <button onClick={() => openNetwork('followers')} className="flex items-center gap-1 hover:opacity-80">
                  <span className="text-xs font-black" style={{color:'var(--theme-header)'}}>{followerCount}</span>
                  <span className="text-[10px] font-bold" style={{color:'var(--theme-body)'}}>Followers</span>
                </button>
                <button onClick={() => openNetwork('following')} className="flex items-center gap-1 hover:opacity-80">
                  <span className="text-xs font-black" style={{color:'var(--theme-header)'}}>{followingCount}</span>
                  <span className="text-[10px] font-bold" style={{color:'var(--theme-body)'}}>Following</span>
                </button>
              </div>
            </div>
          </div>
          {userProfile?.bio && (
            <div className="relative z-10 mt-3 bg-white/50 backdrop-blur-sm p-2 rounded-xl">
              <p className="text-xs leading-relaxed" style={{color:'var(--theme-body)'}}>{userProfile.bio}</p>
            </div>
          )}
          <div className="flex gap-2 mt-4 relative z-10">
            <button onClick={() => setIsEditing(true)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 bg-white/80 backdrop-blur-sm"
              style={{color:'var(--theme-header)', border:'1px solid color-mix(in srgb, var(--theme-ring) 60%, transparent)'}}>
              Edit Profile
            </button>
            {userProfile?.is_premium ? (
              <button onClick={() => setShowProModal(true)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 bg-white/80 backdrop-blur-sm shadow-sm"
                style={{color:'var(--theme-primary)', border:'1px solid color-mix(in srgb, var(--theme-primary) 40%, transparent)'}}>
                ✨ Pro Settings
              </button>
            ) : (
              <button onClick={() => setShowProModal(true)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md"
                style={{background:'var(--theme-primary)', color:'#fff'}}>
                Upgrade ₹70
              </button>
            )}
          </div>
        </div>
      ) : (`;

const startIdx = c.indexOf('  return (\n');
const endIdx = c.indexOf('      ) : (\n        <div className="card p-5 space-y-5">\n          <div className="flex items-center justify-between mb-2">');

if (startIdx !== -1 && endIdx !== -1) {
  c = c.substring(0, startIdx) + NEW_RETURN_START + c.substring(endIdx + 11);
  
  // Add modal before network modal
  if (!c.includes('<ProSettingsModal')) {
    c = c.replace(
      '{/* Network Modal */}',
      '{showProModal && <ProSettingsModal isOpen={showProModal} onClose={() => setShowProModal(false)} />}\n\n      {/* Network Modal */}'
    );
  }
  
  fs.writeFileSync('src/screens/Profile.jsx', c);
  console.log('Successfully patched Profile.jsx');
} else {
  console.log('Failed to patch Profile.jsx, indices not found', startIdx, endIdx);
}
