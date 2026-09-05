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
      
    setSearchResults(data || []);
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
      await supabase.from('follows').insert([{ follower_id: session.user.id, following_id: userId }]);
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
            className="w-full bg-[#E8F2EE] border border-transparent focus:bg-white focus:border-primary/30 rounded-xl py-2 pl-9 pr-4 text-sm outline-none transition-all" 
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
                      className="px-2 py-3 flex items-center gap-3 cursor-pointer hover:bg-black/5 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-full border border-primary/10 flex items-center justify-center shrink-0 overflow-hidden ${isText ? 'bg-transparent' : 'bg-surface'}`}>
                        {isText ? (
                          <Search size={22} className="text-body" />
                        ) : item.avatar_url ? (
                          <img src={item.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <User size={24} className="text-body" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {isText ? (
                          <p className="text-base font-bold text-header truncate">{item}</p>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-base font-bold text-header flex items-center">
                                {item.name}
                                {item.is_premium && <VerifiedBadge />}
                              </p>
                              {item.college && <span className="text-[9px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">{item.college}</span>}
                            </div>
                            <p className="text-sm text-body truncate">@{item.username || 'user'} {item.branch ? `• ${item.branch}` : ''}</p>
                          </>
                        )}
                      </div>
                      <button onClick={(e) => removeRecentSearch(isText ? item : item.id, e)} className="p-2 text-body hover:text-header">
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
            <span className="font-bold" style={{color: '#2D4A3E'}}>User not found</span>
          </div>
        ) : (
          searchResults.map(user => {
            const isFollowing = followingMap[user.id];
            return (
              <div key={user.id} onClick={() => openUserPopup(user)} className="px-2 py-3 flex items-center gap-3 cursor-pointer hover:bg-black/5 transition-colors">
                <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-sm ${user.is_premium ? 'bg-gradient-to-tr from-primary to-accent p-0.5' : 'bg-surface border border-primary/15'}`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-primary/5 flex items-center justify-center">
                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={20} className="text-primary/50" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-bold text-header flex items-center">
                      {user.name}
                      {user.is_premium && <VerifiedBadge />}
                    </p>
                    {user.college && <span className="text-[9px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">{user.college}</span>}
                  </div>
                  <p className="text-xs text-body truncate">@{user.username || 'user'} {user.branch ? `• ${user.branch}` : ''}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFollow(user.id); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${isFollowing ? 'bg-surface text-header border border-primary/15' : 'bg-primary text-white shadow-sm'}`}
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
