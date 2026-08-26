import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Search, UserPlus, UserMinus, User, Import, Layers } from 'lucide-react';

export default function Explore() {
  const { session, userProfile } = useAppContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [feed, setFeed] = useState([]);
  
  // Clone Modal State
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloningSubject, setCloningSubject] = useState(null);
  const [mySemesters, setMySemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    if (session) {
      loadFollowing();
      loadFeed();
      loadMySemesters();
    }
  }, [session]);

  const loadFollowing = async () => {
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', session.user.id);
    if (data) {
      const map = {};
      data.forEach(f => { map[f.following_id] = true; });
      setFollowingMap(map);
    }
  };

  const loadFeed = async () => {
    // 1. Get following IDs
    const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', session.user.id);
    if (!follows || follows.length === 0) {
      setFeed([]);
      return;
    }
    const ids = follows.map(f => f.following_id);
    
    // 2. Fetch public subjects from these users
    // Note: requires Supabase relation profiles!user_id or similar
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*, profiles(name, avatar_url)')
      .in('user_id', ids)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (!error && subjects) {
      setFeed(subjects);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('name', `%${searchQuery}%`)
      .neq('id', session.user.id)
      .limit(10);
    setSearchResults(data || []);
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
    loadFeed();
  };

  const loadMySemesters = async () => {
    // Load all semesters for the current user so they can pick one to import into
    const { data } = await supabase.from('semesters').select('*').eq('user_id', session.user.id);
    setMySemesters(data || []);
  };

  const initiateClone = (subject) => {
    setCloningSubject(subject);
    setShowCloneModal(true);
    setSelectedSemester('');
  };

  const executeClone = async () => {
    if (!selectedSemester) return alert('Please select a semester');
    setIsCloning(true);
    try {
      const targetSem = mySemesters.find(s => s.id === selectedSemester);
      
      // 1. Fetch original resources
      const { data: resources } = await supabase.from('resources').select('*').eq('subject_id', cloningSubject.id);
      
      // 2. Create cloned subject
      const { data: newSubject, error: subErr } = await supabase.from('subjects').insert([{
        semester_id: targetSem.id,
        name: cloningSubject.name,
        user_id: session.user.id,
        is_public: false, // private by default when cloned
        branch: targetSem.branch,
        semester: targetSem.name
      }]).select().single();

      if (subErr) throw subErr;

      // 3. Clone resources if any
      if (resources && resources.length > 0) {
        const newResources = resources.map(r => ({
          subject_id: newSubject.id,
          title: r.title,
          url: r.url,
          type: r.type,
          size: r.size
        }));
        const { error: resErr } = await supabase.from('resources').insert(newResources);
        if (resErr) throw resErr;
      }
      
      alert('Subject cloned successfully into ' + targetSem.name + '!');
      setShowCloneModal(false);
    } catch (err) {
      alert('Error cloning subject: ' + err.message);
    }
    setIsCloning(false);
  };

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* Header */}
      <div className="card p-4">
        <h2 className="text-xl font-bold text-header">Community</h2>
        <p className="text-sm text-body mt-1">Find classmates and explore their public subjects.</p>
      </div>

      {/* User Search */}
      <div className="card p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            className="app-input flex-1" 
            placeholder="Search users by name..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
          <button type="submit" className="btn-primary p-3 flex items-center justify-center rounded-xl">
            <Search size={18} />
          </button>
        </form>
        
        {searchResults.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#333]">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Results</p>
            {searchResults.map(user => (
              <div key={user.id} className="card-sm p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface overflow-hidden flex items-center justify-center">
                    {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="avatar" /> : <User size={20} className="text-body" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-header">{user.name}</p>
                    <p className="text-xs text-body">{user.branch || 'No branch'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleFollow(user.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${followingMap[user.id] ? 'bg-surface text-header' : 'bg-primary text-white'}`}
                >
                  {followingMap[user.id] ? <><UserMinus size={14}/> Unfollow</> : <><UserPlus size={14}/> Follow</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="space-y-3">
        <h3 className="font-bold text-header px-1">Feed</h3>
        {feed.length === 0 ? (
          <div className="card p-8 text-center text-body text-sm">
            Follow some users to see their public subjects here!
          </div>
        ) : (
          feed.map(subject => (
            <div key={subject.id} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface overflow-hidden flex items-center justify-center">
                    {subject.profiles?.avatar_url ? <img src={subject.profiles.avatar_url} className="w-full h-full object-cover" alt="avatar" /> : <User size={12} className="text-body" />}
                  </div>
                  <p className="text-xs font-semibold text-body">{subject.profiles?.name}</p>
                </div>
                <div className="text-xs text-body font-medium mint px-2 py-1 rounded-md">
                  {subject.branch} · {subject.semester}
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-bold text-header">{subject.name}</h4>
                <p className="text-xs text-body mt-1">Shared a subject bundle</p>
              </div>

              <button onClick={() => initiateClone(subject)} className="btn-outline w-full flex items-center justify-center gap-2 py-2 text-sm mt-2">
                <Import size={16} /> Import to My Hub
              </button>
            </div>
          ))
        )}
      </div>

      {/* Clone Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-header flex items-center gap-2">
              <Layers size={20} className="text-primary"/> Clone Subject
            </h3>
            <p className="text-sm text-body">
              Import <strong>{cloningSubject?.name}</strong> to your hub. Which semester should this go into?
            </p>
            <select 
              className="app-input"
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
            >
              <option value="">-- Select Semester --</option>
              {mySemesters.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.branch})</option>
              ))}
            </select>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowCloneModal(false)} className="btn-outline flex-1 py-2">Cancel</button>
              <button onClick={executeClone} disabled={isCloning} className="btn-primary flex-1 py-2">
                {isCloning ? 'Cloning...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
