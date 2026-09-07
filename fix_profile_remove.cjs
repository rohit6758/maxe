const fs = require('fs');
let content = fs.readFileSync('src/screens/Profile.jsx', 'utf8');

// Add state
const stateTarget = `const [selectedUser, setSelectedUser] = useState(null); // For Profile Popup`;
const stateReplacement = `const [selectedUser, setSelectedUser] = useState(null); // For Profile Popup
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);`;

content = content.replace(stateTarget, stateReplacement);

// Replace removeFollowerFromNetwork logic
const removeTarget = `  const removeFollowerFromNetwork = async (e, followerId) => {
    e.stopPropagation();
    if (!window.confirm("Remove this follower?")) return;
    await supabase.from('follows').delete().match({ follower_id: followerId, following_id: session.user.id });
    setNetworkList(prev => prev.filter(u => u.id !== followerId));
    setFollowerCount(prev => Math.max(0, prev - 1));
  };`;

const removeReplacement = `  const removeFollowerFromNetwork = (e, user) => {
    e.stopPropagation();
    setShowRemoveConfirm(user);
  };

  const confirmRemoveFollower = async () => {
    if (!showRemoveConfirm) return;
    const followerId = showRemoveConfirm.id;
    
    setNetworkList(prev => prev.filter(u => u.id !== followerId));
    setFollowerCount(prev => Math.max(0, prev - 1));
    setShowRemoveConfirm(null);

    const { error } = await supabase.from('follows').delete().match({ follower_id: followerId, following_id: session.user.id });
    if (error) {
      toast('Could not remove follower: ' + error.message, 'error');
    }
  };`;

content = content.replace(removeTarget, removeReplacement);

// Update button onClick
const buttonTarget = `<button onClick={(e) => removeFollowerFromNetwork(e, user.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">`;
const buttonReplacement = `<button onClick={(e) => removeFollowerFromNetwork(e, user)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">`;

content = content.replace(buttonTarget, buttonReplacement);

// Add modal HTML inside showNetwork block
const modalTarget = `            {isLoadingNetwork ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">`;

const modalReplacement = `            {showRemoveConfirm && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 rounded-2xl">
                <div className="bg-surface p-6 rounded-2xl shadow-2xl max-w-xs w-full text-center">
                  <h4 className="text-header font-bold text-lg mb-2">Remove Follower?</h4>
                  <p className="text-sm text-body mb-6">Are you sure you want to remove @{showRemoveConfirm.username} from your followers?</p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => setShowRemoveConfirm(null)} className="px-4 py-2 rounded-lg font-bold text-body bg-background border border-primary/10">Cancel</button>
                    <button onClick={confirmRemoveFollower} className="px-4 py-2 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 shadow-md">Remove</button>
                  </div>
                </div>
              </div>
            )}
            
            {isLoadingNetwork ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">`;

content = content.replace(modalTarget, modalReplacement);

fs.writeFileSync('src/screens/Profile.jsx', content);
