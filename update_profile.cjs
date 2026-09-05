const fs = require('fs');
let c = fs.readFileSync('src/screens/Profile.jsx', 'utf8');
c = c.replace(/const \{ session, userProfile, setUserProfile, theme, setTheme \} = useAppContext\(\);/, 'const { session, userProfile, setUserProfile, theme, setTheme, profileEffects, setProfileEffects } = useAppContext();');

const effectHTML = `
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
`;

c = c.replace(/<div className="flex items-center justify-between">[\s\S]*?<div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"><\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<div className="h-px w-full bg-primary\/10"><\/div>[\s\S]*?<div className="flex items-center justify-between">[\s\S]*?<div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"><\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/, effectHTML);

fs.writeFileSync('src/screens/Profile.jsx', c);
