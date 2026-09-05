const fs = require('fs');

let c = fs.readFileSync('src/screens/Profile.jsx', 'utf8');

const regex = /background: profileEffects\.wallpaper === 'dots' \? 'radial-gradient[^]*?var\(--theme-surface\)',/;
const newBackground = `background: profileEffects.wallpaper === 'custom' && profileEffects.customWallpaperUrl ? \`url(\${profileEffects.customWallpaperUrl})\` : 
                        profileEffects.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                        profileEffects.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                        profileEffects.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : 'var(--theme-surface)',`;

const sizeRegex = /backgroundSize: profileEffects\.wallpaper === 'waves' \? 'auto' : '20px 20px'/;
const newSize = `backgroundSize: profileEffects.wallpaper === 'custom' ? 'cover' : profileEffects.wallpaper === 'waves' ? 'auto' : '20px 20px', backgroundPosition: 'center'`;

if (regex.test(c)) {
  c = c.replace(regex, newBackground);
  c = c.replace(sizeRegex, newSize);
  fs.writeFileSync('src/screens/Profile.jsx', c);
  console.log('patched Profile.jsx wallpaper');
} else {
  console.log('could not patch Profile.jsx wallpaper');
}
