import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, User } from 'lucide-react';

export default function UserProfilePopup({ userId, onClose, currentUserId, onFollowChange }) {
  const [profile, setProfile] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

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

    setLoading(false);
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

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      
      <div className="relative w-full max-w-sm bg-surface rounded-2xl overflow-hidden shadow-2xl animate-slide-up border border-[#333]" onClick={e => e.stopPropagation()}>
        
        {/* Header with Close */}
        <div className="flex justify-between items-center p-3 border-b border-[#333]">
          <h3 className="font-bold text-header text-sm truncate px-1">@{profile?.username || 'user'}</h3>
          <button onClick={onClose} className="p-1 text-body hover:text-white transition-colors rounded-full bg-black/10">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-xs text-body animate-pulse">Loading profile...</p>
          </div>
        ) : (
          <div className="p-5">
            {/* Top section: Avatar + Stats */}
            <div className="flex items-center gap-6 mb-4">
              <div className="w-20 h-20 rounded-full border border-[#333] overflow-hidden flex items-center justify-center shrink-0 bg-black/10">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  <User size={32} className="text-body" />
                )}
              </div>
              
              <div className="flex-1 flex justify-around items-center">
                <div className="flex flex-col items-center">
                  <span className="font-bold text-header text-lg">{followerCount}</span>
                  <span className="text-[10px] text-body tracking-wider uppercase">Followers</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-header text-lg">{followingCount}</span>
                  <span className="text-[10px] text-body tracking-wider uppercase">Following</span>
                </div>
              </div>
            </div>

            {/* Middle section: Info */}
            <div className="space-y-1 mb-5">
              <h2 className="text-base font-bold text-header">{profile?.name || 'Unknown User'}</h2>
              {profile?.branch && <p className="text-xs font-semibold text-primary">{profile.branch}</p>}
              {profile?.bio && <p className="text-sm text-body whitespace-pre-wrap mt-2">{profile.bio}</p>}
            </div>

            {/* Bottom section: Action */}
            {currentUserId && currentUserId !== userId && (
              <button 
                onClick={toggleFollow}
                className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${isFollowing ? 'bg-background text-header border border-[#333]' : 'bg-primary text-white'}`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
