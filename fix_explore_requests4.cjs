const fs = require('fs');
let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

const targetStr = `              {/* Pending Requests */}
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
              )}`;

const replacementStr = `              {/* Pending Requests */}
              {isCommunityAdmin && (
                <div className="mb-6 bg-primary/5 p-3 rounded-xl border border-primary/10">
                  <p className="text-xs font-bold uppercase text-primary mb-3 flex items-center gap-2">
                    Join Requests 
                    <span className="bg-primary text-white px-2 py-0.5 rounded-full text-[10px]">{communityRequests.length}</span>
                  </p>
                  {communityRequests.length === 0 ? (
                    <p className="text-xs text-body text-center py-4 font-medium opacity-70">No pending join requests.</p>
                  ) : (
                    <div className="space-y-2">
                      {communityRequests.map(req => (
                        <div key={req.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-primary/15 shadow-sm">
                          <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
                            {req.profiles?.avatar_url ? <img src={req.profiles.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={14} className="text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-header truncate">{req.profiles?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-body truncate">@{req.profiles?.username || 'user'}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); handleAcceptRequest(req); }} className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-md hover:opacity-90 active:scale-95 transition-all">
                              Accept
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleRejectRequest(req); }} className="px-3 py-1.5 bg-surface text-body text-xs font-bold rounded-md border border-primary/20 hover:bg-background active:scale-95 transition-all">
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}`;

content = content.replace(targetStr, replacementStr);

fs.writeFileSync('src/screens/Explore.jsx', content);
