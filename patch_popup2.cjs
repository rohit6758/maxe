const fs = require('fs');
let c = fs.readFileSync('src/components/UserProfilePopup.jsx', 'utf8');

c = c.replace(
  "import { useAppContext } from '../context/AppContext';",
  "import { useAppContext } from '../context/AppContext';\nimport { THEME_DECORATIONS } from './ProSettingsModal';"
);

const OLD = `  return (
    <div className="fixed inset-0 z-[200] flex md:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-0 md:p-4" onClick={onClose}>
      <div 
        className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md bg-surface md:rounded-3xl shadow-xl shadow-primary/20 overflow-hidden flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Top actions */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50">
          <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors">
            <ArrowLeft size={20} className="md:hidden" />
            <X size={20} className="hidden md:block" />
          </button>
        </div>

        {viewMode === 'profile' ? (
          <div className="relative p-6 pt-12">
            {profile?.is_premium && profileEffects?.banner === 'gradient' && (
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-[var(--theme-primary)] via-[var(--theme-accent)] to-[var(--theme-primary)] opacity-40"></div>
            )}

            {/* Top section: Avatar & Stats */}
            <div className="flex items-center gap-6 mb-6 relative z-10">
              <div 
                className={\`w-24 h-24 rounded-full border-4 \${profile?.is_premium ? 'border-transparent bg-gradient-to-tr from-primary to-accent p-1' : 'border-primary/20'} overflow-hidden flex items-center justify-center shrink-0 cursor-pointer shadow-lg relative\`}
                onClick={() => profile?.avatar_url && setViewingAvatar(true)}
              >
                {profile?.is_premium && profileEffects?.avatar !== 'none' && (
                  <AvatarDecoration type={profileEffects?.avatar} />
                )}
                <div className="w-full h-full rounded-full overflow-hidden bg-primary/5">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    <User size={40} className="text-primary/50 m-auto mt-4" />
                  )}
                </div>
              </div>`;

const NEW = `  const isMe = currentUserId === userId;
  const effectiveTheme = isMe ? useAppContext().theme : (profile?.is_premium ? 'venice' : 'default');
  const dec = THEME_DECORATIONS[effectiveTheme] || THEME_DECORATIONS.default;
  const eff = isMe ? profileEffects : (profile?.is_premium ? { banner:'gradient', avatar:'neon-pulse', wallpaper:'waves' } : { banner:'none', avatar:'none', wallpaper:'none' });

  return (
    <div className="fixed inset-0 z-[200] flex md:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-0 md:p-4" onClick={onClose}>
      <div 
        className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md bg-surface md:rounded-3xl shadow-xl shadow-primary/20 overflow-hidden flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Top actions */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50">
          <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors">
            <ArrowLeft size={20} className="md:hidden" />
            <X size={20} className="hidden md:block" />
          </button>
        </div>

        {viewMode === 'profile' ? (
          <div className="relative p-6 pt-12 overflow-hidden" style={{
            ...(profile?.is_premium && eff?.wallpaper !== 'none' ? {
              background: eff.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                          eff.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                          eff.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : 'var(--theme-surface)',
              backgroundSize: eff.wallpaper === 'waves' ? 'auto' : '20px 20px'
            } : {})
          }}>
            {profile?.is_premium && eff?.banner === 'gradient' && (
              <div className="absolute top-0 left-0 right-0 h-32 opacity-80" style={{background: dec.bg}}></div>
            )}

            {/* Top section: Avatar & Stats */}
            <div className="flex items-center gap-6 mb-6 relative z-10 mt-4">
              <div 
                className="relative w-28 h-28 flex items-center justify-center shrink-0 cursor-pointer"
                onClick={() => profile?.avatar_url && setViewingAvatar(true)}
              >
                {/* Theme-specific decorations */}
                {profile?.is_premium && (
                  <div className="absolute inset-0 pointer-events-none scale-[1.3] z-0">
                    {dec.elements}
                  </div>
                )}
                {/* Old avatar decorations as fallback */}
                {profile?.is_premium && eff?.avatar !== 'none' && (
                  <AvatarDecoration type={eff?.avatar} />
                )}
                <div className="w-24 h-24 rounded-full border-4 overflow-hidden relative z-10 bg-white"
                  style={{borderColor: profile?.is_premium ? 'color-mix(in srgb, var(--theme-primary) 50%, white)' : 'var(--theme-ring)'}}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    <User size={40} className="text-primary/50 m-auto mt-6" />
                  )}
                </div>
              </div>`;


const idx = c.indexOf('  return (\n    <div className="fixed inset-0');
const end = c.indexOf('              </div>\n              \n              <div className="flex-1', idx);
if(idx > -1 && end > -1) {
  c = c.substring(0, idx) + NEW + c.substring(end + 20);
  fs.writeFileSync('src/components/UserProfilePopup.jsx', c);
  console.log('patched');
} else {
  console.log('not found');
}
