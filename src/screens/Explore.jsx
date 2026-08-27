import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Search, UserPlus, UserMinus, User, Import, Layers, BookOpen, MessageSquare, Link as LinkIcon, FileText } from 'lucide-react';

export default function Explore() {
  const { session, userProfile } = useAppContext();
  
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' or 'following'
  const [discoverBranch, setDiscoverBranch] = useState(userProfile?.branch || 'CSM');
  const [feed, setFeed] = useState([]);
  
  // Search & Follow
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  
  // Clone Modal State
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloningSubject, setCloningSubject] = useState(null);
  const [mySemesters, setMySemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [isCloning, setIsCloning] = useState(false);

  const BRANCHES = ['CSE', 'CSM', 'CSD', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];

  useEffect(() => {
    if (session) {
      loadFollowingMap();
      loadMySemesters();
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      loadFeed();
    }
  }, [activeTab, discoverBranch, session]);

  const loadFollowingMap = async () => {
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', session.user.id);
    if (data) {
      const map = {};
      data.forEach(f => { map[f.following_id] = true; });
      setFollowingMap(map);
    }
  };

  const loadFeed = async () => {
    let query = supabase
      .from('subjects')
      .select('*, profiles(name, avatar_url), resources(id, type, title)')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (activeTab === 'following') {
      const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', session.user.id);
      if (!follows || follows.length === 0) {
        setFeed([]);
        return;
      }
      query = query.in('user_id', follows.map(f => f.following_id));
    } else {
      // Discover Tab
      query = query.eq('branch', discoverBranch);
    }

    const { data, error } = await query;
    if (!error && data) setFeed(data);
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
    if (activeTab === 'following') loadFeed();
  };

  const loadMySemesters = async () => {
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
      
      const { data: resources } = await supabase.from('resources').select('*').eq('subject_id', cloningSubject.id);
      
      const { data: newSubject, error: subErr } = await supabase.from('subjects').insert([{
        semester_id: targetSem.id,
        name: cloningSubject.name,
        user_id: session.user.id,
        is_public: false,
        branch: targetSem.branch,
        semester: targetSem.name
      }]).select().single();

      if (subErr) throw subErr;

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

  const getResourceIcon = (type) => {
    if (type === 'pdf') return <FileText size={12} />;
    if (type === 'chat') return <MessageSquare size={12} />;
    return <LinkIcon size={12} />;
  };

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* Header & Tabs */}
      <div className="card p-4 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-header">Community</h2>
          <p className="text-sm text-body mt-1">Discover study materials and follow classmates.</p>
        </div>
        
        <div className="flex bg-surface p-1 rounded-xl border border-[#333]">
          <button 
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'discover' ? 'bg-primary text-white shadow-sm' : 'text-body hover:text-header'}`}
          >
            Discover
          </button>
          <button 
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'following' ? 'bg-primary text-white shadow-sm' : 'text-body hover:text-header'}`}
          >
            Following
          </button>
        </div>
      </div>

      {activeTab === 'following' && (
        <div className="card p-4 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input 
              className="app-input flex-1" 
              placeholder="Search users by name to follow..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
            />
            <button type="submit" className="btn-primary p-3 flex items-center justify-center rounded-xl">
              <Search size={18} />
            </button>
          </form>
          
          {searchResults.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#333]">
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Search Results</p>
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
      )}

      {activeTab === 'discover' && (
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-header">Public Subjects</h3>
          <select 
            className="app-input w-auto py-1.5 text-xs font-bold"
            value={discoverBranch}
            onChange={(e) => setDiscoverBranch(e.target.value)}
          >
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      )}

      {/* Feed List */}
      <div className="space-y-3">
        {feed.length === 0 ? (
          <div className="card p-8 text-center text-body text-sm">
            {activeTab === 'discover' 
              ? `No public subjects found for ${discoverBranch} yet.`
              : `Follow some users to see their public subjects here!`}
          </div>
        ) : (
          feed.map(subject => (
            <div key={subject.id} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface overflow-hidden flex items-center justify-center">
                    {subject.profiles?.avatar_url ? <img src={subject.profiles.avatar_url} className="w-full h-full object-cover" alt="avatar" /> : <User size={12} className="text-body" />}
                  </div>
                  <p className="text-xs font-semibold text-body">{subject.profiles?.name || 'Unknown User'}</p>
                </div>
                <div className="text-xs text-body font-medium mint px-2 py-1 rounded-md">
                  {subject.branch} · {subject.semester}
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-bold text-header">{subject.name}</h4>
                {subject.resources && subject.resources.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {subject.resources.map(res => (
                      <span key={res.id} className="inline-flex items-center gap-1 text-[10px] bg-surface border border-[#333] px-1.5 py-0.5 rounded text-body">
                        {getResourceIcon(res.type)}
                        <span className="truncate max-w-[80px]">{res.title}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-body mt-1">Empty bundle (no resources)</p>
                )}
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
