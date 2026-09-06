const fs = require('fs');
let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

// 1. Fix left sidebar avatars
const leftSidebarOld = `<div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Layers size={20} className="text-white" />
                  </div>`;
const leftSidebarNew = `<div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 overflow-hidden">
                    {comm.avatar_url ? (
                      <img src={comm.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Layers size={20} className="text-white" />
                    )}
                  </div>`;
content = content.replace(leftSidebarOld, leftSidebarNew);


// 2. Revert Chat Header
const chatHeaderStart = `              {/* Chat Header */}
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

                  {selectedCommunity.avatar_url ? (
                    <img src={selectedCommunity.avatar_url} alt="Group" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{selectedCommunity.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 relative z-10">
                  <h3 className="font-bold text-header text-lg">{selectedCommunity.name}</h3>
                  <p className="text-xs text-primary font-medium">Secure Group</p>
                </div>
                
                                {/* Tools */}
                {isAdmin && (
                  <label className="btn-outline text-sm flex items-center gap-1 py-1.5 px-2 mr-1 relative z-10 cursor-pointer" onClick={e => e.stopPropagation()}>
                    <ImageIcon size={14} /> <span className="hidden sm:inline">Avatar</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleUpdateGroupAvatar} />
                  </label>
                )}
                <button onClick={(e) => { e.stopPropagation(); openMembersModal(); }} className="btn-outline text-sm flex items-center gap-1 py-1.5 px-2 mr-1 relative z-10">
                  <Users size={14} /> <span className="hidden sm:inline">Members</span>
                </button>

                <button onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }} className="btn-primary text-sm flex items-center gap-1 py-1.5 px-3 relative z-10">
                  <Plus size={14} /> Share
                </button>
              </div>`;

const cleanChatHeader = `              {/* Chat Header */}
              <div className="p-4 border-b border-primary/15 bg-surface flex items-center gap-3 z-10 shadow-sm cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => { setEditCommunityName(selectedCommunity.name); setIsEditingName(false); setShowGroupInfo(true); }}>
                <button aria-label="Back" onClick={(e) => { e.stopPropagation(); setSelectedCommunity(null); }} className="md:hidden p-2 -ml-2 text-header">
                  <ArrowLeft size={20} />
                </button>
                
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  {selectedCommunity.avatar_url ? (
                    <img src={selectedCommunity.avatar_url} alt="Group" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{selectedCommunity.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-header text-lg truncate">{selectedCommunity.name}</h3>
                  <p className="text-xs text-primary font-medium">Secure Group</p>
                </div>
                
                {/* Tools */}
                <button onClick={(e) => { e.stopPropagation(); openMembersModal(); }} className="btn-outline text-sm flex items-center gap-1.5 py-1.5 px-3 mr-1 bg-surface">
                  <Users size={14} /> <span className="hidden sm:inline font-bold">Members</span>
                </button>

                <button onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }} className="btn-primary text-sm flex items-center gap-1.5 py-1.5 px-4 shadow-sm hover:scale-105 active:scale-95 transition-transform">
                  <Plus size={14} /> <span className="font-bold">Share</span>
                </button>
              </div>`;

if (content.includes('group-hover:opacity-20 transition-opacity')) {
    // Need to carefully extract and replace
    const startIdx = content.indexOf('              {/* Chat Header */}');
    // find the end of the chat header div
    const endStr = '</button>\r\n              </div>';
    const endStrLF = '</button>\n              </div>';
    
    let nextDivIdx = content.indexOf(endStr, startIdx);
    let finalEndStr = endStr;
    if (nextDivIdx === -1) {
        nextDivIdx = content.indexOf(endStrLF, startIdx);
        finalEndStr = endStrLF;
    }
    
    if (startIdx !== -1 && nextDivIdx !== -1) {
        content = content.substring(0, startIdx) + cleanChatHeader + content.substring(nextDivIdx + finalEndStr.length);
        console.log('Replaced Chat Header via boundaries');
    } else {
        console.log('Failed Chat Header boundaries', startIdx, nextDivIdx);
    }
}

fs.writeFileSync('src/screens/Explore.jsx', content);
