const fs = require('fs');
let c = fs.readFileSync('src/screens/Profile.jsx', 'utf8');

// 1. Add imports if missing
if (!c.includes('THEME_DECORATIONS')) {
  c = c.replace(
    "import ProSettingsModal from '../components/ProSettingsModal';",
    "import ProSettingsModal, { THEME_DECORATIONS } from '../components/ProSettingsModal';\nimport AvatarDecoration from '../components/AvatarDecoration';"
  );
}

// 2. Remove the header card
c = c.replace(
  `      {/* Compact Header */}\r\n      <div className="card px-4 py-3">\r\n        <h2 className="text-sm font-black" style={{color:'var(--theme-header)'}}>Profile</h2>\r\n      </div>\r\n\r\n`,
  ''
);
// Also try LF version
c = c.replace(
  `      {/* Compact Header */}\n      <div className="card px-4 py-3">\n        <h2 className="text-sm font-black" style={{color:'var(--theme-header)'}}>Profile</h2>\n      </div>\n\n`,
  ''
);

// 3. Replace card div to add wallpaper and remove frosted glass container
c = c.replace(
  `<div className="card p-4 relative overflow-hidden">`,
  `<div className="card relative overflow-hidden" style={{
          padding: 0,
          ...(userProfile?.is_premium && profileEffects?.wallpaper && profileEffects.wallpaper !== 'none' ? {
            background: profileEffects.wallpaper === 'custom' && profileEffects.customWallpaperUrl ? \`url('\${profileEffects.customWallpaperUrl}')\` :
                        profileEffects.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                        profileEffects.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                        profileEffects.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : undefined,
            backgroundSize: profileEffects.wallpaper === 'custom' ? 'cover' : profileEffects.wallpaper === 'waves' ? 'auto' : '20px 20px',
            backgroundPosition: 'center',
          } : {})
        }}>`
);

// 4. Fix the profile row padding and remove mt-2
c = c.replace(
  `<div className="flex items-center gap-4 relative z-10 mt-2">`,
  `<div className="flex items-center gap-4 relative z-10 px-4 pt-4">`
);

// 5. Add emoji decorations back inside the avatar
c = c.replace(
  `<div\r\n              onClick={() => setShowAvatarPopup(true)}\r\n              className="relative w-20 h-20 shrink-0 cursor-pointer hover:scale-105 transition-transform">\r\n              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center border-[3px]"`,
  `<div\r\n              onClick={() => setShowAvatarPopup(true)}\r\n              className="relative w-20 h-20 shrink-0 cursor-pointer hover:scale-105 transition-transform">\r\n              {userProfile?.is_premium && (\r\n                <div className="absolute inset-0 pointer-events-none scale-[1.3] z-0">\r\n                  {(THEME_DECORATIONS[theme] || THEME_DECORATIONS.default).elements}\r\n                </div>\r\n              )}\r\n              {userProfile?.is_premium && profileEffects?.avatar !== 'none' && (\r\n                <AvatarDecoration type={profileEffects?.avatar} />\r\n              )}\r\n              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center border-[3px] relative z-10"`
);

// 6. Remove the frosted glass box around text, make text direct on background
c = c.replace(
  `<div className="flex-1 min-w-0 bg-white/60 backdrop-blur-sm p-3 rounded-2xl shadow-sm">`,
  `<div className="flex-1 min-w-0">`
);

// 7. Add text shadow to name and username for readability over wallpaper
c = c.replace(
  `<h2 className="text-base font-black flex items-center gap-1.5 truncate" style={{color:'var(--theme-header)'}}>`,
  `<h2 className="text-base font-black flex items-center gap-1.5" style={{color:'var(--theme-header)', textShadow:'0 1px 4px rgba(255,255,255,0.7)'}}>` 
);
c = c.replace(
  `<p className="text-sm font-bold mt-0.5" style={{color:'var(--theme-primary)'}}>@{userProfile?.username || 'username'}</p>`,
  `<p className="text-sm font-bold mt-0.5" style={{color:'var(--theme-primary)', textShadow:'0 1px 3px rgba(255,255,255,0.5)'}}>@{userProfile?.username || 'username'}</p>`
);

// 8. Fix bio: remove frosted glass, add px padding
c = c.replace(
  `<div className="relative z-10 mt-3 bg-white/50 backdrop-blur-sm p-2 rounded-xl">`,
  `<div className="relative z-10 mt-2 px-4">`
);

// 9. Add padding to buttons container so they sit at the bottom of the card
c = c.replace(
  `<div className="flex gap-2 mt-4 relative z-10">`,
  `<div className="flex gap-2 mt-4 relative z-10 px-4 pb-4">`
);

fs.writeFileSync('src/screens/Profile.jsx', c);
console.log('Done! Checking for key patterns...');
console.log('Has THEME_DECORATIONS import:', c.includes('THEME_DECORATIONS'));
console.log('Has wallpaper style:', c.includes('customWallpaperUrl'));
console.log('Has emoji decorations:', c.includes('(THEME_DECORATIONS[theme]'));
