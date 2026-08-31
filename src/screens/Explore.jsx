import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Plus, MessageSquare, FileText, Download, Trash2, ArrowLeft, Send, Link as LinkIcon, User, Layers } from 'lucide-react';

export default function Explore() {
  const { session, userProfile } = useAppContext();
  const isAdmin = session?.user?.email === 'rohitnxtgengw@gmail.com';

  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [posts, setPosts] = useState([]);

  // Modals / Forms
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState({ subject_name: '', title: '', type: 'pdf', url: '', file: null });
  const [isUploading, setIsUploading] = useState(false);

  // Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importingPost, setImportingPost] = useState(null);
  const [mySubjects, setMySubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  useEffect(() => {
    if (session) {
      loadCommunities();
      loadMySubjects();
    }
  }, [session]);

  useEffect(() => {
    if (selectedCommunity) {
      loadPosts(selectedCommunity.id);
      
      // Realtime subscription for WhatsApp-like feel
      const channel = supabase.channel('community_posts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts', filter: `community_id=eq.${selectedCommunity.id}` }, payload => {
          // Fetch the full post with profile to append to state
          fetchSinglePost(payload.new.id);
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_posts' }, payload => {
          setPosts(prev => prev.filter(p => p.id !== payload.old.id));
        })
        .subscribe();
        
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedCommunity]);

  const fetchSinglePost = async (id) => {
    const { data } = await supabase.from('community_posts').select('*, profiles(name, avatar_url)').eq('id', id).single();
    if (data) setPosts(prev => [data, ...prev]);
  };

  const loadCommunities = async () => {
    const { data } = await supabase.from('communities').select('*').order('created_at', { ascending: false });
    if (data) setCommunities(data);
  };

  const loadPosts = async (communityId) => {
    const { data } = await supabase
      .from('community_posts')
      .select('*, profiles(name, avatar_url)')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false }); // descending because feed, but whatsapp is usually bottom-up. We'll do top-down for now.
    if (data) setPosts(data);
  };

  const loadMySubjects = async () => {
    // We need the user's subjects grouped by semester
    const { data: sems } = await supabase.from('semesters').select('id, name').eq('user_id', session.user.id);
    if (!sems || sems.length === 0) return;
    const { data: subs } = await supabase.from('subjects').select('id, name, semester_id').in('semester_id', sems.map(s => s.id));
    
    // Attach semester name to subject for dropdown
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
      setCommunities([data[0], ...communities]);
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
        title: importingPost.title, // Keep original title or add tag?
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

  const getIcon = (type) => {
    if (type === 'pdf') return <FileText size={16} className="text-primary" />;
    if (type === 'chat') return <MessageSquare size={16} className="text-primary" />;
    return <FileText size={16} className="text-primary" />;
  };

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
              <p className="p-8 text-center text-body text-sm">No communities yet. Create one!</p>
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
                  <div>
                    <h3 className="font-bold text-header text-base">{comm.name}</h3>
                    <p className="text-xs text-body line-clamp-1">Tap to view shared resources</p>
                  </div>
                  {isAdmin && (
                    <button onClick={(e) => handleDeleteCommunity(comm.id, e)} className="ml-auto text-red-400 hover:text-red-600 p-2">
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
              <p className="text-body font-medium">Select a community to view resources</p>
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
                  <p className="text-xs text-primary font-medium">Community Group</p>
                </div>
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
                            <div className="w-5 h-5 rounded-full bg-divider overflow-hidden flex items-center justify-center shrink-0">
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

      {/* CREATE COMMUNITY MODAL */}
      {showCreateCommunity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateCommunity} className="card p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-header">Create Community</h3>
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

    </div>
  );
}
