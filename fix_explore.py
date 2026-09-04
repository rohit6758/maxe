import re

with open('src/screens/Explore.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(
    r'<div className="space-y-2">\s*\{\(hasSearched \? memberSearchResults : myFollowers\).length === 0 &&.*?</div>\s*</div>', 
    re.DOTALL
)

new_ui = """<div className="space-y-2">
                  {hasSearched && memberSearchResults.length === 0 && <p className="text-xs text-body italic text-center py-2">No people found.</p>}
                  {hasSearched && memberSearchResults.map(person => {
                      const isAlreadyMember = communityMembers.some(m => m.user_id === person.id);
                      if (isAlreadyMember) return null;
                      return (
                        <div key={person.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface border border-[#333]">
                          <div className="w-8 h-8 rounded-full bg-black/5 overflow-hidden flex items-center justify-center shrink-0">
                            {person.avatar_url ? <img src={person.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-header truncate">{person.name}</p>
                            <p className="text-[10px] text-primary font-bold truncate">@{person.username || 'user'}</p>
                          </div>
                          <button 
                            onClick={() => addMemberToGroup(person.id)}
                            disabled={isAddingMember}
                            className="btn-primary py-1 px-3 text-xs rounded flex items-center gap-1"
                          >
                            <UserPlus size={12}/> Add
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>"""

content = re.sub(pattern, new_ui, content)

with open('src/screens/Explore.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
