const fs = require('fs');
let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

const oldPrivateUI = `            <div className="text-center space-y-4 p-8 flex flex-col items-center justify-center h-full relative overflow-hidden bg-background">
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
                    toast('Request sent to the admin! They will approve it in their Requests page.');
                  }}
                  className="w-full py-4 rounded-xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} /> Request to Join
                </button>
                <p className="text-[10px] text-body uppercase text-center font-bold">Admin must approve your request</p>
              </div>
            </div>`;

const newPrivateUI = `            <div className="flex-1 flex flex-col bg-surface relative">
              {/* Header */}
              <div className="p-4 border-b border-primary/15 flex items-center gap-3 z-10 bg-surface">
                <button aria-label="Back" onClick={(e) => { e.stopPropagation(); setSelectedCommunity(null); }} className="md:hidden p-2 -ml-2 text-header">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 overflow-hidden">
                  {selectedCommunity?.avatar_url ? (
                    <img src={selectedCommunity.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <Lock size={18} className="text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-header text-lg truncate">{selectedCommunity.name}</h3>
                  <p className="text-xs text-primary font-medium">Private Group</p>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Lock size={32} className="text-primary" />
                </div>
                <h2 className="text-xl font-bold text-header mb-2">Private Access Only</h2>
                <p className="text-sm text-body max-w-xs mb-8">You are not a member of {selectedCommunity.name}. Ask the admin to add you, or request access below.</p>
                
                <div className="w-full max-w-xs space-y-3">
                  {joinRequestStatus === 'pending' ? (
                    <button disabled className="w-full py-3 rounded-xl bg-primary/20 text-primary font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                      <Check size={18} /> Request Sent
                    </button>
                  ) : (
                    <button 
                      onClick={handleRequestJoin}
                      className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus size={18} /> Request to Join
                    </button>
                  )}
                  {joinRequestStatus === 'rejected' && (
                    <p className="text-xs text-red-500 font-bold">Your previous request was rejected. You can try again.</p>
                  )}
                </div>
              </div>
            </div>`;

content = content.replace(oldPrivateUI, newPrivateUI);
content = content.replace(oldPrivateUI.replace(/\n/g, '\r\n'), newPrivateUI);

// Add joinRequestStatus state
if (!content.includes('const [joinRequestStatus, setJoinRequestStatus]')) {
  content = content.replace(
    'const [isLoadingPosts, setIsLoadingPosts] = useState(false);',
    'const [isLoadingPosts, setIsLoadingPosts] = useState(false);\n  const [joinRequestStatus, setJoinRequestStatus] = useState(null);'
  );
}

// Add loadRequestStatus useEffect
const loadRequestStatusBlock = `  useEffect(() => {
    if (selectedCommunity && !isCurrentMember) {
      const checkRequest = async () => {
        try {
          const { data, error } = await supabase.from('community_requests').select('status').match({ community_id: selectedCommunity.id, user_id: session.user.id }).order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (data) setJoinRequestStatus(data.status);
          else setJoinRequestStatus(null);
        } catch (err) {}
      };
      checkRequest();
    }
  }, [selectedCommunity, isCurrentMember]);

  const handleRequestJoin = async () => {
    try {
      const { error } = await supabase.from('community_requests').insert([{ community_id: selectedCommunity.id, user_id: session.user.id, status: 'pending' }]);
      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('relation "public.community_requests" does not exist')) {
          toast('Database update required! Admin needs to create community_requests table first.', 'error');
        } else {
          toast('Failed to send request: ' + error.message, 'error');
        }
        return;
      }
      setJoinRequestStatus('pending');
      toast('Request sent successfully!');
    } catch (err) {
      toast('Something went wrong.', 'error');
    }
  };

  const fetchSinglePost =`;

content = content.replace('  const fetchSinglePost =', loadRequestStatusBlock);

fs.writeFileSync('src/screens/Explore.jsx', content);
console.log('Patched Explore.jsx with request flow UI');
