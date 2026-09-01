import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Plus, MessageSquare, FileText, Download, Trash2, ArrowLeft, Send, Layers, User, Users, Check, UserPlus, X, Lock, Image as ImageIcon, Search } from 'lucide-react';

export default function Explore() {
  const { session } = useAppContext();
  const isAdmin = session?.user?.email === 'rohitnxtgengw@gmail.com';

  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [myMemberships, setMyMemberships] = useState({});

  // Modals / Forms
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  
  const [showEditCommunity, setShowEditCommunity] = useState(false);
  const [editCommunityName, setEditCommunityName] = useState('');
  const [editCommunityAvatar, setEditCommunityAvatar] = useState(null);
  const [isEditingCommunity, setIsEditingCommunity] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState({ subject_name: '', title: '', type: 'pdf', url: '', file: null });
  const [isUploading, setIsUploading] = useState(false);

  // Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importingPost, setImportingPost] = useState(null);
  const [mySubjects, setMySubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');


  // Members Modal
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [myFollowers, setMyFollowers] = useState([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);


  useEffect(() => {
    if (session) {
      loadCommunities();
      loadMySubjects();
    }
  }, [session]);

  useEffect(() => {
    if (selectedCommunity) {
      const isMember = myMemberships[selectedCommunity.id] || isAdmin;
      if (isMember) {
        loadPosts(selectedCommunity.id);
        
        const channel = supabase.channel('community_posts')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts', filter: `community_id=eq.${selectedCommunity.id}` }, payload => {
            fetchSinglePost(payload.new.id);
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_posts' }, payload => {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id));
          })
          .subscribe();
          
        return () => { supabase.removeChannel(channel); };
      }
    }
  }, [selectedCommunity, myMemberships, isAdmin]);

  const fetchSinglePost = async (id) => {
    const { data } = await supabase.from('community_posts').select('*, profiles(name, username, avatar_url)').eq('id', id).single();
    if (data) setPosts(prev => [data, ...prev]);
  };

  const loadCommunities = async () => {
    // Show all communities so user knows they exist
    const { data: allCommunities } = await supabase.from('communities').select('*').order('created_at', { ascending: false });
    
    // Check which ones we are members of
    const { data: memberData } = await supabase.from('community_members').select('community_id, role').eq('user_id', session.user.id);
    const map = {};
    if (memberData) {
      memberData.forEach(m => { map[m.community_id] = m.role; });
    }
    
    setCommunities(allCommunities || []);
    setMyMemberships(map);
  };

  const loadPosts = async (communityId) => {
    const { data } = await supabase
      .from('community_posts')
      .select('*, profiles(name, username, avatar_url)')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });
    setPosts(data || []);
  };

  const loadMySubjects = async () => {
    const { data: sems } = await supabase.from('semesters').select('id, name').eq('user_id', session.user.id);
    if (!sems || sems.length === 0) return;
    const { data: subs } = await supabase.from('subjects').select('id, name, semester_id').in('semester_id', sems.map(s => s.id));
    
    const formatted = (subs || []).map(sub => {
      const sem = sems.find(s => s.id === sub.semester_id);
      return { ...sub, semName: sem ? sem.name : 'Unknown' };
    });
    setMySubjects(formatted);
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!newCommunityName.trim()) return;
    const { data, error } = await supabase.from('communities').insert([{ name: newCommunityName.trim(), created_by: session.user.id }]).select();
    if (error) alert(error.message);
    else {
      await supabase.from('community_members').insert([{
        community_id: data[0].id,
        user_id: session.user.id,
        role: 'admin'
      }]);
      setCommunities([data[0], ...communities]);
      setMyMemberships(prev => ({ ...prev, [data[0].id]: 'admin' }));
      setShowCreateCommunity(false);
      setNewCommunityName('');
      setSelectedCommunity(data[0]);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!selectedCommunity) return;
    setIsUploading(true);

    try {
      let finalUrl = shareData.url;
      let finalSize = null;

      if (shareData.type === 'pdf' || shareData.type === 'question_paper') {
        if (!shareData.file) throw new Error('Please select a file');
        const filePath = `${session.user.id}/${Date.now()}-${shareData.file.name}`;
        const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, shareData.file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
        finalUrl = urlData.publicUrl;
        finalSize = (shareData.file.size / 1024 / 1024).toFixed(2) + ' MB';
      }

      const { error } = await supabase.from('community_posts').insert([{
        community_id: selectedCommunity.id,
        user_id: session.user.id,
        subject_name: shareData.subject_name.trim(),
        title: shareData.title.trim(),
        type: shareData.type,
        url: finalUrl,
        size: finalSize
      }]);

      if (error) throw error;
      setShowShareModal(false);
      setShareData({ subject_name: '', title: '', type: 'pdf', url: '', file: null });
    } catch (err) {
      alert(err.message);
    }
    setIsUploading(false);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    if (error) alert(error.message);
    else setPosts(posts.filter(p => p.id !== postId));
  };

  const handleEditCommunity = async (e) => {
    e.preventDefault();
    if (!editCommunityName.trim()) return;
    setIsEditingCommunity(true);
    try {
      let finalAvatarUrl = selectedCommunity.avatar_url || null;
      if (editCommunityAvatar) {
        const fileExt = editCommunityAvatar.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('pdfs') // reusing existing bucket for now
          .upload(`community_avatars/${fileName}`, editCommunityAvatar);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('pdfs')
          .getPublicUrl(`community_avatars/${fileName}`);
          
        finalAvatarUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('communities')
        .update({ name: editCommunityName.trim(), avatar_url: finalAvatarUrl })
        .eq('id', selectedCommunity.id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setCommunities(communities.map(c => c.id === selectedCommunity.id ? data : c));
      setSelectedCommunity(data);
      setShowEditCommunity(false);
    } catch (err) {
      alert(err.message);
    }
    setIsEditingCommunity(false);
  };

  const handleDeleteCommunity = async (communityId, e) => {
    e.stopPropagation();
    if (!window.confirm('WARNING: Delete this entire community group and all its posts?')) return;
    const { error } = await supabase.from('communities').delete().eq('id', communityId);
    if (error) alert(error.message);
    else {
      setCommunities(communities.filter(c => c.id !== communityId));
      if (selectedCommunity?.id === communityId) setSelectedCommunity(null);
    }
  };

  const initiateImport = (post) => {
    setImportingPost(post);
    setShowImportModal(true);
    setSelectedSubjectId('');
  };

  const executeImport = async () => {
    if (!selectedSubjectId) return alert('Select a subject to import to');
    try {
      const { error } = await supabase.from('resources').insert([{
        subject_id: selectedSubjectId,
        title: importingPost.title,
        url: importingPost.url,
        type: importingPost.type,
        size: importingPost.size
      }]);
      if (error) throw error;
      alert('Imported successfully!');
      setShowImportModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Members Management ---
  const openMembersModal = async () => {
    setShowMembersModal(true);
    setMemberSearch('');
    setHasSearched(false);
    setMemberSearchResults([]);
    const { data: membersData } = await supabase.from('community_members').select('*, profiles(name, username, avatar_url)').eq('community_id', selectedCommunity.id);
    let mems = membersData || [];
    
    // Ensure Creator is always visually in the list even if RLS blocked their initial insertion
    if (selectedCommunity && !mems.some(m => m.user_id === selectedCommunity.created_by)) {
      const { data: creatorProfile } = await supabase.from('profiles').select('name, username, avatar_url').eq('id', selectedCommunity.created_by).single();
      if (creatorProfile) {
        mems = [{ user_id: selectedCommunity.created_by, role: 'admin', profiles: creatorProfile }, ...mems];
      }
    }
    
    // Ensure Super Admin visually appears if they are viewing, so they can manage
    if (isAdmin && session?.user?.id !== selectedCommunity.created_by && !mems.some(m => m.user_id === session?.user?.id)) {
      const { data: myProfile } = await supabase.from('profiles').select('name, username, avatar_url').eq('id', session.user.id).single();
      if (myProfile) {
        mems = [...mems, { user_id: session.user.id, role: 'admin', profiles: myProfile }];
      }
    }

    setCommunityMembers(mems);

    const { data: follows } = await supabase.from('follows').select('follower_id').eq('following_id', session.user.id);
    if (follows && follows.length > 0) {
      const followerIds = follows.map(f => f.follower_id);
      const { data: followersProfiles } = await supabase.from('profiles').select('*').in('id', followerIds);
      setMyFollowers(followersProfiles || []);
    } else {
      setMyFollowers([]);
    }
  };


  const handleMemberSearch = async (e) => {
    e.preventDefault();
    if (!memberSearch.trim()) {
      setHasSearched(false);
      setMemberSearchResults([]);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').or(`name.ilike.%${memberSearch}%,username.ilike.%${memberSearch}%`).neq('id', session.user.id).limit(10);
    setMemberSearchResults(data || []);
    setHasSearched(true);
  };
  const addMemberToGroup = async (userId) => {
    setIsAddingMember(true);
    try {
      const { error } = await supabase.from('community_members').insert([{
        community_id: selectedCommunity.id,
        user_id: userId,
        role: 'member'
      }]);
      if (error) throw error;
      const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', userId).single();
      setCommunityMembers([...communityMembers, { user_id: userId, role: 'member', profiles: profile }]);
    } catch (err) {
      alert('Could not add member: ' + err.message);
    }
    setIsAddingMember(false);
  };

  const removeMember = async (userId) => {
    if (!window.confirm("Remove this member from the community?")) return;
    const { error } = await supabase.from('community_members').delete().match({ community_id: selectedCommunity.id, user_id: userId });
    if (!error) setCommunityMembers(communityMembers.filter(m => m.user_id !== userId));
  };

  const promoteToAdmin = async (userId) => {
    if (!window.confirm("Make this member an admin?")) return;
    const { error } = await supabase.from('community_members').update({ role: 'admin' }).match({ community_id: selectedCommunity.id, user_id: userId });
    if (!error) setCommunityMembers(communityMembers.map(m => m.user_id === userId ? { ...m, role: 'admin' } : m));
  };

  const getIcon = (type) => {
    if (type === 'pdf') return <FileText size={16} className="text-primary" />;
    if (type === 'chat') return <MessageSquare size={16} className="text-primary" />;
    return <FileText size={16} className="text-primary" />;
  };

  const isCurrentMember = selectedCommunity ? (myMemberships[selectedCommunity.id] || isAdmin) : false;
  const isCommunityAdmin = selectedCommunity ? (selectedCommunity.created_by === session?.user?.id || myMemberships[selectedCommunity.id] === 'admin' || isAdmin) : false;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-40px)] bg-background -m-4 md:-m-0 md:rounded-2xl overflow-hidden border border-[#333]">
      
      <div className="flex flex-1 h-full overflow-hidden">
        
        {/* LEFT PANE: Community List */}
        <div className={`w-full md:w-1/3 md:border-r border-[#333] flex flex-col bg-surface ${selectedCommunity ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-[#333] flex items-center justify-between bg-surface z-10">
            <h2 className="text-xl font-bold text-header">Communities</h2>
            <button onClick={() => setShowCreateCommunity(true)} className="btn-primary p-2 rounded-full shadow-lg">
              <Plus size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {communities.length === 0 ? (
              <p className="p-8 text-center text-body text-sm">No communities found. Create one!</p>
            ) : (
              communities.map(comm => (
                <button 
                  key={comm.id} 
                  onClick={() => setSelectedCommunity(comm)}
                  className={`w-full text-left p-4 border-b border-[#333] hover:bg-black/10 transition-colors flex items-center gap-3 ${selectedCommunity?.id === comm.id ? 'bg-black/20' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Layers size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-header text-base truncate">{comm.name}</h3>
                    <p className="text-xs text-body truncate">
                      {myMemberships[comm.id] || isAdmin ? 'Tap to view shared resources' : 'Private Group'}
                    </p>
                  </div>
                  {isAdmin && (
                    <button onClick={(e) => handleDeleteCommunity(comm.id, e)} className="text-red-400 hover:text-red-600 p-2">
                      <Trash2 size={16} />
                    </button>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANE: Chat Feed */}
        <div className={`w-full md:flex-1 flex flex-col bg-background relative ${!selectedCommunity ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
          {!selectedCommunity ? (
            <div className="text-center space-y-3 opacity-50">
              <Layers size={48} className="mx-auto text-body" />
              <p className="text-body font-medium">Select a community</p>
            </div>
          ) : !isCurrentMember ? (
            <div className="text-center space-y-3 opacity-60 p-8 flex flex-col items-center justify-center h-full">
              <button onClick={() => setSelectedCommunity(null)} className="md:hidden p-2 absolute top-4 left-4 text-header bg-surface rounded-full shadow-md">
                <ArrowLeft size={20} />
              </button>
              <Lock size={48} className="text-body mb-2" />
              <p className="text-header font-bold text-lg">Private Community</p>
              <p className="text-sm text-body">You are not a member of {selectedCommunity.name}.</p>
              <p className="text-xs text-body">Ask the admin to follow you and add you to the group.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[#333] bg-surface flex items-center gap-3 z-10 shadow-sm">
                <button onClick={() => setSelectedCommunity(null)} className="md:hidden p-2 -ml-2 text-header">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Layers size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-header text-lg">{selectedCommunity.name}</h3>
                  <p className="text-xs text-primary font-medium">Secure Group</p>
                </div>
                
                {/* Admin/Creator Tools */}
                {(selectedCommunity.created_by === session?.user?.id || myMemberships[selectedCommunity.id] === 'admin' || isAdmin) && (
                  <button onClick={openMembersModal} className="btn-outline text-sm flex items-center gap-1 py-1.5 px-2 mr-1">
                    <Users size={14} /> <span className="hidden sm:inline">Members</span>
                  </button>
                )}

                <button onClick={() => setShowShareModal(true)} className="btn-primary text-sm flex items-center gap-1 py-1.5 px-3">
                  <Plus size={14} /> Share
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {posts.length === 0 ? (
                  <div className="text-center p-8 bg-surface rounded-xl border border-[#333] text-body text-sm">
                    No resources shared yet. Be the first to post!
                  </div>
                ) : (
                  posts.map(post => {
                    const isMine = post.user_id === session?.user?.id;
                    const canDelete = isMine || isAdmin;

                    return (
                      <div key={post.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        {!isMine && (
                          <div className="flex items-center gap-2 mb-1 ml-1">
                            <div className="w-5 h-5 rounded-full bg-surface overflow-hidden flex items-center justify-center shrink-0 border border-[#333]">
                              {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={10} />}
                            </div>
                            <span className="text-[11px] font-bold text-body">{post.profiles?.name || 'Unknown'}</span>
                          </div>
                        )}
                        <div className={`max-w-[85%] md:max-w-[70%] card p-3 space-y-2 relative shadow-sm ${isMine ? 'bg-[#EAF4EF] border-[#6BA898]/30' : 'bg-surface'}`}>
                          
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-[10px] uppercase font-bold text-primary tracking-wider px-1.5 py-0.5 rounded bg-primary/10">
                              Subject: {post.subject_name}
                            </span>
                            {canDelete && (
                              <button onClick={() => handleDeletePost(post.id)} className="text-red-400 hover:text-red-600 p-1 -mt-1 -mr-1">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <div className="flex items-start gap-3 mt-1">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                              {getIcon(post.type)}
                            </div>
                            <div>
                              <h4 className="font-bold text-header text-sm line-clamp-2">{post.title}</h4>
                              <p className="text-xs text-body mt-0.5 uppercase">{post.type.replace('_', ' ')} {post.size ? `· ${post.size}` : ''}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 mt-2 border-t border-[#333]/50">
                            <a href={post.url} target="_blank" rel="noreferrer" className="flex-1 py-1.5 text-center text-xs font-bold text-header bg-black/5 hover:bg-black/10 rounded-lg transition-colors">
                              View
                            </a>
                            <button onClick={() => initiateImport(post)} className="flex-1 py-1.5 text-center text-xs font-bold text-white bg-primary hover:bg-[#529683] rounded-lg transition-colors flex items-center justify-center gap-1">
                              <Download size={12} /> Import
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MEMBERS MODAL */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-5 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-header flex items-center gap-2">
                <Users size={20} className="text-primary"/> Manage Members
              </h3>
              <button onClick={() => setShowMembersModal(false)}><X size={20}/></button>
            </div>
            
            <div className="overflow-y-auto space-y-4">
              {/* Current Members */}
              <div>
                <p className="text-xs font-bold uppercase text-primary mb-2">Current Members ({communityMembers.length})</p>
                <div className="space-y-2">
                  {communityMembers.map(m => (
                    <div key={m.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-[#333]">
                      <div className="w-8 h-8 rounded-full bg-black/5 overflow-hidden flex items-center justify-center shrink-0">
                        {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-header truncate">{m.profiles?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-primary font-bold truncate">@{m.profiles?.username || 'user'}</p>
                      </div>
                      {m.role === 'admin' && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase shrink-0">Admin</span>}
                      {isCommunityAdmin && m.user_id !== session?.user?.id && (
                        <div className="flex gap-1 shrink-0">
                          {m.role !== 'admin' && (
                            <button onClick={() => promoteToAdmin(m.user_id)} className="px-2 py-1 text-[10px] bg-black/5 rounded hover:bg-black/10 font-bold text-header">Admin +</button>
                          )}
                          <button onClick={() => removeMember(m.user_id)} className="px-2 py-1 text-[10px] bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 font-bold">Remove</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Members */}
              <div className="pt-2 border-t border-[#333]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase text-primary">Add People</p>
                </div>
                <form onSubmit={handleMemberSearch} className="flex gap-2 mb-3">
                  <input className="app-input flex-1 text-xs" placeholder="Search by name or @username..." value={memberSearch} onChange={e => {
                    setMemberSearch(e.target.value);
                    if (!e.target.value.trim()) { setHasSearched(false); setMemberSearchResults([]); }
                  }} />
                  <button type="submit" className="btn-primary p-2 rounded-xl"><Search size={14}/></button>
                </form>

                <div className="space-y-2">
                  {(hasSearched ? memberSearchResults : myFollowers).length === 0 && <p className="text-xs text-body italic text-center py-2">No people found.</p>}
                  {(hasSearched ? memberSearchResults : myFollowers).map(follower => {
                      const isAlreadyMember = communityMembers.some(m => m.user_id === follower.id);
                      return (
                        <div key={follower.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface border border-[#333]">
                          <div className="w-8 h-8 rounded-full bg-black/5 overflow-hidden flex items-center justify-center shrink-0">
                            {follower.avatar_url ? <img src={follower.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-header truncate">{follower.name}</p>
                            <p className="text-[10px] text-primary font-bold truncate">@{follower.username || 'user'}</p>
                          </div>
                          
                          {isAlreadyMember ? (
                            <span className="text-xs text-primary flex items-center gap-1 font-bold"><Check size={14}/> Added</span>
                          ) : (
                            <button 
                              onClick={() => addMemberToGroup(follower.id)}
                              disabled={isAddingMember}
                              className="btn-primary py-1 px-3 text-xs rounded flex items-center gap-1"
                            >
                              <UserPlus size={12}/> Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
              </div>
            </div>
            
            <button onClick={() => setShowMembersModal(false)} className="btn-outline w-full py-2 mt-4">Done</button>
          </div>
        </div>
      )}

      {/* CREATE COMMUNITY MODAL */}
      {showCreateCommunity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateCommunity} className="card p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-header">Create Private Community</h3>
            <p className="text-xs text-body -mt-2">Groups are private. You can add your followers later.</p>
            <input 
              className="app-input"
              placeholder="e.g. CSM 2-2"
              value={newCommunityName}
              onChange={e => setNewCommunityName(e.target.value)}
              autoFocus
              required
            />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowCreateCommunity(false)} className="btn-outline flex-1 py-2">Cancel</button>
              <button type="submit" className="btn-primary flex-1 py-2">Create</button>
            </div>
          </form>
        </div>
      )}

      {/* SHARE RESOURCE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleShare} className="card p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-header">Share Resource</h3>
            
            <input 
              className="app-input" placeholder="Subject Name (e.g. AI)" required
              value={shareData.subject_name} onChange={e => setShareData({...shareData, subject_name: e.target.value})}
            />
            <input 
              className="app-input" placeholder="Title (e.g. Unit 1 Notes)" required
              value={shareData.title} onChange={e => setShareData({...shareData, title: e.target.value})}
            />
            
            <select 
              className="app-input" required
              value={shareData.type} onChange={e => setShareData({...shareData, type: e.target.value})}
            >
              <option value="pdf">PDF File</option>
              <option value="question_paper">Question Paper (PDF/Img)</option>
              <option value="chat">AI Chat Link</option>
            </select>

            {shareData.type === 'chat' ? (
              <input 
                className="app-input" placeholder="Paste AI Chat URL..." required type="url"
                value={shareData.url} onChange={e => setShareData({...shareData, url: e.target.value})}
              />
            ) : (
              <input 
                type="file" accept="application/pdf,image/*" required className="app-input text-xs"
                onChange={e => setShareData({...shareData, file: e.target.files[0]})}
              />
            )}

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowShareModal(false)} className="btn-outline flex-1 py-2">Cancel</button>
              <button type="submit" disabled={isUploading} className="btn-primary flex-1 py-2 flex items-center justify-center gap-2">
                {isUploading ? 'Uploading...' : <><Send size={16}/> Post</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IMPORT RESOURCE MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-header">Import Resource</h3>
            <p className="text-sm text-body">
              Where do you want to save <strong>{importingPost?.title}</strong>?
            </p>
            <select 
              className="app-input"
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
            >
              <option value="">-- Select Your Subject --</option>
              {mySubjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.semName} - {sub.name}</option>
              ))}
            </select>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowImportModal(false)} className="btn-outline flex-1 py-2">Cancel</button>
              <button onClick={executeImport} className="btn-primary flex-1 py-2 flex items-center justify-center gap-1">
                <Download size={16}/> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Community Modal */}
      {showEditCommunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-4 border-b flex justify-between items-center" style={{borderColor: 'rgba(107,168,152,0.15)'}}>
              <h3 className="font-bold text-lg text-aberration" style={{color: '#2D4A3E'}}>Edit Community</h3>
              <button onClick={() => setShowEditCommunity(false)} className="p-1 rounded-full hover:bg-gray-100" style={{color: '#5E7A6E'}}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditCommunity} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#5E7A6E'}}>Group Name</label>
                <input
                  type="text" value={editCommunityName} onChange={e => setEditCommunityName(e.target.value)}
                  className="app-input" required placeholder="e.g. CSE A Sec"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#5E7A6E'}}>Group Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setEditCommunityAvatar(e.target.files[0])}
                  className="app-input"
                />
              </div>
              <button type="submit" disabled={isEditingCommunity} className="btn-primary w-full py-3">
                {isEditingCommunity ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
