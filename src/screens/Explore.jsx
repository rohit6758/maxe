import { toast } from '../context/ToastContext';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Plus, MessageSquare, FileText, Download, Trash2, ArrowLeft, Send, Layers, User, Users, Check, UserPlus, X, Lock, Image as ImageIcon, Search } from 'lucide-react';
import UserProfilePopup from '../components/UserProfilePopup';
import ImageCropper from '../components/ImageCropper';
import VerifiedBadge from '../components/VerifiedBadge';

export default function Explore() {
  const { session, userProfile } = useAppContext();
  const isAdmin = session?.user?.email === 'rohitnxtgengw@gmail.com';

  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [joinRequestStatus, setJoinRequestStatus] = useState(null);
  const [posts, setPosts] = useState([]);
  const [communityView, setCommunityView] = useState('resources');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatProfiles, setChatProfiles] = useState({});
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const chatChannelRef = useRef(null);
  const typingTimerRef = useRef(null);
  const typingStopTimerRef = useRef(null);
  const chatInputRef = useRef(null);
  const chatScrollRef = useRef(null);
  const chatBottomRef = useRef(null);
  const chatChannelReadyRef = useRef(false);
  const shouldFollowChatRef = useRef(true);
  const previousChatCountRef = useRef(0);
  const [myMemberships, setMyMemberships] = useState({});

  // Modals / Forms
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [editCommunityName, setEditCommunityName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);

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
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [myFollowers, setMyFollowers] = useState([]);
  
  const [followingMap, setFollowingMap] = useState({});
  const [selectedUser, setSelectedUser] = useState(null); // For Popup
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [communityRequests, setCommunityRequests] = useState([]);

  const isCurrentMember = selectedCommunity ? (myMemberships[selectedCommunity.id] || isAdmin) : false;
  const isCommunityAdmin = selectedCommunity ? (selectedCommunity.created_by === session?.user?.id || myMemberships[selectedCommunity.id] === 'admin' || isAdmin) : false;


  useEffect(() => {
    if (session && userProfile?.college) {
      loadCommunities();
      loadMySubjects();
      
      const memberChannel = supabase.channel(`my_memberships_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'community_members', filter: `user_id=eq.${session.user.id}` }, payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
             setMyMemberships(prev => ({ ...prev, [payload.new.community_id]: payload.new.role }));
          } else if (payload.eventType === 'DELETE') {
             setMyMemberships(prev => {
                const newMap = {...prev};
                delete newMap[payload.old.community_id];
                return newMap;
             });
          }
        })
        .subscribe();
        
      return () => { supabase.removeChannel(memberChannel); };
    }
  }, [session, userProfile]);

  useEffect(() => {
    if (selectedCommunity) {
      const isMember = myMemberships[selectedCommunity.id] || isAdmin;
      if (isMember) {
        loadPosts(selectedCommunity.id);
        loadChatMessages(selectedCommunity.id);
        
        const channel = supabase.channel(`community_posts_${Date.now()}`)
          .on('broadcast', { event: 'typing' }, ({ payload }) => {
            if (!payload?.userId || payload.userId === session.user.id) return;
            if (payload.state === 'stopped') {
              setTypingUsers(prev => {
                const next = { ...prev };
                delete next[payload.userId];
                return next;
              });
              return;
            }
            setTypingUsers(prev => ({ ...prev, [payload.userId]: payload.name || 'Member' }));
            setChatProfiles(prev => ({
              ...prev,
              [payload.userId]: {
                ...(prev[payload.userId] || {}),
                id: payload.userId,
                name: payload.name || 'Member',
                username: payload.username,
                avatar_url: payload.avatarUrl
              }
            }));
            window.clearTimeout(typingTimerRef.current);
            typingTimerRef.current = window.setTimeout(() => setTypingUsers(prev => {
              const next = { ...prev };
              delete next[payload.userId];
              return next;
            }), 2200);
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts', filter: `community_id=eq.${selectedCommunity.id}` }, payload => {
            fetchSinglePost(payload.new.id);
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_posts' }, payload => {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id));
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages', filter: `community_id=eq.${selectedCommunity.id}` }, async payload => {
            const cachedSender = chatProfiles[payload.new.user_id];
            if (!cachedSender?.avatar_url) {
              const { data: sender } = await supabase.from('profiles').select('id, name, username, avatar_url').eq('id', payload.new.user_id).maybeSingle();
              if (sender) setChatProfiles(prev => ({ ...prev, [sender.id]: sender }));
            }
            setChatMessages(prev => prev.some(item => item.id === payload.new.id) ? prev : [...prev, payload.new]);
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'communities', filter: `id=eq.${selectedCommunity.id}` }, payload => {
            setSelectedCommunity(prev => ({ ...prev, ...payload.new }));
            setCommunities(prev => prev.map(community => community.id === payload.new.id ? { ...community, ...payload.new } : community));
          })
          .subscribe(status => {
            chatChannelReadyRef.current = status === 'SUBSCRIBED';
          });
          chatChannelRef.current = channel;
          
        const syncTimer = window.setInterval(() => loadChatMessages(selectedCommunity.id), 1500);
        return () => {
          window.clearInterval(syncTimer);
          chatChannelRef.current = null;
          chatChannelReadyRef.current = false;
          window.clearTimeout(typingStopTimerRef.current);
          supabase.removeChannel(channel);
        };
      }
    }
  }, [selectedCommunity, myMemberships, isAdmin]);

  useEffect(() => {
    if (selectedCommunity && communityView === 'chat') {
      window.requestAnimationFrame(() => chatInputRef.current?.focus());
    }
  }, [selectedCommunity, communityView]);

  useEffect(() => {
    if (!selectedCommunity || communityView !== 'chat') return;
    previousChatCountRef.current = 0;
    shouldFollowChatRef.current = true;
  }, [selectedCommunity, communityView]);

  useEffect(() => {
    if (!selectedCommunity || communityView !== 'chat') return;
    const countChanged = chatMessages.length !== previousChatCountRef.current;
    previousChatCountRef.current = chatMessages.length;
    if (countChanged && shouldFollowChatRef.current) {
      window.requestAnimationFrame(() => {
        const element = chatScrollRef.current;
        if (element) element.scrollTop = element.scrollHeight;
      });
    }
  }, [chatMessages, selectedCommunity, communityView]);

  useEffect(() => {
    if (!selectedCommunity || communityView !== 'chat' || !chatScrollRef.current) return;
    const observer = new ResizeObserver(() => {
      if (shouldFollowChatRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    });
    observer.observe(chatScrollRef.current);
    return () => observer.disconnect();
  }, [selectedCommunity, communityView]);

  useEffect(() => {
    const chatActive = Boolean(selectedCommunity && communityView === 'chat');
    document.documentElement.classList.toggle('maxe-chat-active', chatActive);
    return () => document.documentElement.classList.remove('maxe-chat-active');
  }, [selectedCommunity, communityView]);

  useEffect(() => {
    if (selectedCommunity && !isCurrentMember) {
      const checkRequest = async () => {
        try {
          const { data, error } = await supabase.from('community_requests').select('status').match({ community_id: selectedCommunity.id, user_id: session.user.id }).order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (data) setJoinRequestStatus(data.status);
          else setJoinRequestStatus(null);
        } catch (err) {}
      };
      checkRequest();

      const channel = supabase.channel(`user_request_status_${Date.now()}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'community_requests', filter: `community_id=eq.${selectedCommunity.id}` }, payload => {
           if (payload.new.user_id === session?.user?.id) {
             setJoinRequestStatus(payload.new.status);
             if (payload.new.status === 'accepted') {
                toast("Your join request was accepted!");
                setMyMemberships(prev => ({ ...prev, [selectedCommunity.id]: 'member' }));
             } else if (payload.new.status === 'rejected') {
                toast("Your join request was declined.", "error");
             }
           }
        }).subscribe();
        
      return () => { supabase.removeChannel(channel); };
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

  const fetchSinglePost = async (id) => {
    const { data } = await supabase.from('community_posts').select('*, profiles(name, username, avatar_url)').eq('id', id).single();
    if (data) setPosts(prev => [data, ...prev]);
  };

  const loadCommunities = async () => {
    setIsLoadingCommunities(true);
    // Show all communities so user knows they exist
    let query = supabase.from('communities').select('*').order('created_at', { ascending: false });
    if (!isAdmin) {
      query = query.eq('college', userProfile?.college);
    }
    const { data: allCommunities } = await query;
    
    // Check which ones we are members of
    const { data: memberData } = await supabase.from('community_members').select('community_id, role').eq('user_id', session.user.id);
    const map = {};
    if (memberData) {
      memberData.forEach(m => { map[m.community_id] = m.role; });
    }
    
    
    const hasBranchName = (name) => {
      const n = (name || '').toLowerCase();
      return n.includes('csm') || n.includes('cse') || n.includes('it') || n.includes('ece') || n.includes('eee') || n.includes('mech') || n.includes('civil') || n.includes('ds');
    };
    
    const visibleCommunities = (allCommunities || []).filter(c => {
      if (isAdmin) return true;
      if (!hasBranchName(c.name)) return false;
      if (map[c.id]) return true; // Member
      return hasBranchName(c.name);
    });
    setCommunities(visibleCommunities);

    setMyMemberships(map);
    setIsLoadingCommunities(false);
  };

  const loadChatMessages = async (communityId) => {
    const { data, error } = await supabase
      .from('community_messages')
      .select('id, community_id, user_id, content, created_at')
      .eq('community_id', communityId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) {
      if (error.code !== 'PGRST205') console.error('Failed to load community chat', error);
      setChatMessages([]);
      return;
    }
    setChatMessages(data || []);
    if (userProfile?.id) setChatProfiles(prev => ({ ...prev, [userProfile.id]: userProfile }));
    const senderIds = [...new Set((data || []).map(message => message.user_id))];
    if (senderIds.length > 0) {
      const { data: senders } = await supabase.from('profiles').select('id, name, username, avatar_url').in('id', senderIds);
      const profileMap = {};
      (senders || []).forEach(sender => { profileMap[sender.id] = sender; });
      setChatProfiles(profileMap);
    } else {
      setChatProfiles({});
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    const content = chatInput.trim();
    if (!content || !selectedCommunity || isSendingChat) return;
    setIsSendingChat(true);
    const optimisticId = `pending-${crypto.randomUUID()}`;
    const optimisticMessage = {
      id: optimisticId,
      community_id: selectedCommunity.id,
      user_id: session.user.id,
      content,
      created_at: new Date().toISOString(),
      pending: true
    };
    setChatMessages(prev => [...prev, optimisticMessage]);
    setChatProfiles(prev => ({ ...prev, [session.user.id]: userProfile }));
    setChatInput('');
    const { error } = await supabase.from('community_messages').insert([{
      community_id: selectedCommunity.id,
      user_id: session.user.id,
      content
    }]);
    if (error) {
      setChatMessages(prev => prev.filter(message => message.id !== optimisticId));
      if (error.code === 'PGRST205') toast('Community chat needs the Supabase table setup shown in the deployment notes.', 'error');
      else toast(`Could not send message: ${error.message}`, 'error');
    } else {
      await loadChatMessages(selectedCommunity.id);
      const { data: members } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', selectedCommunity.id);
      const notifications = (members || [])
        .filter(member => member.user_id !== session.user.id)
        .map(member => ({
          user_id: member.user_id,
          content: `@${userProfile?.username || 'someone'} sent a message in ${selectedCommunity.name}`,
          is_read: false
        }));
      if (notifications.length > 0) {
        const { error: notificationError } = await supabase.from('notifications').insert(notifications);
        if (notificationError) console.error('Failed to notify community members', notificationError);
      }
    }
    setIsSendingChat(false);
  };

  const loadPosts = async (communityId) => {
    setIsLoadingPosts(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error(postsError);
        setPosts([]);
        setIsLoadingPosts(false);
        return;
      }

      let fetchedPosts = postsData || [];
      if (fetchedPosts.length > 0) {
        const userIds = [...new Set(fetchedPosts.map(p => p.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .in('id', userIds);
          
        const profileMap = {};
        if (profilesData) {
          profilesData.forEach(p => { profileMap[p.id] = p; });
        }
        
        fetchedPosts = fetchedPosts.map(p => ({
          ...p,
          profiles: profileMap[p.user_id] || null
        }));
      }

      setPosts(fetchedPosts);
    } catch (e) {
      console.error(e);
      setPosts([]);
    }
    setIsLoadingPosts(false);
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
    const { data, error } = await supabase.from('communities').insert([{ 
      name: newCommunityName.trim(), 
      created_by: session.user.id,
      college: userProfile?.college 
    }]).select();
    if (error) toast(error.message);
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
        const filePath = `community/${session.user.id}/${Date.now()}-${shareData.file.name}`;
        const { error: uploadError } = await supabase.storage.from('pdfs').upload(filePath, shareData.file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(filePath);
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
      
      try {
        const { data: mems } = await supabase.from('community_members').select('user_id').eq('community_id', selectedCommunity.id);
        if (mems) {
          const notifs = mems.filter(m => m.user_id !== session.user.id).map(m => ({
            user_id: m.user_id,
            content: `@${userProfile?.username || 'someone'} posted new material in ${selectedCommunity.name}`,
            is_read: false
          }));
          if (notifs.length > 0) {
            const { error: notificationError } = await supabase.from('notifications').insert(notifs);
            if (notificationError) throw notificationError;
          }
        }
      } catch (e) { console.error("Notification failed", e); }
      setShowShareModal(false);
      setShareData({ subject_name: '', title: '', type: 'pdf', url: '', file: null });
    } catch (err) {
      toast(err.message);
    }
    setIsUploading(false);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    const { error } = await supabase.from('community_posts').delete().eq('id', postId);
    if (error) toast(error.message);
    else setPosts(posts.filter(p => p.id !== postId));
  };

  const handleUpdateGroupName = async () => {
    if (!editCommunityName.trim() || editCommunityName === selectedCommunity.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingInfo(true);
    try {
      const { error } = await supabase.from('communities').update({ name: editCommunityName.trim() }).eq('id', selectedCommunity.id);
      if (error) throw error;
      const updated = { ...selectedCommunity, name: editCommunityName.trim() };
      setCommunities(communities.map(c => c.id === selectedCommunity.id ? updated : c));
      setSelectedCommunity(updated);
      await notifyCommunityMembers(`@${userProfile?.username || 'someone'} updated the group profile in ${updated.name}`);
      setIsEditingName(false);
    } catch(e) { toast(e.message); }
    setIsSavingInfo(false);
  };

  const handleSelectGroupAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => setCropImageSrc(reader.result));
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleUpdateGroupAvatar = async (file) => {
    setCropImageSrc(null);
    if (!file) return;
    setIsSavingInfo(true);
    try {
      const fileName = `avatar_${selectedCommunity.id}_${Math.random()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(`community_avatars/${fileName}`, file, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(`community_avatars/${fileName}`);
      const { error } = await supabase.from('communities').update({ avatar_url: publicUrl }).eq('id', selectedCommunity.id);
      if (error) throw error;
      
      const updated = { ...selectedCommunity, avatar_url: publicUrl };
      setCommunities(communities.map(c => c.id === selectedCommunity.id ? updated : c));
      setSelectedCommunity(updated);
      await notifyCommunityMembers(`@${userProfile?.username || 'someone'} updated the group profile in ${updated.name}`);
    } catch(err) { toast(err.message); }
    setIsSavingInfo(false);
  };

  const notifyCommunityMembers = async (content) => {
    if (!selectedCommunity || !session?.user?.id) return;
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', selectedCommunity.id);
    if (membersError) {
      console.error('Could not load community members for notification', membersError);
      return;
    }
    const notifications = (members || [])
      .filter(member => member.user_id !== session.user.id)
      .map(member => ({ user_id: member.user_id, content, is_read: false, type: 'community_profile' }));
    if (notifications.length) {
      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) console.error('Could not notify community members', error);
    }
  };

  const handleDeleteCommunity = async (communityId, e) => {
    e.stopPropagation();
    if (!window.confirm('WARNING: Delete this entire community group and all its posts?')) return;
    const { error } = await supabase.from('communities').delete().eq('id', communityId);
    if (error) toast(error.message);
    else {
      setCommunities(communities.filter(c => c.id !== communityId));
      if (selectedCommunity?.id === communityId) setSelectedCommunity(null);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!selectedCommunity || !session?.user?.id) return;
    if (!window.confirm(`Leave ${selectedCommunity.name}?`)) return;
    const { error } = await supabase.from('community_members')
      .delete()
      .match({ community_id: selectedCommunity.id, user_id: session.user.id });
    if (error) return toast(`Could not leave group: ${error.message}`);
    setMyMemberships(prev => {
      const next = { ...prev };
      delete next[selectedCommunity.id];
      return next;
    });
    setShowGroupInfo(false);
    setSelectedCommunity(null);
  };

  const initiateImport = (post) => {
    setImportingPost(post);
    setShowImportModal(true);
    setSelectedSubjectId('');
  };

  const executeImport = async () => {
    if (!selectedSubjectId) return toast('Select a subject to import to');
    try {
      const { error } = await supabase.from('resources').insert([{
        subject_id: selectedSubjectId,
        title: importingPost.title,
        url: importingPost.url,
        type: importingPost.type,
        size: importingPost.size
      }]);
      if (error) throw error;
      toast('Imported successfully!');
      setShowImportModal(false);
    } catch (err) {
      toast(err.message);
    }
  };

  // --- Members Management ---
  const openMembersModal = async () => {
    setShowMembersModal(true);
    setIsLoadingMembers(true);
    setMemberSearch('');
    setHasSearched(false);
    setMemberSearchResults([]);

    // Fetch all member rows
    const { data: membersData } = await supabase
      .from('community_members')
      .select('community_id, user_id, role')
      .eq('community_id', selectedCommunity.id);

    let mems = membersData || [];

    // Fetch all member profiles in one query
    if (mems.length > 0) {
      const ids = mems.map(m => m.user_id);
      const { data: profilesData } = await supabase.from('profiles').select('id, name, username, avatar_url').in('id', ids);
      const profileMap = {};
      (profilesData || []).forEach(p => { profileMap[p.id] = p; });
      mems = mems.map(m => ({ ...m, profiles: profileMap[m.user_id] || null }));
    }

    // Ensure Creator is always in the list
    if (selectedCommunity && !mems.some(m => m.user_id === selectedCommunity.created_by)) {
      const { data: creatorProfile } = await supabase.from('profiles').select('id, name, username, avatar_url').eq('id', selectedCommunity.created_by).maybeSingle();
      if (creatorProfile) {
        mems = [{ user_id: selectedCommunity.created_by, role: 'admin', profiles: creatorProfile }, ...mems];
      }
    }

    setCommunityMembers(mems);

    const { data: myFollowing } = await supabase.from('follows').select('following_id').eq('follower_id', session.user.id);
    const map = {};
    if (myFollowing) myFollowing.forEach(f => map[f.following_id] = true);
    setFollowingMap(map);
    
    // Fetch pending requests for admins (two-step to avoid FK join issues)
    if (selectedCommunity.created_by === session?.user?.id || myMemberships[selectedCommunity.id] === 'admin' || isAdmin) {
      const { data: reqs, error: reqErr } = await supabase.from('community_requests')
        .select('id, community_id, user_id, status, created_at')
        .eq('community_id', selectedCommunity.id)
        .eq('status', 'pending');
      console.log('[Requests] raw:', reqs, reqErr);
      if (reqs && reqs.length > 0) {
        const userIds = reqs.map(r => r.user_id);
        const { data: reqProfiles } = await supabase.from('profiles').select('id, name, username, avatar_url, is_premium').in('id', userIds);
        const profileMap = {};
        (reqProfiles || []).forEach(p => { profileMap[p.id] = p; });
        setCommunityRequests(reqs.map(r => ({ ...r, profiles: profileMap[r.user_id] || null })));
      } else {
        setCommunityRequests([]);
      }
    } else {
      setCommunityRequests([]);
    }

    setIsLoadingMembers(false);
  };


  const handleAcceptRequest = async (req) => {
    try {
      await supabase.from('community_members').insert([{ community_id: req.community_id, user_id: req.user_id, role: 'member' }]);
      await supabase.from('community_requests').update({ status: 'accepted' }).eq('id', req.id);
      // Notify the user
      try { await supabase.from('notifications').insert([{ user_id: req.user_id, content: `Your request to join ${selectedCommunity?.name} was accepted! 🎉` }]); } catch(e) {}
      setCommunityRequests(prev => prev.filter(r => r.id !== req.id));
      toast('Request accepted!');
      openMembersModal(); // reload members
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleRejectRequest = async (req) => {
    try {
      await supabase.from('community_requests').update({ status: 'rejected' }).eq('id', req.id);
      // Notify the user
      try { await supabase.from('notifications').insert([{ user_id: req.user_id, content: `Your request to join ${selectedCommunity?.name} was declined.` }]); } catch(e) {}
      setCommunityRequests(prev => prev.filter(r => r.id !== req.id));
      toast('Request declined.');
    } catch (e) { toast(e.message, 'error'); }
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
      toast('Could not add member: ' + err.message);
    }
    setIsAddingMember(false);
  };

  const removeMember = async (userId) => {
    if (!window.confirm("Remove this member from the community?")) return;
    const { error } = await supabase.from('community_members').delete().match({ community_id: selectedCommunity.id, user_id: userId });
    if (error) {
      toast("Failed to remove member: " + error.message);
    } else {
      setCommunityMembers(prev => prev.filter(m => m.user_id !== userId));
    }
  };

  const promoteToAdmin = async (userId) => {
    if (!window.confirm("Make this member an admin?")) return;
    const { error } = await supabase.from('community_members').update({ role: 'admin' }).match({ community_id: selectedCommunity.id, user_id: userId });
    if (!error) setCommunityMembers(communityMembers.map(m => m.user_id === userId ? { ...m, role: 'admin' } : m));
  };

  const toggleFollow = async (userId) => {
    const isFollowing = followingMap[userId];
    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: session.user.id, following_id: userId });
      setFollowingMap(prev => ({ ...prev, [userId]: false }));
    } else {
      const { error: followError } = await supabase.from('follows').insert([{ follower_id: session.user.id, following_id: userId }]);
      if (followError) {
        console.error('Follow failed', followError);
        return;
      }
      const { error: notificationError } = await supabase.from('notifications').insert([{
        user_id: userId,
        content: `@${userProfile?.username || 'someone'} sent you a friend request`
      }]);
      if (notificationError) console.error('Notification failed', notificationError);
      setFollowingMap(prev => ({ ...prev, [userId]: true }));
    }
  };

  const getIcon = (type) => {
    if (type === 'pdf') return <FileText size={16} className="text-primary" />;
    if (type === 'chat') return <MessageSquare size={16} className="text-primary" />;
    return <FileText size={16} className="text-primary" />;
  };


  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-40px)] bg-background -m-4 md:-m-0 md:rounded-2xl overflow-hidden border border-primary/15">
      
      <div className="flex flex-1 h-full overflow-hidden">
        
        {/* LEFT PANE: Community List */}
        <div className={`w-full md:w-1/3 md:border-r border-primary/15 flex flex-col bg-surface ${selectedCommunity ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-primary/15 flex items-center justify-between bg-surface z-10">
            <h2 className="text-xl font-bold text-header">Communities</h2>
            <button aria-label="Create Community" onClick={() => setShowCreateCommunity(true)} className="btn-primary p-2 rounded-full shadow-lg">
              <Plus size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingCommunities ? (
              <div className="flex flex-col items-center justify-center p-8 mt-10 space-y-3">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="font-semibold text-primary animate-pulse text-sm">Loading communities...</p>
              </div>
            ) : communities.length === 0 ? (
              <p className="p-8 text-center text-body text-sm">No communities found. Create one!</p>
            ) : (
              communities.map(comm => (
                <button 
                  key={comm.id} 
                  onClick={() => setSelectedCommunity(comm)}
                  className={`w-full text-left p-4 border-b border-primary/15 hover:bg-primary/10 transition-colors flex items-center gap-3 ${selectedCommunity?.id === comm.id ? 'bg-primary/15' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 overflow-hidden">
                    {comm.avatar_url ? (
                      <img src={comm.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Layers size={20} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-header text-sm line-clamp-1">{comm.name}</h3>
                    <p className="text-xs text-body line-clamp-1">{myMemberships[comm.id] === 'admin' ? 'Admin' : myMemberships[comm.id] ? 'Member' : 'Private Group'}</p>
                    {isAdmin && comm.college && (
                      <span className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full inline-block mt-1">
                        {comm.college}
                      </span>
                    )}
                  </div>
                  {(isAdmin || myMemberships[comm.id] === 'admin') && (
                    <button aria-label="Delete" onClick={(e) => handleDeleteCommunity(comm.id, e)} className="text-red-400 hover:text-red-600 p-2">
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
            <div className="flex-1 flex flex-col bg-surface relative">
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
                  ) : joinRequestStatus === 'rejected' ? (
                    <>
                      <p className="text-xs text-red-500 font-bold bg-red-50 border border-red-200 rounded-xl py-2 px-3">❌ Your previous request was declined.</p>
                      <button 
                        onClick={() => { setJoinRequestStatus(null); handleRequestJoin(); }}
                        className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <UserPlus size={18} /> Request Again
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleRequestJoin}
                      className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus size={18} /> Request to Join
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-primary/15 bg-surface flex items-center gap-3 z-10 shadow-sm cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => { setEditCommunityName(selectedCommunity.name); setIsEditingName(false); setShowGroupInfo(true); }}>
                <button aria-label="Back" onClick={(e) => { e.stopPropagation(); setSelectedCommunity(null); }} className="md:hidden p-2 -ml-2 text-header">
                  <ArrowLeft size={20} />
                </button>
                
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  {selectedCommunity.avatar_url ? (
                    <img src={selectedCommunity.avatar_url} alt="Group" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{selectedCommunity.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-header text-lg truncate">{selectedCommunity.name}</h3>
                  <p className="text-xs text-primary font-medium">Secure Group</p>
                </div>
                
                {/* Tools */}
                <button onClick={(e) => { e.stopPropagation(); openMembersModal(); }} className="btn-outline text-sm flex items-center gap-1.5 py-1.5 px-3 mr-1 bg-surface">
                  <Users size={14} /> <span className="hidden sm:inline font-bold">Members</span>
                </button>

                <button onClick={(e) => { e.stopPropagation(); setShowShareModal(true); }} className="btn-primary text-sm flex items-center gap-1.5 py-1.5 px-4 shadow-sm hover:scale-105 active:scale-95 transition-transform">
                  <Plus size={14} /> <span className="font-bold">Share</span>
                </button>
              </div>

              <div className="px-4 pt-3 bg-surface border-b border-primary/10">
                <div className="flex gap-1 rounded-xl bg-background p-1">
                  {[
                    { id: 'resources', label: 'Resources' },
                    { id: 'chat', label: 'Group chat' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCommunityView(tab.id)}
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${communityView === tab.id ? 'bg-surface text-primary shadow-sm' : 'text-body'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {communityView === 'chat' ? (
                <div className="flex-1 min-h-0 flex flex-col">
                  <div
                    ref={chatScrollRef}
                    onScroll={event => {
                      const element = event.currentTarget;
                      shouldFollowChatRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
                    }}
                    className="flex-1 overflow-y-auto p-3"
                  >
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-body text-sm">
                        <MessageSquare size={32} className="mb-3 text-primary/50" />
                        <p className="font-bold text-header">Start the group conversation</p>
                        <p className="mt-1">Ask for PDFs, links, or question papers.</p>
                      </div>
                    ) : chatMessages.map((message, messageIndex) => {
                      const sender = chatProfiles[message.user_id];
                      const isMine = message.user_id === session?.user?.id;
                      const previousMessage = chatMessages[messageIndex - 1];
                      const grouped = previousMessage?.user_id === message.user_id;
                      return (
                      <div key={message.id} className={`flex items-end gap-1.5 ${isMine ? 'justify-end' : 'justify-start'} ${grouped ? 'mt-1' : 'mt-3'}`}>
                        {!isMine && (
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                            {grouped ? <span className="w-7" /> : sender?.avatar_url ? <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={14} className="text-primary" />}
                          </div>
                        )}
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${isMine ? 'bg-primary text-white rounded-br-sm' : 'bg-surface border border-primary/10 text-header rounded-bl-sm'} ${message.pending ? 'opacity-70' : ''}`}>
                          {!grouped && <p className="mb-1 text-[11px] font-black opacity-80">
                            {sender?.name || sender?.username || 'Member'}
                            {sender?.name && sender?.username ? ` · @${sender.username}` : ''}
                          </p>}
                          <p>{message.content}</p>
                          <time className="block mt-0.5 text-[10px] opacity-60">
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {message.pending ? ' · Sending…' : ''}
                          </time>
                        </div>
                        {isMine && (
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                            {grouped ? <span className="w-7" /> : sender?.avatar_url ? <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={14} className="text-primary" />}
                          </div>
                        )}
                      </div>
                      );
                    })}
                    <div ref={chatBottomRef} aria-hidden="true" className="h-px" />
                  </div>
                  {Object.keys(typingUsers).length > 0 && (
                    <div className="px-3 pb-2 flex items-end gap-1.5">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                        {(() => {
                          const typingUserId = Object.keys(typingUsers)[0];
                          const typingProfile = chatProfiles[typingUserId];
                          return typingProfile?.avatar_url
                            ? <img src={typingProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                            : <User size={14} className="text-primary" />;
                        })()}
                      </div>
                      <div className="rounded-2xl rounded-bl-sm bg-surface border border-primary/10 px-3 py-2 flex items-center gap-1">
                        <span className="text-[11px] font-black text-header mr-1">{Object.values(typingUsers)[0]}</span>
                        <i className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                        <i className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '120ms' }} />
                        <i className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '240ms' }} />
                      </div>
                    </div>
                  )}
                  <form onSubmit={sendChatMessage} className="sticky bottom-0 z-20 p-3 bg-surface border-t border-primary/10 flex gap-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                    <input
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={e => {
                        setChatInput(e.target.value);
                        if (!chatChannelReadyRef.current) return;
                        const payload = {
                          userId: session?.user?.id,
                          name: userProfile?.name || userProfile?.username || 'Member',
                          username: userProfile?.username,
                          avatarUrl: userProfile?.avatar_url,
                          state: 'typing'
                        };
                        chatChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload });
                        window.clearTimeout(typingStopTimerRef.current);
                        typingStopTimerRef.current = window.setTimeout(() => {
                          chatChannelRef.current?.send({
                            type: 'broadcast',
                            event: 'typing',
                            payload: { ...payload, state: 'stopped' }
                          });
                        }, 1200);
                      }}
                      placeholder="Ask for a PDF, link, or question paper..."
                      className="app-input flex-1"
                      maxLength={1000}
                    />
                    <button disabled={!chatInput.trim() || isSendingChat} className="btn-primary px-4 disabled:opacity-50">
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              ) : (
              /* Shared resources */
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start content-start">
                {isLoadingPosts ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-3">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="font-semibold text-primary animate-pulse text-sm">Loading posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center p-8 bg-surface rounded-xl border border-primary/15 text-body text-sm">
                    No resources shared yet. Be the first to post!
                  </div>
                ) : (
                  posts.map(post => {
                    const isMine = post.user_id === session?.user?.id;
                    const canDelete = isMine || isAdmin;

                    return (
                      <div key={post.id} className="flex flex-col h-full w-full">
                        {!isMine && (
                          <div 
                            className="flex items-center gap-2 mb-1 ml-1 cursor-pointer hover:opacity-70 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); setSelectedUser({ id: post.user_id, ...post.profiles }); }}
                          >
                            <div className="w-5 h-5 rounded-full bg-surface overflow-hidden flex items-center justify-center shrink-0 border border-primary/15">
                              {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={10} />}
                            </div>
                            <span className="text-[11px] font-bold text-body flex items-center">
                              {post.profiles?.name || 'Unknown'}
                              {post.profiles?.is_premium && <VerifiedBadge className="w-3 h-3 text-primary ml-1" />}
                            </span>
                          </div>
                        )}
                        <div className={`w-full flex-1 card p-3 space-y-2 relative shadow-sm flex flex-col ${isMine ? 'bg-[var(--theme-bg)] border-[var(--theme-primary)]/30' : 'bg-surface'}`}>
                          
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-[10px] uppercase font-bold text-primary tracking-wider px-1.5 py-0.5 rounded bg-primary/10">
                              Subject: {post.subject_name}
                            </span>
                            {canDelete && (
                              <button aria-label="Delete" onClick={() => handleDeletePost(post.id)} className="text-red-400 hover:text-red-600 p-1 -mt-1 -mr-1">
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

                          <div className="flex items-center gap-2 pt-2 mt-2 border-t border-primary/15/50">
                            <a href={post.url} target="_blank" rel="noreferrer" className="flex-1 py-1.5 text-center text-xs font-bold text-header bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors">
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
              )}
            </>
          )}
        </div>
      </div>

      {/* MEMBERS MODAL */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-5 w-full max-w-md shadow-xl shadow-primary/10 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-header flex items-center gap-2">
                <Users size={20} className="text-primary"/> Manage Members
              </h3>
              <button aria-label="Close" onClick={() => setShowMembersModal(false)}><X size={20}/></button>
            </div>
            
            <div className="overflow-y-auto space-y-4">
              {/* Pending Requests */}
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
              )}

              {/* Current Members */}
              <div>
                <p className="text-xs font-bold uppercase text-primary mb-2">Current Members ({communityMembers.length})</p>
                <div className="space-y-2">
                  {isLoadingMembers ? (
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <p className="text-xs text-body animate-pulse mt-2">Loading members...</p>
                    </div>
                  ) : communityMembers.map(m => {
                    const isFollowing = followingMap[m.user_id];
                    const isMe = m.user_id === session?.user?.id;
                    return (
                      <div key={m.user_id} onClick={() => setSelectedUser({ id: m.user_id, ...m.profiles })} className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-primary/15 cursor-pointer hover:border-primary transition-colors">
                        <div className="w-8 h-8 rounded-full bg-primary/5 overflow-hidden flex items-center justify-center shrink-0">
                          {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-header truncate flex items-center">
                            {m.profiles?.name || 'Unknown'}
                            {m.profiles?.is_premium && <VerifiedBadge className="w-3.5 h-3.5 text-primary ml-1" />}
                          </p>
                          <div className="flex gap-2 items-center">
                            <p className="text-[10px] text-primary font-bold truncate">@{m.profiles?.username || 'user'}</p>
                            {m.role === 'admin' && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Admin</span>}
                          </div>
                        </div>

                        <div className="flex gap-1 items-center shrink-0">
                          {!isMe && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleFollow(m.user_id); }}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${isFollowing ? 'bg-background text-header border border-primary/15' : 'bg-primary text-white'}`}
                            >
                              {isFollowing ? 'Following' : 'Follow'}
                            </button>
                          )}
                          
                          {isCommunityAdmin && !isMe && (
                            <>
                              {m.role !== 'admin' && (
                                <button onClick={(e) => { e.stopPropagation(); promoteToAdmin(m.user_id); }} className="px-2 py-1 text-[10px] bg-primary/5 rounded hover:bg-primary/10 font-bold text-header">Admin +</button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); removeMember(m.user_id); }} className="px-2 py-1 text-[10px] bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 font-bold">Remove</button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Members */}
              {isCommunityAdmin && (
              <div className="pt-2 border-t border-primary/15">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase text-primary">Add People</p>
                </div>
                <form onSubmit={handleMemberSearch} className="flex gap-2 mb-3">
                  <input className="app-input flex-1 text-xs" placeholder="Search by name or @username..." value={memberSearch} onChange={e => {
                    setMemberSearch(e.target.value);
                    if (!e.target.value.trim()) { setHasSearched(false); setMemberSearchResults([]); }
                  }} />
                  <button aria-label="Search" type="submit" className="btn-primary p-2 rounded-xl"><Search size={14}/></button>
                </form>

                <div className="space-y-2">
                  {hasSearched && memberSearchResults.length === 0 && <p className="text-xs text-body italic text-center py-2">No people found.</p>}
                  {hasSearched && memberSearchResults.map(person => {
                      const isAlreadyMember = communityMembers.some(m => m.user_id === person.id);
                      if (isAlreadyMember) return null;
                      return (
                        <div key={person.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface border border-primary/15">
                          <div className="w-8 h-8 rounded-full bg-primary/5 overflow-hidden flex items-center justify-center shrink-0">
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
              </div>
              )}
            </div>
            
            <button aria-label="Close" onClick={() => setShowMembersModal(false)} className="btn-outline w-full py-2 mt-4">Done</button>
            {isCurrentMember && (
              <button onClick={handleLeaveCommunity} className="w-full py-2 mt-2 rounded-xl border border-red-200 text-red-500 font-bold text-sm">
                Leave group
              </button>
            )}
          </div>
        </div>
      )}

      {/* CREATE COMMUNITY MODAL */}
      {showCreateCommunity && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateCommunity} className="card p-5 w-full max-w-sm space-y-4 shadow-xl shadow-primary/10">
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleShare} className="card p-5 w-full max-w-sm space-y-4 shadow-xl shadow-primary/10">
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-5 w-full max-w-sm space-y-4 shadow-xl shadow-primary/10">
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

      {/* Group Info Modal (WhatsApp Style) */}
      {showGroupInfo && selectedCommunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowGroupInfo(false)}>
          <div className="bg-surface rounded-3xl w-full max-w-sm overflow-hidden shadow-xl shadow-primary/10 animate-slide-up border border-primary/15" onClick={e => e.stopPropagation()}>
            <div className="relative">
              {/* Big Avatar */}
              <div className="w-full aspect-square bg-primary flex items-center justify-center relative">
                {selectedCommunity.avatar_url ? (
                  <img src={selectedCommunity.avatar_url} className="w-full h-full object-cover" alt="Group" />
                ) : (
                  <span className="text-white font-black text-6xl">{selectedCommunity.name.charAt(0).toUpperCase()}</span>
                )}
                
                {/* Pencil Edit Avatar (Any member can edit) */}
                {isCurrentMember && (
                  <label className="absolute bottom-4 right-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform text-white">
                    {isSavingInfo ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ImageIcon size={20} />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleSelectGroupAvatar} disabled={isSavingInfo} />
                  </label>
                )}
                
                <button aria-label="Close" onClick={() => setShowGroupInfo(false)} className="absolute top-4 right-4 p-2 bg-primary/50 text-white rounded-full hover:bg-black/70">
                  <X size={20} />
                </button>
              </div>

              {/* Group Name & Edit Name */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-primary font-bold tracking-widest uppercase mb-1">Group Name</p>
                    {isEditingName ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={editCommunityName} 
                          onChange={e => setEditCommunityName(e.target.value)}
                          className="app-input flex-1 py-1 px-2" 
                          autoFocus
                        />
                        <button onClick={handleUpdateGroupName} className="btn-primary px-3 rounded-lg text-sm">{isSavingInfo ? '...' : 'Save'}</button>
                      </div>
                    ) : (
                      <h2 className="text-2xl font-black text-header leading-tight">{selectedCommunity.name}</h2>
                    )}
                  </div>
                  {isCurrentMember && !isEditingName && (
                    <button onClick={() => setIsEditingName(true)} className="p-2 bg-surface border border-primary/15 rounded-full text-body hover:text-primary mt-4">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                    </button>
                  )}
                </div>
                
                <div className="mt-8 space-y-3">
                  <button onClick={() => { setShowGroupInfo(false); openMembersModal(); }} className="w-full flex items-center gap-3 p-4 bg-background rounded-2xl border border-primary/15 hover:border-primary transition-colors text-header font-bold text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Users size={16} /></div>
                    View all Members
                  </button>
                  {isCurrentMember && (
                    <button onClick={handleLeaveCommunity} className="w-full p-3 rounded-2xl border border-red-200 text-red-500 font-bold text-sm hover:bg-red-50">
                      Leave group
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Selected User Popup (Instagram Style) */}
      {selectedUser && (
        <UserProfilePopup 
          userId={selectedUser.id} 
          onClose={() => setSelectedUser(null)} 
          currentUserId={session?.user?.id}
          onFollowChange={(id, isFollowing) => {
            setFollowingMap(prev => ({ ...prev, [id]: isFollowing }));
          }}
        />
      )}

      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          aspectRatio={1}
          onCropComplete={handleUpdateGroupAvatar}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
}
