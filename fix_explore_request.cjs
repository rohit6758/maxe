const fs = require('fs');

let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

const requestJoinScreen = `) : !isCurrentMember ? (
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
          ) : (`;

const startStr = ') : !isCurrentMember ? (';
const startIdx = content.indexOf(startStr);
const endStr = 'Ask the admin to follow you and add you to the group.</p>\r\n            </div>\r\n          ) : (';
const endStrLF = 'Ask the admin to follow you and add you to the group.</p>\n            </div>\n          ) : (';

let endIdx = content.indexOf(endStr, startIdx);
let finalEndStr = endStr;
if (endIdx === -1) {
    endIdx = content.indexOf(endStrLF, startIdx);
    finalEndStr = endStrLF;
}

if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + requestJoinScreen + content.substring(endIdx + finalEndStr.length);
    fs.writeFileSync('src/screens/Explore.jsx', content);
    console.log('Success Request Join');
} else {
    console.log('Failed to find request join boundary', startIdx, endIdx);
}
