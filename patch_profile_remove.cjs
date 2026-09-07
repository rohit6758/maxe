const fs = require('fs');
let content = fs.readFileSync('src/screens/Profile.jsx', 'utf8');

const oldFunc = `  const toggleFollow = async (userId) => {`;
const newFunc = `  const removeFollowerFromNetwork = async (e, followerId) => {
    e.stopPropagation();
    if (!window.confirm("Remove this follower?")) return;
    await supabase.from('follows').delete().match({ follower_id: followerId, following_id: session.user.id });
    setNetworkList(prev => prev.filter(u => u.id !== followerId));
    setFollowerCount(prev => Math.max(0, prev - 1));
  };

  const toggleFollow = async (userId) => {`;

content = content.replace(oldFunc, newFunc);

const oldJSX = `                      {!isMe && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFollow(user.id); }}
                          className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors \${isFollowing ? 'bg-background text-header border border-primary/15' : 'bg-primary text-white'}\`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}`;

const newJSX = `                      <div className="flex gap-2">
                        {networkType === 'followers' && !isMe && (
                          <button onClick={(e) => removeFollowerFromNetwork(e, user.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
                            Remove
                          </button>
                        )}
                        {!isMe && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleFollow(user.id); }}
                            className={\`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors \${isFollowing ? 'bg-background text-header border border-primary/15' : 'bg-primary text-white'}\`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>`;

content = content.replace(oldJSX, newJSX);
content = content.replace(oldJSX.replace(/\n/g, '\r\n'), newJSX);

fs.writeFileSync('src/screens/Profile.jsx', content);
console.log('Patched Profile.jsx Remove Follower');
