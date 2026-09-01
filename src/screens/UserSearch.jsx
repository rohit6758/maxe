import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Search, User, UserPlus, Check, X } from 'lucide-react';

export default function UserSearch() {
  const { session } = useAppContext();
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
        if (typeof identifier === 'string') return u !== identifier;
        return u.id !== identifier;
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
      .neq('id', session.user.id)
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
      <div className="card p-4">
        <h2 className="text-xl font-bold text-header flex items-center gap-2">
          <Search size={22} className="text-primary"/> Find People
        </h2>
        <p className="text-sm text-body mt-1">Search for classmates and follow them to build your network.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input 
          className="app-input flex-1" 
          placeholder="Search users by name or username..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={isSearching}
          className="btn-primary p-3 flex items-center justify-center rounded-xl transition-all active:scale-90"
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
                      className="p-3 flex items-center gap-4 cursor-pointer hover:bg-black/5 rounded-xl transition-colors"
                    >
                      <div className={`w-14 h-14 rounded-full border border-[#333] flex items-center justify-center shrink-0 overflow-hidden ${isText ? 'bg-transparent' : 'bg-surface'}`}>
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
                            <p className="text-base font-bold text-header truncate">{item.name}</p>
                            <p className="text-sm text-body truncate">@{item.username || 'user'}</p>
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
            <span className="font-bold text-red-500">Not existed!! 📭</span>
          </div>
        ) : (
          searchResults.map(user => {
            const isFollowing = followingMap[user.id];
            return (
              <div key={user.id} onClick={() => openUserPopup(user)} className="card p-3 flex items-center gap-3 cursor-pointer hover:border-primary transition-colors">
                <div className="w-12 h-12 rounded-full bg-surface border border-[#333] overflow-hidden flex items-center justify-center shrink-0">
                  {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={20} className="text-body" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-header truncate">{user.name}</p>
                  <p className="text-xs text-body truncate">@{user.username || 'user'} {user.branch ? `• ${user.branch}` : ''}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFollow(user.id); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${isFollowing ? 'bg-surface text-header border border-[#333]' : 'bg-primary text-white'}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })
        )}
      </div>
      
      {/* User Popup Modal (Instagram Style) */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedUser(null)}>
          <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2 text-white hover:bg-white/20 rounded-full transition-colors">
            <X size={28} />
          </button>
          
          <div className="relative w-full max-w-sm aspect-square bg-surface rounded-3xl overflow-hidden shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            {selectedUser.avatar_url ? (
              <img src={selectedUser.avatar_url} className="w-full h-full object-cover" alt="avatar" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{background: 'rgba(107,168,152,0.15)'}}>
                <User size={120} style={{color:'#6BA898'}} />
              </div>
            )}
          </div>
          
          <div className="mt-6 w-full max-w-sm text-center animate-slide-up bg-surface p-6 rounded-3xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-header">{selectedUser.name}</h2>
            <p className="text-sm font-bold mt-1 tracking-widest uppercase text-primary">@{selectedUser.username || 'username'}</p>
            {selectedUser.branch && <p className="text-sm font-semibold mt-2 text-body">{selectedUser.branch}</p>}
            
            <button 
              onClick={() => toggleFollow(selectedUser.id)}
              className={`w-full mt-6 py-3 rounded-xl text-sm font-bold transition-colors ${followingMap[selectedUser.id] ? 'bg-background text-header border border-[#333]' : 'bg-primary text-white'}`}
            >
              {followingMap[selectedUser.id] ? 'Following' : 'Follow User'}
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}
