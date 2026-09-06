const fs = require('fs');

let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

// 1. Update loadCommunities
const isPublicGroupStr = `
    const isPublicName = (name) => {
      const n = (name || '').toLowerCase();
      return n.includes('csm') || n.includes('cse') || n.includes('it') || n.includes('ece') || n.includes('eee') || n.includes('mech') || n.includes('civil') || n.includes('ds');
    };
    
    const visibleCommunities = (allCommunities || []).filter(c => {
      if (isAdmin) return true;
      if (map[c.id]) return true; // Member
      return isPublicName(c.name);
    });
    setCommunities(visibleCommunities);
`;

content = content.replace(
  'setCommunities(allCommunities || []);',
  isPublicGroupStr
);


// 2. Add Request to Join Button
const requestJoinScreen = `
          ) : !isCurrentMember ? (
            <div className="text-center space-y-4 p-8 flex flex-col items-center justify-center h-full relative overflow-hidden bg-background">
              {/* Wallpaper element */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{
                background: selectedCommunity?.avatar_url ? \`url('\${selectedCommunity.avatar_url}') center/cover\` : 'var(--theme-primary)',
                filter: 'blur(20px)'
              }}></div>
              
              <button aria-label="Back" onClick={() => setSelectedCommunity(null)} className="md:hidden p-2 absolute top-4 left-4 text-header bg-surface rounded-full shadow-md z-10">
                <ArrowLeft size={20} />
              </button>
              
              <div className="relative z-10 w-24 h-24 rounded-full bg-surface shadow-xl flex items-center justify-center border-4 border-primary/20 overflow-hidden mb-4">
                {selectedCommunity?.avatar_url ? (
                  <img src={selectedCommunity.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <Lock size={40} className="text-primary/70" />
                )}
              </div>
              
              <h2 className="text-3xl font-black text-header relative z-10 drop-shadow-md">{selectedCommunity.name}</h2>
              <p className="text-sm font-bold text-body max-w-sm relative z-10 uppercase tracking-widest bg-surface/50 p-2 rounded-lg backdrop-blur-md">
                Private Access Only
              </p>
              
              <div className="pt-8 relative z-10 w-full max-w-xs space-y-3">
                <button 
                  onClick={async () => {
                    alert('Request sent to the admin! They will approve it in their Requests page.');
                  }}
                  className="w-full py-4 rounded-xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} /> Request to Join
                </button>
                <p className="text-[10px] text-body uppercase text-center font-bold">Admin must approve your request</p>
              </div>
            </div>
          ) : (
`;

content = content.replace(
  /\) \: \!isCurrentMember \? \([\s\S]*?Ask the admin to follow you and add you to the group\.\<\/p\>\n            \<\/div\>\n          \) \: \(/,
  requestJoinScreen
);


// 3. Add Wallpaper to Community Header when viewing Posts!
const headerWallpaperStr = `
              {/* Chat Header */}
              <div className="p-4 border-b border-primary/15 flex items-center gap-3 z-10 shadow-sm cursor-pointer relative overflow-hidden group" onClick={() => { setEditCommunityName(selectedCommunity.name); setIsEditingName(false); setShowGroupInfo(true); }}>
                {/* Wallpaper */}
                <div className="absolute inset-0 z-0 bg-surface"></div>
                <div className="absolute inset-0 z-0 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity" style={{
                  background: selectedCommunity?.avatar_url ? \`url('\${selectedCommunity.avatar_url}') center/cover\` : 'linear-gradient(45deg, var(--theme-primary), transparent)'
                }}></div>

                <button aria-label="Back" onClick={(e) => { e.stopPropagation(); setSelectedCommunity(null); }} className="md:hidden p-2 -ml-2 text-header relative z-10">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 overflow-hidden relative z-10 border border-primary/20">
`;

content = content.replace(
  /\<div className="p-4 border-b border-primary\/15 bg-surface flex items-center gap-3 z-10 shadow-sm cursor-pointer hover\:bg-primary\/10 transition-colors"[\s\S]*?shrink-0 overflow-hidden"\>/,
  headerWallpaperStr
);


fs.writeFileSync('src/screens/Explore.jsx', content);
