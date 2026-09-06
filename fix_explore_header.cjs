const fs = require('fs');

let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

const headerWallpaperStr = `              {/* Chat Header */}
              <div className="p-4 border-b border-primary/15 flex items-center gap-3 z-10 shadow-sm cursor-pointer relative overflow-hidden group" onClick={() => { setEditCommunityName(selectedCommunity.name); setIsEditingName(false); setShowGroupInfo(true); }}>
                {/* Wallpaper */}
                <div className="absolute inset-0 z-0 bg-surface"></div>
                <div className="absolute inset-0 z-0 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity" style={{
                  background: selectedCommunity?.avatar_url ? \`url('\${selectedCommunity.avatar_url}') center/cover\` : 'linear-gradient(45deg, var(--theme-primary), transparent)'
                }}></div>

                <button aria-label="Back" onClick={(e) => { e.stopPropagation(); setSelectedCommunity(null); }} className="md:hidden p-2 -ml-2 text-header relative z-10">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 overflow-hidden relative z-10 border border-primary/20">`;

const startStr = '              {/* Chat Header */}\r\n              <div className="p-4 border-b border-primary/15 bg-surface flex items-center gap-3 z-10 shadow-sm cursor-pointer hover:bg-primary/10 transition-colors"';
const startStrLF = '              {/* Chat Header */}\n              <div className="p-4 border-b border-primary/15 bg-surface flex items-center gap-3 z-10 shadow-sm cursor-pointer hover:bg-primary/10 transition-colors"';

let startIdx = content.indexOf(startStr);
if (startIdx === -1) startIdx = content.indexOf(startStrLF);

const endStr = 'shrink-0 overflow-hidden">';
let endIdx = content.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + headerWallpaperStr + content.substring(endIdx + endStr.length);
    fs.writeFileSync('src/screens/Explore.jsx', content);
    console.log('Success Header Wallpaper');
} else {
    console.log('Failed Header Wallpaper', startIdx, endIdx);
}
