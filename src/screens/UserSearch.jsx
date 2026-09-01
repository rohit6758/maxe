import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Search, User, UserPlus, Check } from 'lucide-react';

export default function UserSearch() {
  const { session } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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
    // The debounce will handle it, but if they hit Enter immediately, we can force it
    executeSearch(searchQuery);
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
        ) : searchResults.length === 0 ? (
          <div className="card p-8 text-center text-body text-sm mt-2">
            {hasSearched ? (
              <span className="font-bold text-red-500">Not existed!! 📭</span>
            ) : (
              "Search for people to see results here."
            )}
          </div>
        ) : (
          searchResults.map(user => {
            const isFollowing = followingMap[user.id];
            return (
              <div key={user.id} className="card p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-surface border border-[#333] overflow-hidden flex items-center justify-center shrink-0">
                  {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={20} className="text-body" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-header truncate">{user.name}</p>
                  <p className="text-xs text-body truncate">@{user.username || 'user'} {user.branch ? `• ${user.branch}` : ''}</p>
                </div>
                <button 
                  onClick={() => toggleFollow(user.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${isFollowing ? 'bg-surface text-header border border-[#333]' : 'bg-primary text-white'}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
