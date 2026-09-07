const fs = require('fs');
let content = fs.readFileSync('src/components/UserProfilePopup.jsx', 'utf8');

const oldFunc = `  const toggleListFollow = async (e, targetUserId) => {`;
const newFunc = `  const removeFollower = async (e, followerId) => {
    e.stopPropagation();
    if (!window.confirm("Remove this follower?")) return;
    await supabase.from('follows').delete().match({ follower_id: followerId, following_id: currentUserId });
    setListUsers(prev => prev.filter(u => u.id !== followerId));
    setFollowerCount(prev => Math.max(0, prev - 1));
  };

  const toggleListFollow = async (e, targetUserId) => {`;

content = content.replace(oldFunc, newFunc);

const oldJSX = `                        {currentUserId && !isMe && (
                          <button 
                            onClick={(e) => toggleListFollow(e, u.id)}
                            className={\`px-4 py-1.5 rounded-full text-xs font-bold transition-all \${isListFollowing ? 'bg-background text-header border border-primary/20' : 'bg-primary text-white shadow-md shadow-primary/20'}\`}
                          >
                            {isListFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}`;

const newJSX = `                        <div className="flex gap-2">
                          {currentUserId === userId && viewMode === 'followers' && !isMe && (
                            <button onClick={(e) => removeFollower(e, u.id)} className="px-3 py-1.5 rounded-full text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                              Remove
                            </button>
                          )}
                          {currentUserId && !isMe && (
                            <button 
                              onClick={(e) => toggleListFollow(e, u.id)}
                              className={\`px-4 py-1.5 rounded-full text-xs font-bold transition-all \${isListFollowing ? 'bg-background text-header border border-primary/20' : 'bg-primary text-white shadow-md shadow-primary/20'}\`}
                            >
                              {isListFollowing ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>`;

content = content.replace(oldJSX, newJSX);
content = content.replace(oldJSX.replace(/\n/g, '\r\n'), newJSX);

fs.writeFileSync('src/components/UserProfilePopup.jsx', content);
console.log('Patched UserProfilePopup.jsx with Remove Follower');
