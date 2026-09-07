const fs = require('fs');
let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

// Add state
if (!content.includes('const [communityRequests, setCommunityRequests] = useState([]);')) {
  content = content.replace(
    'const [hasSearched, setHasSearched] = useState(false);',
    'const [hasSearched, setHasSearched] = useState(false);\n  const [communityRequests, setCommunityRequests] = useState([]);'
  );
}

// Modify openMembersModal
const oldOpenMembersModal = `  const openMembersModal = async () => {
    setShowMembersModal(true);
    setIsLoadingMembers(true);
    setMemberSearch('');
    setHasSearched(false);
    setMemberSearchResults([]);`;

const newOpenMembersModal = `  const openMembersModal = async () => {
    setShowMembersModal(true);
    setIsLoadingMembers(true);
    setMemberSearch('');
    setHasSearched(false);
    setMemberSearchResults([]);
    setCommunityRequests([]);

    const isAdminLocal = selectedCommunity.created_by === session?.user?.id || myMemberships[selectedCommunity.id] === 'admin' || isAdmin;
    if (isAdminLocal) {
      try {
        const { data: reqs } = await supabase.from('community_requests').select('*, profiles(name, username, avatar_url)').match({ community_id: selectedCommunity.id, status: 'pending' });
        if (reqs) setCommunityRequests(reqs);
      } catch (e) {}
    }`;

content = content.replace(oldOpenMembersModal, newOpenMembersModal);

// Add Accept/Reject logic
const addRequestLogic = `  const handleAcceptRequest = async (req) => {
    try {
      await supabase.from('community_members').insert([{ community_id: req.community_id, user_id: req.user_id, role: 'member' }]);
      await supabase.from('community_requests').update({ status: 'accepted' }).eq('id', req.id);
      setCommunityRequests(prev => prev.filter(r => r.id !== req.id));
      toast('Request accepted!');
      openMembersModal(); // reload members
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleRejectRequest = async (req) => {
    try {
      await supabase.from('community_requests').update({ status: 'rejected' }).eq('id', req.id);
      setCommunityRequests(prev => prev.filter(r => r.id !== req.id));
      toast('Request rejected');
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleMemberSearch = async (e) => {`;

if (!content.includes('const handleAcceptRequest = async (req) => {')) {
  content = content.replace('  const handleMemberSearch = async (e) => {', addRequestLogic);
}

// Render Requests in the modal
const oldMembersModalJSX = `              <div className="overflow-y-auto space-y-4">
                {/* Current Members */}`;

const newMembersModalJSX = `              <div className="overflow-y-auto space-y-4">
                {/* Pending Requests */}
                {isCommunityAdmin && communityRequests.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase text-primary mb-2">Pending Requests ({communityRequests.length})</p>
                    <div className="space-y-2">
                      {communityRequests.map(req => (
                        <div key={req.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-primary/15">
                          <div className="w-10 h-10 rounded-full bg-primary/5 overflow-hidden shrink-0">
                            {req.profiles?.avatar_url ? <img src={req.profiles.avatar_url} className="w-full h-full object-cover" /> : <User size={16} className="text-body m-auto mt-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-header truncate">{req.profiles?.name}</p>
                            <p className="text-xs text-body truncate">@{req.profiles?.username}</p>
                          </div>
                          <button onClick={() => handleAcceptRequest(req)} className="p-1.5 bg-primary text-white rounded-lg hover:opacity-90">
                            <Check size={16} />
                          </button>
                          <button onClick={() => handleRejectRequest(req)} className="p-1.5 bg-red-500 text-white rounded-lg hover:opacity-90">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Current Members */}`;

content = content.replace(oldMembersModalJSX, newMembersModalJSX);
content = content.replace(oldMembersModalJSX.replace(/\n/g, '\r\n'), newMembersModalJSX);

fs.writeFileSync('src/screens/Explore.jsx', content);
console.log('Patched Explore.jsx with admin request approval');
