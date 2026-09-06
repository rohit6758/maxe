const fs = require('fs');

// 1. Patch UserProfilePopup.jsx
let p1 = fs.readFileSync('src/components/UserProfilePopup.jsx', 'utf8');
p1 = p1.replace(/<div className="relative w-full max-w-sm card overflow-hidden shadow-2xl animate-slide-up" onClick=\{e => e\.stopPropagation\(\)\} style=\{\{[\s\S]*?\} : \{\}\)\n\s*\}\}>\n\s*\{\/\* Header \*\/\}/m, 
`<div className="relative w-full max-w-sm card overflow-hidden shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        
        {profile?.is_premium && eff?.wallpaper && eff.wallpaper !== 'none' && (
          <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none" style={{
            background: eff.wallpaper === 'custom' && eff.customWallpaperUrl ? \`url('\${eff.customWallpaperUrl}')\` : 
                        eff.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                        eff.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                        eff.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : 'var(--theme-surface)',
            backgroundSize: eff.wallpaper === 'custom' ? 'cover' : eff.wallpaper === 'waves' ? 'auto' : '20px 20px',
            backgroundPosition: 'center',
            borderBottom: '1px solid color-mix(in srgb, var(--theme-ring) 30%, transparent)'
          }} />
        )}

        {/* Header */}`);
fs.writeFileSync('src/components/UserProfilePopup.jsx', p1);

// 2. Patch Profile.jsx
let p2 = fs.readFileSync('src/screens/Profile.jsx', 'utf8');
p2 = p2.replace(/<div className="card p-4 relative overflow-hidden" style=\{\{[\s\S]*?\} : \{\}\)\n\s*\}\}>/, 
`<div className="card p-4 relative overflow-hidden">
            {userProfile?.is_premium && profileEffects?.wallpaper && profileEffects.wallpaper !== 'none' && (
              <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none" style={{
                background: profileEffects.wallpaper === 'custom' && profileEffects.customWallpaperUrl ? \`url('\${profileEffects.customWallpaperUrl}')\` : 
                            profileEffects.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                            profileEffects.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                            profileEffects.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : 'var(--theme-surface)',
                backgroundSize: profileEffects.wallpaper === 'custom' ? 'cover' : profileEffects.wallpaper === 'waves' ? 'auto' : '20px 20px',
                backgroundPosition: 'center',
                borderBottom: '1px solid color-mix(in srgb, var(--theme-ring) 30%, transparent)'
              }} />
            )}`);
fs.writeFileSync('src/screens/Profile.jsx', p2);
console.log('patched banners successfully');
