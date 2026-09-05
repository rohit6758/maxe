import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { X, ChevronRight, Sparkles, Palette, Wand2, Image } from 'lucide-react';

// Theme-specific decorations that orbit the profile avatar
const THEME_DECORATIONS = {
  default: {
    name: 'Nature',
    bg: 'linear-gradient(135deg, #D3EDE0 0%, #A8D5B2 100%)',
    elements: (
      <>
        {/* Leaf top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce" style={{animationDuration:'3s'}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1B7A52"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 3-9 4z"/></svg>
        </div>
        {/* Butterfly right */}
        <div className="absolute top-1/2 -right-3 -translate-y-1/2 animate-pulse">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#4DAB82"><path d="M21.06 3.83C20.64 3.41 20.07 3.17 19.5 3.17c-.95 0-1.78.55-2.17 1.34l-1.91 3.82C13.97 6.58 12.74 6 11.5 6c-1.24 0-2.47.58-3.92 2.33L5.67 4.51C5.28 3.72 4.45 3.17 3.5 3.17c-.57 0-1.14.24-1.56.66C1.36 4.41 1.17 5.18 1.5 5.85l3.68 7.37A5.26 5.26 0 0 0 0 17c0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.13-.38-2.18-1.01-3.01L11.5 8.31l2.51 5.68A5.01 5.01 0 0 0 13 17c0 2.76 2.24 5 5 5s5-2.24 5-5a5.26 5.26 0 0 0-5.18-4.78l3.68-7.37c.33-.67.14-1.44-.44-2.02z"/></svg>
        </div>
        {/* Flower bottom */}
        <div className="absolute -bottom-2 left-1/4 animate-pulse" style={{animationDuration:'4s'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#94D4B6"><circle cx="12" cy="12" r="4"/><path d="M12 2a2 2 0 0 0-2 2v2a2 2 0 0 0 4 0V4a2 2 0 0 0-2-2zm0 16a2 2 0 0 0-2 2v0a2 2 0 0 0 4 0v0a2 2 0 0 0-2-2zm10-6h-2a2 2 0 0 0 0 4h2a2 2 0 0 0 0-4zm-16 0H4a2 2 0 0 0 0 4h2a2 2 0 0 0 0-4z"/></svg>
        </div>
      </>
    )
  },

  eastbay: {
    name: 'Constellation',
    bg: 'linear-gradient(135deg, #1C1E50 0%, #35395A 50%, #1C1E50 100%)',
    elements: (
      <>
        {/* Stars */}
        {[[-10,-10,'#fff',1.2],[-5,30,'#A4A7E0',0.8],[28,5,'#fff',1],[20,28,'#A4A7E0',0.7],[-12,20,'#fff',0.9]].map(([x,y,c,s],i)=>(
          <div key={i} className="absolute animate-ping" style={{top:`${y}%`,left:`${x+100}%`,transform:'translate(-50%,-50%)',animationDuration:`${2+i*0.5}s`,animationDelay:`${i*0.3}s`}}>
            <svg width={8*s} height={8*s} viewBox="0 0 24 24" fill={c}><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"/></svg>
          </div>
        ))}
        {/* Moon */}
        <div className="absolute -top-4 right-0 animate-pulse" style={{animationDuration:'4s'}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#656C9A"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </div>
      </>
    )
  },

  dolphin: {
    name: 'Ocean',
    bg: 'linear-gradient(135deg, #4A425B 0%, #6D4C9A 100%)',
    elements: (
      <>
        {/* Bubbles */}
        {[[10,-12,8],[28,10,5],[-8,20,6],[20,28,4],[-5,5,7]].map(([x,y,r],i)=>(
          <div key={i} className="absolute rounded-full border-2 animate-ping"
            style={{top:`${y+50}%`,left:`${x+50}%`,width:r*2,height:r*2,borderColor:'rgba(200,160,224,0.6)',animationDuration:`${2+i*0.7}s`,animationDelay:`${i*0.4}s`}}>
          </div>
        ))}
        {/* Dolphin */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce" style={{animationDuration:'2s'}}>
          <svg width="28" height="16" viewBox="0 0 100 50" fill="#9B78C8">
            <path d="M10,30 Q30,5 60,25 Q80,40 90,20 Q95,15 100,10 Q90,35 70,40 Q50,45 30,40 Q15,38 10,30Z"/>
            <path d="M70,40 Q75,30 80,20 Q70,25 65,35Z" fill="#AB92BF"/>
          </svg>
        </div>
      </>
    )
  },

  venice: {
    name: 'Space 🚀',
    bg: 'linear-gradient(135deg, #052D44 0%, #082B45 50%, #0C3D60 100%)',
    elements: (
      <>
        {/* Stars twinkling */}
        {[[-12,-15,'6px'],[-8,30,'4px'],[32,0,'5px'],[25,32,'4px'],[-5,-5,'3px'],[30,18,'4px']].map(([x,y,s],i)=>(
          <div key={i} className="absolute rounded-full bg-white animate-pulse"
            style={{top:`${y+50}%`,left:`${x+50}%`,width:s,height:s,animationDuration:`${1.5+i*0.4}s`,animationDelay:`${i*0.25}s`}}>
          </div>
        ))}
        {/* Rocket orbiting */}
        <div className="absolute animate-spin" style={{top:'-14px',left:'50%',transform:'translateX(-50%)',animationDuration:'8s'}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#3A8CB4">
            <path d="M12 2C12 2 7 6 7 13H17C17 6 12 2 12 2Z"/>
            <rect x="10" y="13" width="4" height="4" fill="#0C5E8A"/>
            <path d="M7 13L5 17L8 16Z" fill="#E74C3C"/>
            <path d="M17 13L19 17L16 16Z" fill="#E74C3C"/>
            <circle cx="12" cy="9" r="2" fill="#FFFFFF" opacity="0.8"/>
          </svg>
        </div>
        {/* Saturn planet */}
        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 animate-pulse" style={{animationDuration:'3s'}}>
          <svg width="28" height="18" viewBox="0 0 60 40">
            <circle cx="30" cy="20" r="12" fill="#84B3CE"/>
            <ellipse cx="30" cy="20" rx="28" ry="6" fill="none" stroke="#3A8CB4" strokeWidth="2.5" opacity="0.8"/>
          </svg>
        </div>
        {/* Small UFO */}
        <div className="absolute top-1/2 -left-4 -translate-y-1/2 animate-bounce" style={{animationDuration:'3.5s'}}>
          <svg width="20" height="14" viewBox="0 0 50 30">
            <ellipse cx="25" cy="18" rx="20" ry="8" fill="#1E6999"/>
            <ellipse cx="25" cy="14" rx="12" ry="8" fill="#3A8CB4"/>
            <ellipse cx="25" cy="13" rx="8" ry="5" fill="#84B3CE" opacity="0.6"/>
          </svg>
        </div>
      </>
    )
  },

  lagoon: {
    name: 'Waves',
    bg: 'linear-gradient(180deg, #003840 0%, #007080 60%, #FDDFE2 100%)',
    elements: (
      <>
        {/* Wave lines */}
        <div className="absolute bottom-0 left-0 right-0 animate-pulse" style={{animationDuration:'2s'}}>
          <svg viewBox="0 0 60 12" width="100%" height="12">
            <path d="M0,6 Q15,0 30,6 Q45,12 60,6" fill="none" stroke="#8ED0D8" strokeWidth="2"/>
          </svg>
        </div>
        {/* Fish */}
        <div className="absolute top-1/4 -right-5 animate-pulse" style={{animationDuration:'2.5s'}}>
          <svg width="22" height="14" viewBox="0 0 60 40">
            <ellipse cx="32" cy="20" rx="22" ry="12" fill="#007080"/>
            <path d="M10,20 L0,10 L0,30Z" fill="#00A6B5"/>
            <circle cx="42" cy="16" r="3" fill="#FFFFFF"/>
          </svg>
        </div>
        {/* Coral */}
        <div className="absolute -bottom-3 left-1/4 animate-bounce" style={{animationDuration:'3s'}}>
          <svg width="18" height="22" viewBox="0 0 30 40">
            <path d="M15,40 L15,20 M15,20 Q10,10 8,5 M15,20 Q20,10 22,5 M15,28 Q7,22 4,20 M15,28 Q23,22 26,20" stroke="#E8504A" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
      </>
    )
  },

  berry: {
    name: 'Blossoms',
    bg: 'linear-gradient(135deg, #420030 0%, #8A1868 100%)',
    elements: (
      <>
        {/* Petals */}
        {[[-12,-8,0],[25,-12,60],[-10,28,-30],[28,20,90],[-5,10,45]].map(([x,y,r],i)=>(
          <div key={i} className="absolute animate-ping"
            style={{top:`${y+50}%`,left:`${x+50}%`,animationDuration:`${2+i*0.5}s`,animationDelay:`${i*0.3}s`,transform:`rotate(${r}deg)`}}>
            <svg width="12" height="16" viewBox="0 0 20 30" fill="#C958A6">
              <ellipse cx="10" cy="15" rx="8" ry="13"/>
            </svg>
          </div>
        ))}
        {/* Cherry blossom */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" style={{animationDuration:'4s'}}>
          <svg width="26" height="26" viewBox="0 0 50 50">
            {[0,72,144,216,288].map((angle,i)=>(
              <ellipse key={i} cx={25+14*Math.cos(angle*Math.PI/180)} cy={25+14*Math.sin(angle*Math.PI/180)} rx="7" ry="10"
                fill="#E884C4" transform={`rotate(${angle},${25+14*Math.cos(angle*Math.PI/180)},${25+14*Math.sin(angle*Math.PI/180)})`}/>
            ))}
            <circle cx="25" cy="25" r="5" fill="#FFD5EA"/>
          </svg>
        </div>
      </>
    )
  }
};

export default function ProSettingsModal({ isOpen, onClose }) {
  const { theme, setTheme, profileEffects, setProfileEffects } = useAppContext();
  const [view, setView] = useState('main');
  const [uploading, setUploading] = useState(false); // 'main' | 'theme' | 'effects' | 'wallpaper'
  const dec = THEME_DECORATIONS[theme] || THEME_DECORATIONS.default;

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
            {view === 'main' && '✨ Maxe Pro'}
            {view === 'theme' && '🎨 App Theme'}
            {view === 'effects' && '🌟 Profile Effects'}
            {view === 'wallpaper' && '🖼 Wallpaper'}
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
              {/* Live theme preview with decorations */}
              <div className="relative w-full h-32 rounded-2xl overflow-hidden flex items-center justify-center mb-5"
                style={{background: dec.bg}}>
                <div className="relative w-16 h-16">
                  {dec.elements}
                  <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white shadow-xl z-10 relative"
                    style={{borderWidth:3, borderColor:'rgba(255,255,255,0.8)'}}>
                    <div className="w-full h-full rounded-full"
                      style={{background:'color-mix(in srgb, var(--theme-primary) 30%, white)'}}/>
                  </div>
                </div>
                <div className="absolute bottom-2 right-3">
                  <span className="text-[10px] font-bold text-white opacity-60">{dec.name} theme</span>
                </div>
              </div>

              {/* Menu items */}
              {[
                { icon:<Palette size={18}/>, label:'App Theme', sub:`Active: ${themes.find(t=>t.id===theme)?.label || 'Mint'}`, view:'theme', color:'var(--theme-primary)' },
                { icon:<Wand2 size={18}/>, label:'Profile Effects', sub:'Avatar decoration & banner', view:'effects', color:'#FF9D00' },
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

          {/* PROFILE EFFECTS */}
          {view === 'effects' && (
            <div className="space-y-5">
              {/* Live preview */}
              <div className="relative h-28 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{background: dec.bg}}>
                <div className="relative w-16 h-16">
                  {dec.elements}
                  <div className="w-16 h-16 rounded-full border-3 border-white shadow-xl z-10 relative overflow-hidden"
                    style={{borderWidth:3, borderColor:'rgba(255,255,255,0.8)'}}>
                    <div className="w-full h-full" style={{background:'color-mix(in srgb, var(--theme-primary) 30%, white)'}}/>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center" style={{color:'var(--theme-body)'}}>Decorations are based on your current theme</p>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'var(--theme-header)'}}>Banner</p>
                <div className="flex gap-2">
                  {['none','gradient'].map(b=>(
                    <button key={b} onClick={()=>setProfileEffects({...profileEffects, banner:b})}
                      className="px-4 py-2 rounded-xl text-xs font-bold border-2 transition-colors"
                      style={{borderColor: profileEffects.banner===b ? 'var(--theme-primary)' : 'color-mix(in srgb, var(--theme-ring) 80%, transparent)',
                        background: profileEffects.banner===b ? 'color-mix(in srgb, var(--theme-primary) 12%, transparent)' : 'transparent',
                        color: profileEffects.banner===b ? 'var(--theme-primary)' : 'var(--theme-body)'}}>
                      {b === 'none' ? 'None' : 'Nitro Gradient'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'var(--theme-header)'}}>Avatar Frame</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {v:'none', label:'None', icon:'⭕'},
                    {v:'neon-pulse', label:'Neon Glow', icon:'💫'},
                    {v:'spinning-ring', label:'Spin Ring', icon:'🌀'},
                    {v:'fire-aura', label:'Fire Aura', icon:'🔥'},
                  ].map(a=>(
                    <button key={a.v} onClick={()=>setProfileEffects({...profileEffects, avatar:a.v})}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-colors"
                      style={{borderColor: profileEffects.avatar===a.v ? 'var(--theme-primary)' : 'color-mix(in srgb, var(--theme-ring) 80%, transparent)',
                        background: profileEffects.avatar===a.v ? 'color-mix(in srgb, var(--theme-primary) 12%, transparent)' : 'transparent',
                        color: profileEffects.avatar===a.v ? 'var(--theme-primary)' : 'var(--theme-body)'}}>
                      <span>{a.icon}</span> {a.label}
                    </button>
                  ))}
                </div>
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
                  background: profileEffects.wallpaper === 'custom' && profileEffects.customWallpaperUrl ? `url(${profileEffects.customWallpaperUrl})` : 'var(--theme-sidebar)',
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
                  {id:'dots', label:'Dots', preview:`radial-gradient(circle, var(--theme-ring) 1px, transparent 1px)`, size:'20px 20px'},
                  {id:'grid', label:'Grid', preview:`linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, transparent 1px)`, size:'20px 20px'},
                  {id:'waves', label:'Waves', preview:`repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, transparent 1px, transparent 8px)`},
                ].map(w=>(
                  <button key={w.id}
                    onClick={()=>setProfileEffects({...profileEffects, wallpaper:w.id})}
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
