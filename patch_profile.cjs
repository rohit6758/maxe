const fs = require('fs');
let c = fs.readFileSync('src/screens/Profile.jsx', 'utf8');

// 1. Add ProSettingsModal import
if (!c.includes('ProSettingsModal')) {
  c = c.replace(
    "import UserProfilePopup from '../components/UserProfilePopup';",
    "import UserProfilePopup from '../components/UserProfilePopup';\nimport ProSettingsModal from '../components/ProSettingsModal';"
  );
}

// 2. Add showProModal state after selectedUser state
if (!c.includes('showProModal')) {
  c = c.replace(
    "const [selectedUser, setSelectedUser] = useState(null); // For Profile Popup",
    "const [selectedUser, setSelectedUser] = useState(null); // For Profile Popup\n  const [showProModal, setShowProModal] = useState(false);"
  );
}

// 3. Make the profile card compact — replace the big avatar + all the pro section inline with compact version
// Find the return statement and replace the profile card
const OLD_RETURN_START = `  return (
    <div className="space-y-4 pb-24 md:pb-8">

      {/* Header */}
      <div className="card p-4">
        <h2 className="text-xl font-bold text-aberration" className="text-header">Profile</h2>
      </div>

      {!isEditing ? (
        <div className="card p-6">
          <div className="flex items-center gap-5">
            <div 
              onClick={() => setShowAvatarPopup(true)}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex items-center justify-center shrink-0 border-2 cursor-pointer transition-transform hover:scale-105"
              style={{borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)', background: 'rgba(107,168,152,10%, transparent)'}}>
              {userProfile?.avatar_url
                ? <img src={userProfile?.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <User size={40} className="text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold truncate flex items-center" className="text-header">
                {userProfile?.name || 'Your Name'}
                {userProfile?.is_premium && <VerifiedBadge />}
              </h2>
              <p className="text-xs font-semibold mt-0.5" className="text-primary">@{userProfile?.username || 'username'}</p>
              <p className="text-xs md:text-sm font-semibold mt-0.5" className="text-primary">{userProfile?.college ? \`\${userProfile.college} • \${userProfile.branch}\` : (userProfile?.branch || 'No branch selected')}</p>
              
              <div className="flex gap-4 mt-2">
                <button onClick={() => openNetwork('followers')} className="flex flex-col items-start hover:opacity-80">
                  <span className="font-bold text-sm" className="text-header">{followerCount}</span>
                  <span className="text-[10px] uppercase font-bold" className="text-primary">Followers</span>
                </button>
                <button onClick={() => openNetwork('following')} className="flex flex-col items-start hover:opacity-80">
                  <span className="font-bold text-sm" className="text-header">{followingCount}</span>
                  <span className="text-[10px] uppercase font-bold" className="text-primary">Following</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-5">
            <p className="text-sm whitespace-pre-wrap leading-relaxed" className="text-body">
              {userProfile?.bio || 'Add a bio...'}
            </p>
          </div>
          
          <button 
            onClick={() => setIsEditing(true)}
            className="w-full mt-6 py-2 rounded-xl text-sm font-bold transition-transform active:scale-95"
            style={{background: 'color-mix(in srgb, var(--theme-sidebar) 80%, white)', color: 'var(--theme-header)', border: '1px solid color-mix(in srgb, var(--theme-ring) 60%, transparent)'}}>
            Edit Profile
          </button>`;

const NEW_RETURN_START = `  return (
    <div className="space-y-3 pb-24 md:pb-8">

      {/* Compact Header */}
      <div className="card px-4 py-3">
        <h2 className="text-sm font-black" style={{color:'var(--theme-header)'}}>Profile</h2>
      </div>

      {!isEditing ? (
        <div className="card p-4">
          {/* Compact profile row */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setShowAvatarPopup(true)}
              className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
              style={{border:'2px solid color-mix(in srgb, var(--theme-primary) 35%, transparent)', background:'color-mix(in srgb, var(--theme-sidebar) 60%, white)'}}>
              {userProfile?.avatar_url
                ? <img src={userProfile?.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <User size={26} style={{color:'var(--theme-primary)'}} />}
            </div>
            <div className="flex-1 min-w-0">
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
            <p className="text-xs mt-3 leading-relaxed" style={{color:'var(--theme-body)'}}>{userProfile.bio}</p>
          )}
          <div className="flex gap-2 mt-3">
            <button onClick={() => setIsEditing(true)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{background:'color-mix(in srgb, var(--theme-sidebar) 70%, white)', color:'var(--theme-header)', border:'1px solid color-mix(in srgb, var(--theme-ring) 60%, transparent)'}}>
              Edit Profile
            </button>
            {userProfile?.is_premium ? (
              <button onClick={() => setShowProModal(true)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
                style={{background:'color-mix(in srgb, var(--theme-primary) 15%, transparent)', color:'var(--theme-primary)', border:'1px solid color-mix(in srgb, var(--theme-primary) 30%, transparent)'}}>
                ✨ Pro Settings
              </button>
            ) : (
              <button onClick={() => setShowProModal(true)}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={{background:'var(--theme-primary)', color:'#fff'}}>
                Upgrade ₹70
              </button>
            )}
          </div>`;

if (c.includes(OLD_RETURN_START)) {
  c = c.replace(OLD_RETURN_START, NEW_RETURN_START);
  console.log('Replaced profile card start');
} else {
  console.log('ERROR: Could not find OLD_RETURN_START pattern');
  process.exit(1);
}

