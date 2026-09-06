const fs = require('fs');
let c = fs.readFileSync('src/screens/Profile.jsx', 'utf8');

// 1. Put back the wallpaper logic to the card
const wallpaperLogic = `        {!isEditing ? (
          <div className="card p-4 relative overflow-hidden" style={{
            ...(userProfile?.is_premium && profileEffects?.wallpaper && profileEffects.wallpaper !== 'none' ? {
              background: profileEffects.wallpaper === 'custom' && profileEffects.customWallpaperUrl ? \`url('\${profileEffects.customWallpaperUrl}')\` : 
                            profileEffects.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                            profileEffects.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                            profileEffects.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : 'var(--theme-surface)',
              backgroundSize: profileEffects.wallpaper === 'custom' ? 'cover' : profileEffects.wallpaper === 'waves' ? 'auto' : '20px 20px',
              backgroundPosition: 'center'
            } : {})
          }}>
          {/* Nitro Gradient Banner if active */}`;

c = c.replace(/        \{!isEditing \? \(\n          <div className="card p-4 relative overflow-hidden">\n          \{\/\* Nitro Gradient Banner if active \*\//, wallpaperLogic);


// 2. Change Upgrade button logic
const upgradeLogic = `              ) : (
                <button onClick={() => {
                  if (session?.user?.email === 'rohitnxtgengw@gmail.com') {
                    setShowProModal(true);
                  } else {
                    alert("Pro upgrade is currently locked during testing. Please wait for the official release!");
                  }
                }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md"
                  style={{background:'var(--theme-primary)', color:'#fff'}}>
                  Upgrade ₹50
                </button>
              )}`;

c = c.replace(/              \) : \(\n                <button onClick=\{\(\) => setShowProModal\(true\)\}\n                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md"\n                  style=\{\{background:'var\(--theme-primary\)', color:'#fff'\}\}>\n                  Upgrade [^\n]+\n                <\/button>\n              \)/, upgradeLogic);

fs.writeFileSync('src/screens/Profile.jsx', c);
console.log('patched Profile.jsx');
