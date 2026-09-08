import { toast } from '../context/ToastContext';
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { X, ChevronRight, Sparkles, Palette, Image, Crown, Waves, CarFront, Gem, Rocket, CircleDot } from 'lucide-react';

// Theme-specific decorations that orbit the profile avatar
const THEME_DECORATIONS = {
  default: {
    name: 'Dinosaurs',
    bg: 'linear-gradient(135deg, #D3EDE0 0%, #A8D5B2 100%)',
    elements: (
      <>
        {/* T-Rex */}
        <div className="absolute -top-4 -left-2 animate-bounce" style={{animationDuration:'3s', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'}}>
          <span style={{fontSize: '24px'}}>🦖</span>
        </div>
        {/* Sauropod */}
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 animate-pulse" style={{animationDuration:'4s', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'}}>
          <span style={{fontSize: '22px'}}>🦕</span>
        </div>
        {/* Volcanos / Leaves */}
        <div className="absolute -bottom-3 left-1/4 animate-ping" style={{animationDuration:'3s'}}>
          <span style={{fontSize: '14px'}}>🌋</span>
        </div>
      </>
    )
  },

  eastbay: {
    name: 'Stars',
    bg: 'linear-gradient(135deg, #1C1E50 0%, #35395A 50%, #1C1E50 100%)',
    elements: (
      <>
        {/* Big Star */}
        <div className="absolute -top-5 right-0 animate-spin" style={{animationDuration:'8s', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'}}>
          <span style={{fontSize: '24px'}}>⭐</span>
        </div>
        {/* Sparkles */}
        <div className="absolute top-1/2 -left-4 -translate-y-1/2 animate-pulse" style={{animationDuration:'2s'}}>
          <span style={{fontSize: '20px'}}>✨</span>
        </div>
        {/* Shooting star */}
        <div className="absolute -bottom-4 right-1/4 animate-bounce" style={{animationDuration:'4s'}}>
          <span style={{fontSize: '18px'}}>🌠</span>
        </div>
      </>
    )
  },

  dolphin: {
    name: 'Ocean',
    bg: 'linear-gradient(135deg, #4A425B 0%, #6D4C9A 100%)',
    elements: (
      <>
        {/* Dolphin */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" style={{animationDuration:'3s'}}>
          <span style={{fontSize: '24px'}}>🐬</span>
        </div>
        {/* Shell */}
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 animate-pulse" style={{animationDuration:'4s'}}>
          <span style={{fontSize: '20px'}}>🐚</span>
        </div>
        {/* Wave */}
        <div className="absolute -bottom-2 left-1/4 animate-ping" style={{animationDuration:'2s'}}>
          <span style={{fontSize: '16px'}}>🌊</span>
        </div>
      </>
    )
  },

  venice: {
    name: 'Space',
    bg: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    elements: (
      <>
        <div className="absolute -top-6 -right-2 animate-spin" style={{animationDuration:'4s', transformOrigin:'-20px 50px'}}>
          <span style={{fontSize: '22px', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))'}}>🚀</span>
        </div>
        <div className="absolute top-1/3 -left-5 animate-pulse" style={{animationDuration:'3s'}}>
          <span style={{fontSize: '22px', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))'}}>🪐</span>
        </div>
        <div className="absolute -bottom-4 right-1/4 animate-bounce" style={{animationDuration:'2.5s'}}>
          <span style={{fontSize: '20px', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))'}}>🛸</span>
        </div>
      </>
    )
  },

  lagoon: {
    name: 'Cars',
    bg: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
    elements: (
      <>
        {/* Sports Car */}
        <div className="absolute -top-3 -right-4 animate-bounce" style={{animationDuration:'2s'}}>
          <span style={{fontSize: '24px'}}>🏎️</span>
        </div>
        {/* Police Car */}
        <div className="absolute top-1/2 -left-5 -translate-y-1/2 animate-pulse" style={{animationDuration:'1.5s'}}>
          <span style={{fontSize: '22px'}}>🚓</span>
        </div>
        {/* Finish Flag */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 animate-spin" style={{animationDuration:'6s'}}>
          <span style={{fontSize: '20px'}}>🏁</span>
        </div>
      </>
    )
  },

  berry: {
    name: 'Princess',
    bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    elements: (
      <>
        {/* Crown */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce" style={{animationDuration:'2.5s'}}>
          <span style={{fontSize: '26px', filter: 'drop-shadow(0 2px 4px rgba(255,105,180,0.4))'}}>👑</span>
        </div>
        {/* Magic Wand */}
        <div className="absolute top-1/3 -right-5 animate-spin" style={{animationDuration:'5s'}}>
          <span style={{fontSize: '22px'}}>🪄</span>
        </div>
        {/* Gem */}
        <div className="absolute -bottom-3 left-1/4 animate-pulse" style={{animationDuration:'2s'}}>
          <span style={{fontSize: '18px'}}>💎</span>
        </div>
      </>
    )
  }
};

// Keep premium motion graphic and icon based so it stays crisp at any size.
const PREMIUM_GLYPHS = { default: Sparkles, eastbay: CircleDot, dolphin: Waves, venice: Rocket, lagoon: CarFront, berry: Crown };
Object.entries(THEME_DECORATIONS).forEach(([id, decoration]) => {
  const Glyph = PREMIUM_GLYPHS[id] || Gem;
  decoration.elements = (
    <>
      <div className="absolute -top-4 -right-2 animate-float-3d" style={{ color: 'rgba(255,255,255,0.95)', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }}>
        <Glyph size={24} strokeWidth={1.75} />
      </div>
      <div className="absolute top-1/2 -left-4 -translate-y-1/2 h-4 w-4 rounded-full bg-white/80 shadow-[0_0_14px_rgba(255,255,255,0.9)] animate-pulse" />
      <div className="absolute -bottom-3 right-1/4 h-3 w-3 rounded-full bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-float-3d" style={{ animationDelay: '0.8s' }} />
    </>
  );
});

export default function ProSettingsModal({ isOpen, onClose }) {
  const { theme, setTheme, profileEffects, setProfileEffects } = useAppContext();
  const [view, setView] = useState('main');
  const [uploading, setUploading] = useState(false); // 'main' | 'theme' | 'effects' | 'wallpaper'

  if (!isOpen) return null;

  const themes = [
    { id:'default', label:'Mint Forest',   bg:'#D3EDE0', primary:'#1B7A52' },
    { id:'eastbay', label:'East Bay',       bg:'#E5E2CC', primary:'#393EA0' },
    { id:'dolphin', label:'Dolphin',        bg:'#EDD9C9', primary:'#7A3A9A' },
    { id:'venice',  label:'Venice Space',   bg:'#CCDFEE', primary:'#0C5E8A' },
    { id:'lagoon',  label:'Lagoon',         bg:'#FAC8CC', primary:'#007080' },
    { id:'berry',   label:'Berry Blossom',  bg:'#F3BEE2', primary:'#8A1868' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex md:items-center md:justify-center p-0 md:p-4"
      style={{background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)'}} onClick={onClose}>
      <div className="relative w-full md:max-w-sm md:rounded-2xl overflow-hidden flex flex-col animate-slide-up"
        style={{background:'var(--theme-surface)', maxHeight:'92vh', marginTop:'auto'}}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{borderColor:'color-mix(in srgb, var(--theme-ring) 50%, transparent)'}}>
          {view !== 'main' ? (
            <button onClick={()=>setView('main')} className="text-xs font-bold flex items-center gap-1"
              style={{color:'var(--theme-primary)'}}>
              ← Back
            </button>
          ) : <div />}
          <h2 className="text-base font-black" style={{color:'var(--theme-header)'}}>
            {view === 'main' && 'Maxe Pro'}
            {view === 'theme' && 'App Theme'}
            {view === 'anime' && 'Anime Worlds'}
            {view === 'wallpaper' && 'Wallpaper'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{background:'color-mix(in srgb, var(--theme-ring) 30%, transparent)', color:'var(--theme-body)'}}>
            <X size={16}/>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">

          {/* MAIN MENU */}
          {view === 'main' && (
            <div className="space-y-3">
              {/* Clean theme preview without profile decorations */}
              <div className="relative w-full h-32 rounded-2xl overflow-hidden flex items-center justify-center mb-5"
                style={{background:'color-mix(in srgb, var(--theme-primary) 22%, var(--theme-surface))'}}>
                <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white shadow-xl"
                  style={{borderWidth:3, borderColor:'rgba(255,255,255,0.8)', background:'color-mix(in srgb, var(--theme-primary) 30%, white)'}}/>
                <span className="absolute bottom-2 right-3 text-[10px] font-bold text-white/70">
                  {themes.find(t=>t.id===theme)?.label || 'Mint Forest'} theme
                </span>
              </div>

              {/* Menu items */}
              {[
                { icon:<Palette size={18}/>, label:'App Theme', sub:`Active: ${themes.find(t=>t.id===theme)?.label || 'Mint'}`, view:'theme', color:'var(--theme-primary)' },
                { icon:<Sparkles size={18}/>, label:'Anime Worlds', sub:'Original anime-inspired UI palettes', view:'anime', color:'#F97316' },
                { icon:<Image size={18}/>, label:'Wallpaper', sub:'Background for your profile', view:'wallpaper', color:'#E11D48' },
                { icon:<Sparkles size={18}/>, label:'Verified Badge', sub:'Shows next to your name everywhere', view:null, color:'#7B3FA0', badge:'Active' },
              ].map((item,i) => (
                <button key={i} onClick={()=>item.view && setView(item.view)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all"
                  style={{background:'color-mix(in srgb, var(--theme-sidebar) 60%, white)', border:`1px solid color-mix(in srgb, var(--theme-ring) 40%, transparent)`}}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{background:`color-mix(in srgb, ${item.color} 12%, transparent)`, color:item.color}}>
                    {item.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold" style={{color:'var(--theme-header)'}}>{item.label}</p>
                    <p className="text-[11px]" style={{color:'var(--theme-body)'}}>{item.sub}</p>
                  </div>
                  {item.badge ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{background:`color-mix(in srgb, ${item.color} 12%, transparent)`, color:item.color}}>{item.badge}</span>
                  ) : item.view ? (
                    <ChevronRight size={16} style={{color:'var(--theme-body)'}}/>
                  ) : null}
                </button>
              ))}
            </div>
          )}

          {/* THEME PICKER */}
          {view === 'theme' && (
            <div className="space-y-4">
              <p className="text-xs" style={{color:'var(--theme-body)'}}>Pick a color palette. The entire app — sidebar, backgrounds, buttons — will change.</p>
              <div className="grid grid-cols-2 gap-3">
                {themes.map(t => (
                  <button key={t.id} onClick={()=>setTheme(t.id)}
                    className="relative rounded-2xl overflow-hidden flex flex-col transition-all"
                    style={{boxShadow: theme===t.id ? `0 0 0 3px ${t.primary}` : '0 2px 8px rgba(0,0,0,0.12)', transform:theme===t.id?'scale(1.03)':'scale(1)'}}>
                    {/* Color preview strip */}
                    <div className="flex h-16">
                      <div className="w-1/2 h-full" style={{background:t.bg}}/>
                      <div className="w-1/2 h-full" style={{background:t.primary}}/>
                    </div>
                    <div className="px-3 py-2" style={{background:'var(--theme-surface)'}}>
                      <p className="text-xs font-bold" style={{color:'var(--theme-header)'}}>{t.label}</p>
                      {theme===t.id && <p className="text-[10px] font-bold" style={{color:t.primary}}>✓ Active</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ANIME-INSPIRED WORLDS */}
          {view === 'anime' && (
            <div className="space-y-4">
              <p className="text-xs" style={{color:'var(--theme-body)'}}>
                Choose an original anime-inspired world. The app changes palette, surfaces, and motion texture; character artwork is not bundled.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id:'pirate-voyage', label:'Pirate Voyage', hint:'Ocean + treasure', bg:'#C6E6EA', primary:'#0B7285', accent:'#F4A261' },
                  { id:'shinobi-night', label:'Shinobi Night', hint:'Indigo + neon', bg:'#D9D1EA', primary:'#5B21B6', accent:'#EC4899' },
                  { id:'demon-moon', label:'Demon Moon', hint:'Crimson + emerald', bg:'#E8CACA', primary:'#9F1239', accent:'#15803D' },
                  { id:'saiyan-burst', label:'Saiyan Burst', hint:'Gold + energy blue', bg:'#FFE7A3', primary:'#D97706', accent:'#2563EB' },
                  { id:'striker-arena', label:'Striker Arena', hint:'Blue + cyan', bg:'#C8D9F5', primary:'#1D4ED8', accent:'#06B6D4' },
                ].map(world => (
                  <button key={world.id} onClick={() => setTheme(world.id)}
                    className="relative overflow-hidden rounded-2xl text-left transition-transform hover:scale-[1.02]"
                    style={{background:world.bg, boxShadow:theme===world.id ? `0 0 0 3px ${world.primary}` : '0 2px 8px rgba(0,0,0,.12)'}}>
                    <div className="h-16 p-3" style={{background:`linear-gradient(135deg, ${world.primary}, ${world.accent})`}}>
                      <div className="h-2 w-16 rounded-full bg-white/80 mb-2" />
                      <div className="h-2 w-10 rounded-full bg-white/45" />
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-xs font-black" style={{color:world.primary}}>{world.label}</p>
                      <p className="text-[10px]" style={{color:world.primary}}>{world.hint}</p>
                      {theme===world.id && <p className="text-[10px] font-bold mt-1" style={{color:world.primary}}>Active</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* WALLPAPER */}
          {view === 'wallpaper' && (
            <div className="space-y-4">
              <p className="text-xs" style={{color:'var(--theme-body)'}}>Choose a background pattern or upload your own from gallery.</p>
              
              {/* Custom Upload Button */}
              <label className="w-full relative h-20 rounded-2xl overflow-hidden transition-all flex flex-col items-center justify-center cursor-pointer"
                style={{
                  background: profileEffects.wallpaper === 'custom' && profileEffects.customWallpaperUrl ? `url('${profileEffects.customWallpaperUrl}')` : 'var(--theme-sidebar)',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  boxShadow: profileEffects.wallpaper === 'custom' ? `0 0 0 3px var(--theme-primary)` : '0 2px 8px rgba(0,0,0,0.1)'
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
                    const path = `banners/${session.user.id}-${Date.now()}.${ext}`;
                    const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true, contentType: file.type });
                    if (error) throw error;
                    const { data } = supabase.storage.from('uploads').getPublicUrl(path);
                    const newEffects = { ...profileEffects, wallpaper: 'custom', customWallpaperUrl: data.publicUrl };
                    setProfileEffects(newEffects);
                    // Direct DB save with this session so other users can see it
                    const payload = JSON.stringify({ theme, profileEffects: newEffects });
                    await supabase.from('profiles').update({ interests: payload }).eq('id', session.user.id);
                  } catch (err) {
                    console.error(err);
                    toast('Failed to upload wallpaper');
                  }
                  setUploading(false);
                }} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {id:'none', label:'None', preview:'var(--theme-surface)'},
                  {id:'dots', label:'Dots', preview:`radial-gradient(circle, var(--theme-ring) 1px, transparent 1px)`, size:'20px 20px'},
                  {id:'grid', label:'Grid', preview:`linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, transparent 1px)`, size:'20px 20px'},
                  {id:'waves', label:'Waves', preview:`repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, transparent 1px, transparent 8px)`},
                ].map(w=>(
                  <button key={w.id}
                    onClick={async ()=>{
                      const newEffects = {...profileEffects, wallpaper:w.id};
                      setProfileEffects(newEffects);
                      // Direct DB save
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session?.user?.id) {
                          const payload = JSON.stringify({ theme, profileEffects: newEffects });
                          await supabase.from('profiles').update({ interests: payload }).eq('id', session.user.id);
                        }
                      } catch(err) { console.error('wallpaper save error', err); }
                    }}
                    className="relative h-20 rounded-2xl overflow-hidden transition-all"
                    style={{background: w.preview, backgroundSize: w.size || 'auto',
                      boxShadow: (profileEffects.wallpaper||'none')===w.id ? `0 0 0 3px var(--theme-primary)` : '0 2px 8px rgba(0,0,0,0.1)'}}>
                    <div className="absolute inset-0 flex items-end p-2">
                      <span className="text-xs font-bold" style={{color:'var(--theme-header)', textShadow:'0 1px 3px rgba(255,255,255,0.8)'}}>{w.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export { THEME_DECORATIONS };
