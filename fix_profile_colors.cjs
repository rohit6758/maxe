const fs = require('fs');
let c = fs.readFileSync('src/screens/Profile.jsx', 'utf8');

// Fix Edit Profile button which still has hardcoded EAF4EF etc
c = c.replace(/style=\{\{background: 'var\(--theme-bg\)', color: 'var\(--theme-header\)', border: '1px solid color-mix\(in srgb, var\(--theme-primary\) 20%, transparent\)'\}\}/g, 
  `style={{background: 'color-mix(in srgb, var(--theme-sidebar) 80%, white)', color: 'var(--theme-header)', border: '1px solid color-mix(in srgb, var(--theme-ring) 60%, transparent)'}}`);

// Replace any remaining style={{color:'#DC6B6B'}} (cancel button) — just leave it as it's red
// Replace any bg colors from older inline styles
c = c.replace(/'#EAF4EF'/g, "'color-mix(in srgb, var(--theme-sidebar) 80%, white)'");
c = c.replace(/'rgba\(107,168,152,0.2\)'/g, "'color-mix(in srgb, var(--theme-ring) 60%, transparent)'");

// Theme swatch preview colors — update to match new theme colors  
c = c.replace(/bg-\[#E8F2EE\]/g, 'bg-[#F0F7F0]');
c = c.replace(/border-primary/g, 'border-primary');  // keep as is

fs.writeFileSync('src/screens/Profile.jsx', c);
console.log('Done');
