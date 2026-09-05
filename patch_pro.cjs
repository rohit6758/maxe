const fs = require('fs');

let c = fs.readFileSync('src/components/ProSettingsModal.jsx', 'utf8');

if (!c.includes("import { supabase }")) {
  c = c.replace(
    "import { useAppContext } from '../context/AppContext';",
    "import { useAppContext } from '../context/AppContext';\nimport { supabase } from '../lib/supabase';"
  );
}

if (!c.includes("const [uploading,")) {
  c = c.replace(
    "const [view, setView] = useState('main');",
    "const [view, setView] = useState('main');\n  const [uploading, setUploading] = useState(false);"
  );
}

const NEW_WALLPAPER = `          {/* WALLPAPER */}
          {view === 'wallpaper' && (
            <div className="space-y-4">
              <p className="text-xs" style={{color:'var(--theme-body)'}}>Choose a background pattern or upload your own from gallery.</p>
              
              {/* Custom Upload Button */}
              <label className="w-full relative h-20 rounded-2xl overflow-hidden transition-all flex flex-col items-center justify-center cursor-pointer"
                style={{
                  background: profileEffects.wallpaper === 'custom' && profileEffects.customWallpaperUrl ? \`url(\${profileEffects.customWallpaperUrl})\` : 'var(--theme-sidebar)',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  boxShadow: profileEffects.wallpaper === 'custom' ? \`0 0 0 3px var(--theme-primary)\` : '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative z-10 flex flex-col items-center gap-1">
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Image size={24} color="#fff" />
                  )}
                  <span className="text-xs font-bold text-white shadow-md">
                    {profileEffects.wallpaper === 'custom' && profileEffects.customWallpaperUrl ? 'Change Custom Wallpaper' : 'Upload from Gallery'}
                  </span>
                </div>
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const ext = file.name.split('.').pop();
                    const path = \`banners/\${session.user.id}-\${Date.now()}.\${ext}\`;
                    const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true, contentType: file.type });
                    if (error) throw error;
                    const { data } = supabase.storage.from('uploads').getPublicUrl(path);
                    setProfileEffects({ ...profileEffects, wallpaper: 'custom', customWallpaperUrl: data.publicUrl });
                  } catch (err) {
                    console.error(err);
                    alert('Failed to upload wallpaper');
                  }
                  setUploading(false);
                }} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {id:'none', label:'None', preview:'var(--theme-surface)'},
                  {id:'dots', label:'Dots', preview:\`radial-gradient(circle, var(--theme-ring) 1px, transparent 1px)\`, size:'20px 20px'},
                  {id:'grid', label:'Grid', preview:\`linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, transparent 1px)\`, size:'20px 20px'},
                  {id:'waves', label:'Waves', preview:\`repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, transparent 1px, transparent 8px)\`},
                ].map(w=>(
                  <button key={w.id}
                    onClick={()=>setProfileEffects({...profileEffects, wallpaper:w.id})}
                    className="relative h-20 rounded-2xl overflow-hidden transition-all"
                    style={{background: w.preview, backgroundSize: w.size || 'auto',
                      boxShadow: (profileEffects.wallpaper||'none')===w.id ? \`0 0 0 3px var(--theme-primary)\` : '0 2px 8px rgba(0,0,0,0.1)'}}>
                    <div className="absolute inset-0 flex items-end p-2">
                      <span className="text-xs font-bold" style={{color:'var(--theme-header)', textShadow:'0 1px 3px rgba(255,255,255,0.8)'}}>{w.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}`;

const idx = c.indexOf('          {/* WALLPAPER */}');
const end = c.indexOf('          </div>\n        </div>\n      </div>');

if (idx > -1 && end > -1) {
  c = c.substring(0, idx) + NEW_WALLPAPER + '\n\n' + c.substring(end);
  fs.writeFileSync('src/components/ProSettingsModal.jsx', c);
  console.log('patched ProSettingsModal.jsx');
} else {
  console.log('could not find wallpaper section');
}
