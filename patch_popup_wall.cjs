const fs = require('fs');

let c = fs.readFileSync('src/components/UserProfilePopup.jsx', 'utf8');

const regex = /background: eff\.wallpaper === 'dots' \? 'radial-gradient[^]*?var\(--theme-surface\)',/;
const newBackground = `background: eff.wallpaper === 'custom' && eff.customWallpaperUrl ? \`url(\${eff.customWallpaperUrl})\` : 
                        eff.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                        eff.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                        eff.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : 'var(--theme-surface)',`;

const sizeRegex = /backgroundSize: eff\.wallpaper === 'waves' \? 'auto' : '20px 20px'/;
const newSize = `backgroundSize: eff.wallpaper === 'custom' ? 'cover' : eff.wallpaper === 'waves' ? 'auto' : '20px 20px', backgroundPosition: 'center'`;

if (regex.test(c)) {
  c = c.replace(regex, newBackground);
  c = c.replace(sizeRegex, newSize);
  fs.writeFileSync('src/components/UserProfilePopup.jsx', c);
  console.log('patched UserProfilePopup.jsx wallpaper');
} else {
  console.log('could not patch UserProfilePopup.jsx wallpaper');
}
