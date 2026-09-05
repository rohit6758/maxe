import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, User, ArrowLeft, UserPlus, Check } from 'lucide-react';
import VerifiedBadge from './VerifiedBadge';
import AvatarDecoration from './AvatarDecoration';
import { useAppContext } from '../context/AppContext';

export default function UserProfilePopup({ userId, onClose, currentUserId, onFollowChange }) {
  const { profileEffects } = useAppContext();
  const [profile, setProfile] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 'profile' | 'followers' | 'following'
  const [viewMode, setViewMode] = useState('profile');
  const [listUsers, setListUsers] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [myFollowingMap, setMyFollowingMap] = useState({});
  const [viewingAvatar, setViewingAvatar] = useState(false);

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

  useEffect(() => {
    if (viewMode === 'followers') loadFollowers();
    if (viewMode === 'following') loadFollowing();
  }, [viewMode]);

  const loadData = async () => {
    setLoading(true);
    
    // Fetch profile
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (p) setProfile(p);

    // Fetch counts
    const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
    const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);

    // Check if current user is following them
    if (currentUserId && currentUserId !== userId) {
      const { data: f } = await supabase.from('follows').select('*').match({ follower_id: currentUserId, following_id: userId }).maybeSingle();
      setIsFollowing(!!f);
    }
    
    // Load my following map so we can show buttons in the lists
    if (currentUserId) {
      const { data: myF } = await supabase.from('follows').select('following_id').eq('follower_id', currentUserId);
      const map = {};
      if (myF) myF.forEach(x => map[x.following_id] = true);
      setMyFollowingMap(map);
    }

    setLoading(false);
  };

  const loadFollowers = async () => {
    setLoadingList(true);
    const { data } = await supabase.from('follows').select('follower_id').eq('following_id', userId);
    if (data && data.length > 0) {
      const ids = data.map(d => d.follower_id);
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
      setListUsers(profiles || []);
    } else {
      setListUsers([]);
    }
    setLoadingList(false);
  };

  const loadFollowing = async () => {
    setLoadingList(true);
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
    if (data && data.length > 0) {
      const ids = data.map(d => d.following_id);
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
      setListUsers(profiles || []);
    } else {
      setListUsers([]);
    }
    setLoadingList(false);
  };

  const toggleFollow = async () => {
    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: userId });
      setIsFollowing(false);
      setFollowerCount(prev => prev - 1);
      if (onFollowChange) onFollowChange(userId, false);
    } else {
      await supabase.from('follows').insert([{ follower_id: currentUserId, following_id: userId }]);
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
      if (onFollowChange) onFollowChange(userId, true);
    }
  };

  const toggleListFollow = async (e, targetUserId) => {
    e.stopPropagation();
    const isTargetFollowing = myFollowingMap[targetUserId];
    if (isTargetFollowing) {
      await supabase.from('follows').delete().match({ follower_id: currentUserId, following_id: targetUserId });
      setMyFollowingMap(prev => ({ ...prev, [targetUserId]: false }));
      if (targetUserId === userId) setIsFollowing(false); // sync main profile button if they unfollow from list
    } else {
      await supabase.from('follows').insert([{ follower_id: currentUserId, following_id: targetUserId }]);
      setMyFollowingMap(prev => ({ ...prev, [targetUserId]: true }));
      if (targetUserId === userId) setIsFollowing(true); // sync main profile button
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 bg-white/40 backdrop-blur-md animate-fade-in" onClick={onClose}>
      
      <div className="relative w-full max-w-sm card overflow-hidden shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-primary/10">
          <div className="flex items-center gap-2">
            {viewMode !== 'profile' && (
              <button onClick={() => setViewMode('profile')} className="p-1 -ml-2 text-primary hover:bg-primary/5 rounded-full transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            <h3 className="font-bold text-header text-base truncate">
              {viewMode === 'profile' ? `@${profile?.username || 'user'}` : viewMode === 'followers' ? 'Followers' : 'Following'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-body hover:text-primary transition-colors rounded-full bg-primary/5">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-primary animate-pulse">Loading profile...</p>
          </div>
        ) : viewMode === 'profile' ? (
          <div className="p-6 relative">
            {profile?.is_premium && profileEffects?.banner === 'gradient' && (
              <div className="absolute top-0 left-0 right-0 h-32 nitro-bg opacity-30 pointer-events-none rounded-t-xl" style={{maskImage: 'linear-gradient(to bottom, black, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)'}}></div>
            )}
            
            {/* Top section: Avatar + Stats */}
            <div className="flex items-center gap-6 mb-6 relative z-10">
              <div 
                className={`w-24 h-24 rounded-full border-4 ${profile?.is_premium ? 'border-transparent bg-gradient-to-tr from-primary to-accent p-1' : 'border-primary/20'} overflow-hidden flex items-center justify-center shrink-0 cursor-pointer shadow-lg relative`}
                onClick={() => profile?.avatar_url && setViewingAvatar(true)}
              >
                {profile?.is_premium && profileEffects?.avatar !== 'none' && (
                  <AvatarDecoration type={profileEffects?.avatar} />
                )}
                <div className="w-full h-full rounded-full overflow-hidden bg-primary/5">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    <User size={40} className="text-primary/50 m-auto mt-4" />
                  )}
                </div>
              </div>
              
              <div className="flex-1 flex justify-around items-center">
                <div className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setViewMode('followers')}>
                  <span className="font-extrabold text-header text-2xl">{followerCount}</span>
                  <span className="text-[11px] font-bold text-body tracking-wider uppercase">Followers</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setViewMode('following')}>
                  <span className="font-extrabold text-header text-2xl">{followingCount}</span>
                  <span className="text-[11px] font-bold text-body tracking-wider uppercase">Following</span>
                </div>
              </div>
            </div>

            {/* Middle section: Info */}
            <div className="space-y-1.5 mb-6">
              <h2 className="text-lg font-bold text-header flex items-center">
                {profile?.name || 'Unknown User'}
                {profile?.is_premium && <VerifiedBadge />}
              </h2>
              {profile?.branch && <p className="text-sm font-bold text-primary">{profile.branch}</p>}
              {profile?.bio && <p className="text-sm text-body whitespace-pre-wrap mt-3 leading-relaxed">{profile.bio}</p>}
            </div>

            {/* Bottom section: Action */}
            {currentUserId && currentUserId !== userId && (
              <button 
                onClick={toggleFollow}
                className={`w-full py-3.5 rounded-full text-sm font-extrabold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${isFollowing ? 'bg-background text-header border-2 border-primary/20' : 'bg-gradient-to-r from-[#8ED0BF] to-[#7BB8A8] text-white'}`}
              >
                {isFollowing ? 'Following' : 'Follow back'}
              </button>
            )}
          </div>
        ) : (
          <div className="h-[400px] overflow-y-auto p-4 space-y-3">
             {loadingList ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
             ) : listUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-body text-sm font-semibold">
                  No {viewMode} yet.
                </div>
             ) : (
                listUsers.map(u => {
                  const isListFollowing = myFollowingMap[u.id];
                  const isMe = u.id === currentUserId;
                  return (
                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-primary/10 hover:border-primary/30 transition-colors">
                      <div className="w-10 h-10 rounded-full border border-primary/15 overflow-hidden flex items-center justify-center shrink-0 bg-primary/5">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <User size={16} className="text-primary/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-header truncate">{u.name}</p>
                        <p className="text-xs font-semibold text-primary truncate">@{u.username}</p>
                      </div>
                      {currentUserId && !isMe && (
                        <button 
                          onClick={(e) => toggleListFollow(e, u.id)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isListFollowing ? 'bg-background text-header border border-primary/20' : 'bg-primary text-white shadow-md shadow-primary/20'}`}
                        >
                          {isListFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  );
                })
             )}
          </div>
        )}
        
      </div>

      {viewingAvatar && (
        <div 
          className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setViewingAvatar(false)}
        >
          <button onClick={() => setViewingAvatar(false)} className="absolute top-6 right-6 p-2 text-white hover:bg-white/50 rounded-full transition-colors">
            <X size={28} />
          </button>
          
          <div className="relative w-full max-w-sm aspect-square bg-surface rounded-3xl overflow-hidden shadow-xl shadow-primary/10 animate-slide-up" onClick={e => e.stopPropagation()}>
            <img 
              src={profile.avatar_url} 
              className="w-full h-full object-cover" 
              alt="Full Avatar" 
            />
          </div>
          
          <div className="mt-6 text-center animate-slide-up">
            <h2 className="text-2xl font-black text-white">{profile?.name}</h2>
            <p className="text-sm font-bold mt-1 tracking-widest uppercase text-white/70">@{profile?.username}</p>
          </div>
        </div>
      )}

    </div>
  );
}
