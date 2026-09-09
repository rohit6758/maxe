import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Search, User, UserPlus, Check, X } from 'lucide-react';
import UserProfilePopup from '../components/UserProfilePopup';
import VerifiedBadge from '../components/VerifiedBadge';

export default function UserSearch() {
  const { session, userProfile } = useAppContext();
  const isAdmin = session?.user?.email === 'rohitnxtgengw@gmail.com';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // For Popup

  useEffect(() => {
    // Realtime Sync Fix: Listen to UPDATE events on the profiles table for ALL rows so changes reflect globally
    const channel = supabase
      .channel(`global-profiles-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        setSearchResults(prev => prev.map(u => u.id === payload.new.id ? { ...u, ...payload.new } : u));
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('maxe_recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const saveRecentSearch = (item) => {
    setRecentSearches(prev => {
      // item can be a user object (has .id) or a text string
      const isText = typeof item === 'string';
      const filtered = prev.filter(u => {
        if (isText && typeof u === 'string') return u.toLowerCase() !== item.toLowerCase();
        if (!isText && typeof u !== 'string') return u.id !== item.id;
        return true;
      });
      const updated = [item, ...filtered].slice(0, 10);
      localStorage.setItem('maxe_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const removeRecentSearch = (identifier, e) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(u => {
        const uId = typeof u === 'string' ? u : u.id;
        return uId !== identifier;
      });
      localStorage.setItem('maxe_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('maxe_recent_searches');
  };

  const openUserPopup = (user) => {
    setSelectedUser(user);
    saveRecentSearch(user);
  };

  useEffect(() => {
    if (session) loadFollowingMap();
  }, [session]);

  // Live search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        executeSearch(searchQuery);
      } else {
        setHasSearched(false);
        setSearchResults([]);
      }
    }, 400); // 400ms delay while typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadFollowingMap = async () => {
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', session.user.id);
    const map = {};
    if (data) data.forEach(f => { map[f.following_id] = true; });
    setFollowingMap(map);
  };

  const executeSearch = async (query) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    
    const words = query.trim().split(/\s+/);
    const orQuery = words.map(word => `name.ilike.%${word}%,username.ilike.%${word}%`).join(',');
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(orQuery)
      .limit(15);
      
    setSearchResults((data || []).filter(user => user.id !== session?.user?.id));
    setIsSearching(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      executeSearch(searchQuery);
    }
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
      setFollowingMap(prev => ({ ...prev, [userId]: true }));
    }
  };

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      <div className="px-2 pt-2">
        <h2 className="text-xl font-bold text-header flex items-center gap-2">
          Find People
        </h2>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 px-2 pb-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body/70" />
          <input 
            className="w-full bg-[var(--theme-bg)] border border-transparent focus:bg-white focus:border-primary/30 rounded-xl py-2 pl-9 pr-4 text-sm outline-none transition-all" 
            placeholder="Search" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          type="submit" 
          disabled={isSearching}
          className="hidden"
        >
          {isSearching ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Search size={18} />
          )}
        </button>
      </form>

      <div className="space-y-2 relative min-h-[150px]">
        {isSearching ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-body text-sm gap-3 pt-8">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="font-semibold text-primary animate-pulse">Searching...</p>
          </div>
        ) : !searchQuery.trim() ? (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-header text-lg">Recent</h3>
              {recentSearches.length > 0 && (
                <button onClick={clearRecentSearches} className="text-primary font-bold text-sm hover:opacity-80">Clear all</button>
              )}
            </div>
            {recentSearches.length === 0 ? (
              <div className="card p-8 text-center text-body text-sm">
                No recent searches.
              </div>
            ) : (
              <div className="space-y-1">
                {recentSearches.map((item, index) => {
                  const isText = typeof item === 'string';
                  
                  let eff = null;
                  if (!isText && item.interests && item.interests.startsWith('{')) {
                    try {
                      const parsed = JSON.parse(item.interests);
                      if (parsed.profileEffects) eff = parsed.profileEffects;
                    } catch(e) {}
                  }
                  const hasWallpaper = !isText && eff && eff.wallpaper && eff.wallpaper !== 'none';
                  const wallpaperStyle = hasWallpaper ? {
                    background: eff.wallpaper === 'custom' && eff.customWallpaperUrl ? `url(${eff.customWallpaperUrl})` :
                                eff.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                                eff.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                                eff.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : 'var(--theme-surface)',
                    backgroundSize: eff.wallpaper === 'custom' ? 'cover' : eff.wallpaper === 'waves' ? 'auto' : '20px 20px',
                    backgroundPosition: 'center'
                  } : {};

                  return (
                    <div 
                      key={isText ? item : item.id} 
                      onClick={() => {
                        if (isText) {
                          setSearchQuery(item);
                          executeSearch(item);
                          saveRecentSearch(item); // bump to top
                        } else {
                          openUserPopup(item);
                        }
                      }} 
                      className={`px-3 py-3 flex items-center gap-3 cursor-pointer transition-all relative overflow-hidden ${hasWallpaper ? 'rounded-xl mb-1 border border-white/30 shadow-md' : 'hover:bg-black/5'}`}
                      style={wallpaperStyle}
                    >
                      {/* Soft scrim only for custom photo wallpapers */}
                      {hasWallpaper && eff.wallpaper === 'custom' && (
                        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                      )}
                      
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden relative z-10 ${isText ? 'bg-transparent border border-primary/10' : hasWallpaper ? 'shadow-md ring-2 ring-white/70 bg-primary/5' : 'bg-surface border border-primary/15'}`}>
                        {isText ? (
                          <Search size={22} className="text-body" />
                        ) : item.avatar_url ? (
                          <img src={item.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <User size={24} className={hasWallpaper && eff.wallpaper === 'custom' ? 'text-white/80' : 'text-primary/50'} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 relative z-10">
                        {isText ? (
                          <p className="text-base font-bold text-header truncate">{item}</p>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-base font-bold flex items-center"
                                 style={hasWallpaper && eff.wallpaper === 'custom' ? {color:'#fff', textShadow:'0 1px 3px rgba(0,0,0,0.6)'} : {color:'var(--theme-header)'}}>
                                {item.name}
                                {item.is_premium && <VerifiedBadge />}
                              </p>
                              {item.college && <span className="text-[9px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">{item.college}</span>}
                            </div>
                            <p className="text-sm truncate"
                               style={hasWallpaper && eff.wallpaper === 'custom' ? {color:'rgba(255,255,255,0.85)'} : {color:'var(--theme-body)'}}>
                              @{item.username || 'user'} {item.branch ? `• ${item.branch}` : ''}
                            </p>
                          </>
                        )}
                      </div>
                      <button onClick={(e) => removeRecentSearch(isText ? item : item.id, e)} className="p-2 relative z-10 hover:opacity-70 transition-opacity"
                              style={{color: hasWallpaper && eff.wallpaper === 'custom' ? '#fff' : 'var(--theme-body)'}}>
                        <X size={20} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : searchResults.length === 0 ? (
          <div className="card p-8 text-center text-body text-sm mt-2">
            <span className="font-bold" style={{color: 'var(--theme-header)'}}>User not found</span>
          </div>
        ) : (
          searchResults.map(user => {
            const isFollowing = followingMap[user.id];
            let eff = null;
            if (user.interests && user.interests.startsWith('{')) {
              try {
                const parsed = JSON.parse(user.interests);
                if (parsed.profileEffects) eff = parsed.profileEffects;
              } catch(e) {}
            }
            
            const hasWallpaper = eff && eff.wallpaper && eff.wallpaper !== 'none';
            const isCustomPhoto = hasWallpaper && eff.wallpaper === 'custom' && eff.customWallpaperUrl;
            
            return (
              <div key={user.id} onClick={() => openUserPopup(user)}
                title={`Open ${user.name || user.username || 'profile'}`}
                className={`px-3 py-3 flex items-center gap-3 cursor-pointer transition-all relative overflow-hidden z-0 ${hasWallpaper ? 'rounded-xl mb-2 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.15)] bg-transparent' : 'hover:bg-black/5 border-b border-primary/5'}`}
              >
                {/* 1. Background Layer */}
                {hasWallpaper && (
                  <div className="absolute inset-0 z-[-1]" style={{
                    background: isCustomPhoto ? `url('${eff.customWallpaperUrl}')` :
                                eff.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, transparent 1px)' :
                                eff.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, transparent 1px)' :
                                eff.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, transparent 1px, transparent 8px)' : 'transparent',
                    backgroundSize: isCustomPhoto ? 'cover' : eff.wallpaper === 'waves' ? 'auto' : '20px 20px',
                    backgroundPosition: 'center',
                    backgroundColor: isCustomPhoto ? 'transparent' : 'var(--theme-surface)'
                  }} />
                )}

                {/* 2. Photo Dark Scrim */}
                {isCustomPhoto && (
                  <div className="absolute inset-0 bg-black/40 z-[-1]" />
                )}

                {/* 3. Protected Content */}
                <div className={`relative z-10 w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md ${user.is_premium ? 'ring-2 ring-white/70' : 'bg-surface border border-primary/15'}`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-primary/5 flex items-center justify-center">
                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={20} className="text-primary/50" />}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={`text-sm font-bold flex items-center ${isCustomPhoto ? 'text-white drop-shadow-sm' : 'text-[var(--theme-header)]'}`}>
                      {user.name}
                      {user.is_premium && <VerifiedBadge />}
                    </p>
                    {user.college && <span className="text-[9px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">{user.college}</span>}
                  </div>
                  <p className={`text-xs truncate ${isCustomPhoto ? 'text-white drop-shadow-sm opacity-90' : 'text-[var(--theme-body)]'}`}>
                    @{user.username || 'user'} {user.branch ? `• ${user.branch}` : ''}
                  </p>
                </div>

                <button
                  aria-label={isFollowing ? `Unfollow ${user.name || user.username}` : `Follow ${user.name || user.username}`}
                  onClick={(e) => { e.stopPropagation(); toggleFollow(user.id); }}
                  className={`relative z-10 px-4 py-1.5 rounded-lg text-xs transition-all ${hasWallpaper ? 'bg-white/80 text-gray-900 backdrop-blur-md hover:bg-white/95 border border-white/40 font-medium' : isFollowing ? 'bg-surface border border-primary/20 text-header font-semibold' : 'bg-primary text-white font-semibold shadow-sm'}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })
        )}
      </div>
      
      {/* User Profile Popup (Instagram Style) */}
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
      
    </div>
  );
}
