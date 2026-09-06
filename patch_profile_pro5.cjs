const fs = require('fs');

let c = fs.readFileSync('src/screens/Profile.jsx', 'utf8');

if (!c.includes('AvatarDecoration')) {
  c = c.replace(
    "import ProSettingsModal from '../components/ProSettingsModal';",
    "import ProSettingsModal, { THEME_DECORATIONS } from '../components/ProSettingsModal';\nimport AvatarDecoration from '../components/AvatarDecoration';"
  );
}

// Update the profile view card
// It looks like:
//         <div className="card p-4 relative overflow-hidden">
//           {/* Nitro Gradient Banner if active */}
const cardStart = c.indexOf('<div className="card p-4 relative overflow-hidden">');

const replacement = `        <div className="card p-4 relative overflow-hidden" style={{
          ...(userProfile?.is_premium && profileEffects?.wallpaper !== 'none' ? {
            background: profileEffects.wallpaper === 'custom' && profileEffects.customWallpaperUrl ? \`url(\${profileEffects.customWallpaperUrl})\` : 
                          profileEffects.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                          profileEffects.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                          profileEffects.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : 'var(--theme-surface)',
            backgroundSize: profileEffects.wallpaper === 'custom' ? 'cover' : profileEffects.wallpaper === 'waves' ? 'auto' : '20px 20px', backgroundPosition: 'center'
          } : {})
        }}>
          {userProfile?.is_premium && profileEffects?.wallpaper && profileEffects.wallpaper !== 'none' && <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] pointer-events-none z-0"></div>}
`;

if (cardStart !== -1) {
    c = c.replace('<div className="card p-4 relative overflow-hidden">', replacement);
}

// Add the avatar decorations
// It looks like:
//             <div
//               onClick={() => setShowAvatarPopup(true)}
//               className="relative w-20 h-20 shrink-0 cursor-pointer hover:scale-105 transition-transform">
//               <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center border-[3px]"
const avatarStartRegex = /<div\s+onClick=\{\(\) => setShowAvatarPopup\(true\)\}\s+className="relative w-20 h-20 shrink-0 cursor-pointer hover:scale-105 transition-transform">/g;

const avatarReplacement = `<div
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
`;

c = c.replace(avatarStartRegex, avatarReplacement);

fs.writeFileSync('src/screens/Profile.jsx', c);
