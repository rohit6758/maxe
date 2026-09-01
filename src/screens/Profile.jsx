import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { User, Save, UploadCloud, LogOut, Camera, Users, X } from 'lucide-react';

export default function Profile() {
  const { session, userProfile, setUserProfile } = useAppContext();


  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [branch, setBranch] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPopup, setShowAvatarPopup] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);
  const [networkType, setNetworkType] = useState('followers'); // 'followers' or 'following'
  const [networkList, setNetworkList] = useState([]);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false);

  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const [followingMap, setFollowingMap] = useState({});
  const [selectedUser, setSelectedUser] = useState(null); // For Profile Popup

  useEffect(() => {
    if (session) {
      loadFollowStats();
    }
  }, [session]);

  
  const openNetwork = async (type) => {
    setNetworkType(type);
    setShowNetwork(true);
    setNetworkList([]);
    setIsLoadingNetwork(true);
    const column = type === 'followers' ? 'following_id' : 'follower_id';
    const selectCol = type === 'followers' ? 'follower_id' : 'following_id';
    
    const { data, error } = await supabase.from('follows').select(selectCol).eq(column, session.user.id);
    if (error) { alert('Error loading network'); setIsLoadingNetwork(false); return; }
    if (data && data.length > 0) {
      const ids = data.map(d => d[selectCol]);
      const { data: profiles } = await supabase.from('profiles').select('id, name, username, avatar_url, branch').in('id', ids);
      setNetworkList(profiles || []);
    }
    setIsLoadingNetwork(false);
  };
