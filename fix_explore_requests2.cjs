const fs = require('fs');
let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

const regex1 = /setFollowingMap\(map\);\s*setIsLoadingMembers\(false\);\s*\};/;
const replacement1 = `setFollowingMap(map);
    
    // Fetch pending requests for admins
    if (selectedCommunity.created_by === session?.user?.id || myMemberships[selectedCommunity.id] === 'admin' || isAdmin) {
      const { data: reqs } = await supabase.from('community_requests')
        .select('*, profiles(name, username, avatar_url, is_premium)')
        .eq('community_id', selectedCommunity.id)
        .eq('status', 'pending');
      setCommunityRequests(reqs || []);
    } else {
      setCommunityRequests([]);
    }

    setIsLoadingMembers(false);
  };`;

content = content.replace(regex1, replacement1);

const regex2 = /<div className="overflow-y-auto space-y-4">\s*\{\/\* Current Members \*\/\}/;
const replacement2 = `<div className="overflow-y-auto space-y-4">
              {/* Pending Requests */}
              {isCommunityAdmin && communityRequests.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase text-primary mb-2">Join Requests ({communityRequests.length})</p>
                  <div className="space-y-2">
                    {communityRequests.map(req => (
                      <div key={req.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-primary/15">
                        <div className="w-8 h-8 rounded-full bg-primary/5 overflow-hidden flex items-center justify-center shrink-0">
                          {req.profiles?.avatar_url ? <img src={req.profiles.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-header truncate">{req.profiles?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-body truncate">@{req.profiles?.username || 'user'}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); handleAcceptRequest(req); }} className="p-1.5 bg-primary/20 text-primary rounded-md hover:bg-primary/30">
                            <Check size={14} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleRejectRequest(req); }} className="p-1.5 bg-red-500/20 text-red-500 rounded-md hover:bg-red-500/30">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Members */}`;

content = content.replace(regex2, replacement2);

fs.writeFileSync('src/screens/Explore.jsx', content);