// 4. Replace the big inline Pro section (from "MAXE PRO SECTION" comment to end of profile block)
const OLD_PRO = `          {/* MAXE PRO SECTION */}
          {userProfile?.is_premium ? (
            <div className="mt-8 space-y-6">
              <h3 className="font-black text-header text-lg border-b border-primary/20 pb-2">Pro Settings</h3>
              
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'var(--theme-header)'}}>App Theme</p>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { id:'default', label:'Mint',     bg:'#D3EDE0', primary:'#1B7A52' },
                    { id:'eastbay', label:'East Bay',  bg:'#E5E2CC', primary:'#393EA0' },
                    { id:'dolphin', label:'Dolphin',   bg:'#EDD9C9', primary:'#7A3A9A' },
                    { id:'venice',  label:'Venice',    bg:'#CCDFEE', primary:'#0C5E8A' },
                    { id:'lagoon',  label:'Lagoon',    bg:'#FAC8CC', primary:'#007080' },
                    { id:'berry',   label:'Berry',     bg:'#F3BEE2', primary:'#8A1868' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)} title={t.label} aria-label={\`\${t.label} Theme\`}
                      className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden flex"
                        style={{boxShadow: theme===t.id ? \`0 0 0 3px \${t.primary}, 0 4px 14px \${t.primary}55\` : '0 2px 6px rgba(0,0,0,0.15)', transform: theme===t.id ? 'scale(1.14)' : 'scale(1)', transition:'all 0.2s'}}>
                        <div className="w-1/2 h-full" style={{background: t.bg}}></div>
                        <div className="w-1/2 h-full" style={{background: t.primary}}></div>
                      </div>
                      <span className="text-[9px] font-bold" style={{color:'var(--theme-body)', opacity:0.7}}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-header uppercase tracking-wider mb-3">Profile Effects</p>
                <div className="bg-surface border border-primary/20 rounded-xl p-4 flex flex-col gap-4">
                  
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold text-header text-sm">Nitro Animated Banner</h4>
                    <div className="flex gap-2">
                      <button onClick={() => setProfileEffects({...profileEffects, banner: 'none'})} className={\`px-3 py-1.5 rounded-lg text-xs font-bold border-2 \${profileEffects.banner==='none' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-body hover:bg-surface'}\`}>None</button>
                      <button onClick={() => setProfileEffects({...profileEffects, banner: 'gradient'})} className={\`px-3 py-1.5 rounded-lg text-xs font-bold border-2 \${profileEffects.banner==='gradient' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-body hover:bg-surface'}\`}>Nitro Gradient</button>
                    </div>
                  </div>
                  <div className="h-px w-full bg-primary/10 my-1"></div>
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold text-header text-sm">Avatar Decoration</h4>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setProfileEffects({...profileEffects, avatar: 'none'})} className={\`px-3 py-1.5 rounded-lg text-xs font-bold border-2 \${profileEffects.avatar==='none' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-body hover:bg-surface'}\`}>None</button>
                      <button onClick={() => setProfileEffects({...profileEffects, avatar: 'neon-pulse'})} className={\`px-3 py-1.5 rounded-lg text-xs font-bold border-2 \${profileEffects.avatar==='neon-pulse' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-body hover:bg-surface'}\`}>Neon Glow</button>
                      <button onClick={() => setProfileEffects({...profileEffects, avatar: 'spinning-ring'})} className={\`px-3 py-1.5 rounded-lg text-xs font-bold border-2 \${profileEffects.avatar==='spinning-ring' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-body hover:bg-surface'}\`}>Spinning Ring</button>
                      <button onClick={() => setProfileEffects({...profileEffects, avatar: 'fire-aura'})} className={\`px-3 py-1.5 rounded-lg text-xs font-bold border-2 \${profileEffects.avatar==='fire-aura' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-body hover:bg-surface'}\`}>Fire Aura</button>
                      <button onClick={() => setProfileEffects({...profileEffects, avatar: 'skeleton-hands'})} className={\`px-3 py-1.5 rounded-lg text-xs font-bold border-2 \${profileEffects.avatar==='skeleton-hands' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-body hover:bg-surface'}\`}>Skeleton Hands</button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <div>
                <h3 className="font-black text-header text-lg">Upgrade to Maxe Pro</h3>
                <p className="text-xs text-body mt-1">Get the Verified Badge, custom themes, and animated profile effects.</p>
                <button className="mt-3 bg-header text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-header/90 transition-colors">
                  Get Pro for ₹70
                </button>
              </div>
            </div>
          )}`;

const NEW_PRO = `          {/* Pro Settings Modal trigger */}
          {showProModal && <ProSettingsModal isOpen={showProModal} onClose={() => setShowProModal(false)} />}`;

if (c.includes(OLD_PRO)) {
  c = c.replace(OLD_PRO, NEW_PRO);
  console.log('Replaced Pro section');
} else {
  console.log('ERROR: Could not find OLD_PRO pattern');
  // Just add the modal render before </div>
  c = c.replace(
    '{showAvatarPopup && (',
    '{showProModal && <ProSettingsModal isOpen={showProModal} onClose={() => setShowProModal(false)} />}\n\n      {showAvatarPopup && ('
  );
  console.log('Fallback: added ProSettingsModal before avatar popup');
}

fs.writeFileSync('src/screens/Profile.jsx', c);
console.log('Profile.jsx updated');