const loadFollowStats = async () => {
    const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', session.user.id);
    const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', session.user.id);
    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);
  };

  const loadFollowingMap = async () => {
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', session.user.id);
    const map = {};
    if (data) data.forEach(f => { map[f.following_id] = true; });
    setFollowingMap(map);
  };

  useEffect(() => {
    if (showNetwork) loadFollowingMap();
  }, [showNetwork]);

  const toggleFollow = async (userId) => {
    const isFollowing = followingMap[userId];
    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: session.user.id, following_id: userId });
      setFollowingMap(prev => ({ ...prev, [userId]: false }));
      if (networkType === 'following') setFollowingCount(prev => prev - 1);
    } else {
      await supabase.from('follows').insert([{ follower_id: session.user.id, following_id: userId }]);
      setFollowingMap(prev => ({ ...prev, [userId]: true }));
      if (networkType === 'following') setFollowingCount(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setUsername(userProfile.username || '');
      setBio(userProfile.bio || '');
      setBranch(userProfile.branch || '');
      setAvatarUrl(userProfile.avatar_url || null);
    }
  }, [userProfile, isEditing]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${session.user.id}_${Math.random()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('uploads')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      const url = `${data.publicUrl}`;
      
      // Instantly update database so popup uploads save immediately
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', session.user.id);
      setUserProfile(prev => ({ ...prev, avatar_url: url }));
      setAvatarUrl(url);
      
    } catch (err) {
      alert('Avatar upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (let reg of regs) {
          await reg.unregister(); // Kill the old service worker
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // Clear all caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch (e) {
        console.error(e);
      }
    }
    
    // Force a hard reload from the server, skipping browser cache
    window.location.reload(true);
  };

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        branch,
        avatar_url: avatarUrl
      })
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      alert('Save failed: ' + error.message);
    } else if (data) {
      setUserProfile(data);
      setSaved(true);
      setTimeout(() => { setSaved(false); setIsEditing(false); }, 1000);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4 pb-24 md:pb-8">

      {/* Header */}
      <div className="card p-4">
        <h2 className="text-xl font-bold text-aberration" style={{color:'#2D4A3E'}}>Profile</h2>
      </div>

      {!isEditing ? (
        <div className="card p-6">
          <div className="flex items-center gap-5">
            <div 
              onClick={() => setShowAvatarPopup(true)}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex items-center justify-center shrink-0 border-2 cursor-pointer transition-transform hover:scale-105"
              style={{borderColor: 'rgba(107,168,152,0.3)', background: 'rgba(107,168,152,0.1)'}}>
              {userProfile?.avatar_url
                ? <img src={userProfile?.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <User size={40} style={{color:'#6BA898'}} />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold truncate" style={{color:'#2D4A3E'}}>{userProfile?.name || 'Your Name'}</h2>
              <p className="text-xs font-semibold mt-0.5" style={{color:'#6BA898'}}>@{userProfile?.username || 'username'}</p>
              <p className="text-xs md:text-sm font-semibold mt-0.5" style={{color:'#6BA898'}}>{userProfile?.branch || 'No branch selected'}</p>
              
              <div className="flex gap-4 mt-2">
                <button onClick={() => openNetwork('followers')} className="flex flex-col items-start hover:opacity-80">
                  <span className="font-bold text-sm" style={{color:'#2D4A3E'}}>{followerCount}</span>
                  <span className="text-[10px] uppercase font-bold" style={{color:'#6BA898'}}>Followers</span>
                </button>
                <button onClick={() => openNetwork('following')} className="flex flex-col items-start hover:opacity-80">
                  <span className="font-bold text-sm" style={{color:'#2D4A3E'}}>{followingCount}</span>
                  <span className="text-[10px] uppercase font-bold" style={{color:'#6BA898'}}>Following</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-5">
            <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{color:'#5E7A6E'}}>
              {userProfile?.bio || 'Add a bio...'}
            </p>
          </div>
          
          <button 
            onClick={() => setIsEditing(true)}
            className="w-full mt-6 py-2 rounded-xl text-sm font-bold transition-transform active:scale-95"
            style={{background: '#EAF4EF', color: '#2D4A3E', border: '1px solid rgba(107,168,152,0.2)'}}>
            Edit Profile
          </button>
        </div>
      ) : (
        <div className="card p-5 space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold" style={{color:'#2D4A3E'}}>Edit Profile</h3>
            <button onClick={() => setIsEditing(false)} className="text-xs font-bold" style={{color:'#DC6B6B'}}>Cancel</button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
                style={{background:'rgba(107,168,152,0.12)', border:'2px solid rgba(107,168,152,0.3)'}}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  : <User size={36} style={{color:'#6BA898'}} />}
              </div>
              <label className="absolute -bottom-1 -right-1 rounded-xl p-2 cursor-pointer shadow"
                style={{background:'#6BA898', border:'2px solid #FFFFFF'}}>
                {uploading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera size={14} style={{color:'#FFFFFF'}} />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#5E7A6E'}}>Name</label>
            <input className="app-input" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
          </div>



          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#5E7A6E'}}>Branch</label>
            <select className="app-input" value={branch} onChange={e => setBranch(e.target.value)}>
              <option value="">Select branch</option>
              {['CSE','CSM','IT','CSC','EEE','MECH','CIVIL','ECE'].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#5E7A6E'}}>Bio</label>
            <textarea className="app-input resize-none" rows={3} placeholder="About yourself..." value={bio} onChange={e => setBio(e.target.value)} />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm mt-2">
            <Save size={16} />
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      )}



      {/* Account */}
      <div className="card p-4 space-y-3">
        <h3 className="font-bold" style={{color:'#2D4A3E'}}>Account</h3>
        <div className="card-sm p-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'#A8C5B8'}}>Email</p>
          <p className="text-sm font-medium mt-0.5" style={{color:'#2D4A3E'}}>{session?.user?.email}</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          style={{background:'rgba(220,107,107,0.08)', border:'1.5px solid rgba(220,107,107,0.2)', color:'#DC6B6B'}}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {/* Network Modal */}
      {showNetwork && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-5 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-header capitalize flex items-center gap-2">
                <Users size={20} className="text-primary"/> {networkType}
              </h3>
              <button onClick={() => setShowNetwork(false)}><X size={20}/></button>
            </div>
            
            <div className="overflow-y-auto space-y-2 flex-1">
              {isLoadingNetwork ? (
                <div className="flex flex-col items-center justify-center h-32 space-y-2">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-xs text-body animate-pulse">Loading {networkType}...</p>
                </div>
              ) : networkList.length === 0 ? (
                <p className="text-center text-xs text-body italic mt-4">No {networkType} found.</p>
              ) : (
                networkList.map(user => {
                  const isFollowing = followingMap[user.id];
                  const isMe = user.id === session?.user?.id;
                  return (
                    <div key={user.id} onClick={() => setSelectedUser(user)} className="flex items-center gap-3 p-2 rounded-lg bg-surface border border-[#333] cursor-pointer hover:border-primary transition-colors">
                      <div className="w-10 h-10 rounded-full bg-black/5 overflow-hidden flex items-center justify-center shrink-0">
                        {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={16} className="text-body" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-header truncate">{user.name}</p>
                        <p className="text-[10px] text-primary font-bold">@{user.username || 'user'}</p>
                      </div>
                      {!isMe && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFollow(user.id); }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${isFollowing ? 'bg-background text-header border border-[#333]' : 'bg-primary text-white'}`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected User Popup (Instagram Style) */}
      {selectedUser && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedUser(null)}>
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
            
            {selectedUser.id !== session?.user?.id && (
              <button 
                onClick={() => toggleFollow(selectedUser.id)}
                className={`w-full mt-6 py-3 rounded-xl text-sm font-bold transition-colors ${followingMap[selectedUser.id] ? 'bg-background text-header border border-[#333]' : 'bg-primary text-white'}`}
              >
                {followingMap[selectedUser.id] ? 'Following' : 'Follow User'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Big Avatar Popup */}
      {showAvatarPopup && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setShowAvatarPopup(false)}>
          
          <button onClick={() => setShowAvatarPopup(false)} className="absolute top-6 right-6 p-2 text-white hover:bg-white/20 rounded-full transition-colors">
            <X size={28} />
          </button>
          
          <div className="relative w-full max-w-sm aspect-square bg-surface rounded-3xl overflow-hidden shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            {userProfile?.avatar_url ? (
              <img src={userProfile?.avatar_url} className="w-full h-full object-cover" alt="avatar" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{background: 'rgba(107,168,152,0.15)'}}>
                <User size={120} style={{color:'#6BA898'}} />
              </div>
            )}
            
            <label className="absolute bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-105 transition-transform text-white border-2 border-white" style={{background:'#6BA898'}}>
              {uploading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera size={24} />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                await handleAvatarUpload(e);
                // Also instantly save to DB so they don't have to click 'Save Changes' in the other form
                if (session) {
                  setTimeout(async () => {
                     const { data } = await supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single();
                     if (data) {
                       setUserProfile(prev => ({...prev, avatar_url: data.avatar_url}));
                       setAvatarUrl(data.avatar_url);
                     }
                  }, 1500);
                }
              }} disabled={uploading} />
            </label>
          </div>
          
          <div className="mt-6 text-center animate-slide-up">
            <h2 className="text-2xl font-black text-white">{userProfile?.name || 'Your Name'}</h2>
            <p className="text-sm font-bold mt-1 tracking-widest uppercase text-white/70">@{userProfile?.username || 'username'}</p>
          </div>

        </div>
      )}

    </div>
  );
}

