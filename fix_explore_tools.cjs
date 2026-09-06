const fs = require('fs');
let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

const newTools = `                {/* Tools */}
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
                </button>`;

const startStr = '{/* Tools */}';
const startIdx = content.indexOf(startStr);
const endStr = '</button>';
const endIdx = content.indexOf(endStr, content.indexOf(endStr, startIdx) + 5) + endStr.length;

if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + newTools + content.substring(endIdx);
    fs.writeFileSync('src/screens/Explore.jsx', content);
    console.log('Success Replace Tools');
} else {
    console.log('Failed Tools', startIdx, endIdx);
}
