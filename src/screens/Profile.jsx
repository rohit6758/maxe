import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BRANCHES, COLLEGES } from '../lib/constants';
import { useAppContext } from '../context/AppContext';
import { User, Save, UploadCloud, LogOut, Camera, Users, X } from 'lucide-react';
import VerifiedBadge from '../components/VerifiedBadge';
import UserProfilePopup from '../components/UserProfilePopup';

export default function Profile() {
  const { session, userProfile, setUserProfile, theme, setTheme, profileEffects, setProfileEffects } = useAppContext();


  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [branch, setBranch] = useState('');
  const [college, setCollege] = useState('');
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
      setCollege(userProfile.college || '');
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
        college,
        avatar_url: avatarUrl
      })
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message.includes('duplicate')) {
        alert('This username is already taken. Please choose another one.');
      } else {
        alert('Save failed: ' + error.message);
      }
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
        <h2 className="text-xl font-bold text-aberration" className="text-header">Profile</h2>
      </div>

      {!isEditing ? (
        <div className="card p-6">
          <div className="flex items-center gap-5">
            <div 
              onClick={() => setShowAvatarPopup(true)}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex items-center justify-center shrink-0 border-2 cursor-pointer transition-transform hover:scale-105"
              style={{borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)', background: 'rgba(107,168,152,10%, transparent)'}}>
              {userProfile?.avatar_url
                ? <img src={userProfile?.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <User size={40} className="text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold truncate flex items-center" className="text-header">
                {userProfile?.name || 'Your Name'}
                {userProfile?.is_premium && <VerifiedBadge />}
              </h2>
              <p className="text-xs font-semibold mt-0.5" className="text-primary">@{userProfile?.username || 'username'}</p>
              <p className="text-xs md:text-sm font-semibold mt-0.5" className="text-primary">{userProfile?.college ? `${userProfile.college} • ${userProfile.branch}` : (userProfile?.branch || 'No branch selected')}</p>
              
              <div className="flex gap-4 mt-2">
                <button onClick={() => openNetwork('followers')} className="flex flex-col items-start hover:opacity-80">
                  <span className="font-bold text-sm" className="text-header">{followerCount}</span>
                  <span className="text-[10px] uppercase font-bold" className="text-primary">Followers</span>
                </button>
                <button onClick={() => openNetwork('following')} className="flex flex-col items-start hover:opacity-80">
                  <span className="font-bold text-sm" className="text-header">{followingCount}</span>
                  <span className="text-[10px] uppercase font-bold" className="text-primary">Following</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-5">
            <p className="text-sm whitespace-pre-wrap leading-relaxed" className="text-body">
              {userProfile?.bio || 'Add a bio...'}
            </p>
          </div>
          
          <button 
            onClick={() => setIsEditing(true)}
            className="w-full mt-6 py-2 rounded-xl text-sm font-bold transition-transform active:scale-95"
            style={{background: 'color-mix(in srgb, var(--theme-sidebar) 80%, white)', color: 'var(--theme-header)', border: '1px solid color-mix(in srgb, var(--theme-ring) 60%, transparent)'}}>
            Edit Profile
          </button>
          
          {/* MAXE PRO SECTION */}
          {userProfile?.is_premium ? (
            <div className="mt-8 space-y-6">
              <h3 className="font-black text-header text-lg border-b border-primary/20 pb-2">Pro Settings</h3>
              
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'var(--theme-header)'}}>App Theme</p>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { id:'default', label:'Mint',     bg:'#D3EDE0', primary:'#1B7A52' },
                    { id:'eastbay', label:'East Bay',  bg:'#E5E2CC', primary:'#393EA0' },
                    { id:'dolphin', label:'Dolphin',   bg:'#EDD9C9', primary:'#7A3A9A' },
                    { id:'venice',  label:'Venice',    bg:'#CCDFEE', primary:'#0C5E8A' },
                    { id:'lagoon',  label:'Lagoon',    bg:'#FAC8CC', primary:'#007080' },
                    { id:'berry',   label:'Berry',     bg:'#F3BEE2', primary:'#8A1868' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)} title={t.label} aria-label={`${t.label} Theme`}
                      className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden flex"
                        style={{boxShadow: theme===t.id ? `0 0 0 3px ${t.primary}, 0 4px 14px ${t.primary}55` : '0 2px 6px rgba(0,0,0,0.15)', transform: theme===t.id ? 'scale(1.14)' : 'scale(1)', transition:'all 0.2s'}}>
                        <div className="w-1/2 h-full" style={{background: t.bg}}></div>
                        <div className="w-1/2 h-full" style={{background: t.primary}}></div>
                      </div>
                      <span className="text-[9px] font-bold" style={{color:'var(--theme-body)', opacity:0.7}}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-header uppercase tracking-wider mb-3">Profile Effects</p>
                <div className="bg-surface border border-primary/20 rounded-xl p-4 flex flex-col gap-4">
                  
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold text-header text-sm">Nitro Animated Banner</h4>
                    <div className="flex gap-2">
                      <button onClick={() => setProfileEffects({...profileEffects, banner: 'none'})} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${profileEffects.banner==='none' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-body hover:bg-surface'}`}>None</button>
                      <button onClick={() => setProfileEffects({...profileEffects, banner: 'gradient'})} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${profileEffects.banner==='gradient' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-body hover:bg-surface'}`}>Nitro Gradient</button>
                    </div>
                  </div>
                  <div className="h-px w-full bg-primary/10 my-1"></div>
                  <div className="flex flex-col gap-2">
                    <h4 className="font-bold text-header text-sm">Avatar Decoration</h4>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setProfileEffects({...profileEffects, avatar: 'none'})} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${profileEffects.avatar==='none' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-body hover:bg-surface'}`}>None</button>
                      <button onClick={() => setProfileEffects({...profileEffects, avatar: 'neon-pulse'})} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${profileEffects.avatar==='neon-pulse' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-body hover:bg-surface'}`}>Neon Glow</button>
                      <button onClick={() => setProfileEffects({...profileEffects, avatar: 'spinning-ring'})} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${profileEffects.avatar==='spinning-ring' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-body hover:bg-surface'}`}>Spinning Ring</button>
                      <button onClick={() => setProfileEffects({...profileEffects, avatar: 'fire-aura'})} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${profileEffects.avatar==='fire-aura' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-body hover:bg-surface'}`}>Fire Aura</button>
                      <button onClick={() => setProfileEffects({...profileEffects, avatar: 'skeleton-hands'})} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${profileEffects.avatar==='skeleton-hands' ? 'border-primary bg-primary/10 text-primary' : 'border-primary/20 text-body hover:bg-surface'}`}>Skeleton Hands</button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <div>
                <h3 className="font-black text-header text-lg">Upgrade to Maxe Pro</h3>
                <p className="text-xs text-body mt-1">Get the Verified Badge, custom themes, and animated profile effects.</p>
                <button className="mt-3 bg-header text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-header/90 transition-colors">
                  Get Pro for ₹70
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-5 space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold" className="text-header">Edit Profile</h3>
            <button onClick={() => setIsEditing(false)} className="text-xs font-bold" style={{color:'#DC6B6B'}}>Cancel</button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
                style={{background:'rgba(107,168,152,0.12)', border:'2px solid color-mix(in srgb, var(--theme-primary) 30%, transparent)'}}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  : <User size={36} className="text-primary" />}
              </div>
              <label className="absolute -bottom-1 -right-1 rounded-xl p-2 cursor-pointer shadow"
                style={{background:'var(--theme-primary)', border:'2px solid #FFFFFF'}}>
                {uploading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera size={14} style={{color:'#FFFFFF'}} />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" className="text-body">Username</label>
            <input className="app-input" placeholder="Your unique username" value={username} onChange={e => {
              let val = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
              if (val.length > 0 && (val[0] === '_' || val[0] === '.')) val = val.substring(1);
              setUsername(val);
            }} />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" className="text-body">Name</label>
            <input className="app-input" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" className="text-body">College</label>
            <select className="app-input" value={college} onChange={e => setCollege(e.target.value)}>
              <option value="">Select college</option>
              {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" className="text-body">Branch</label>
            <select className="app-input" value={branch} onChange={e => setBranch(e.target.value)}>
              <option value="">Select branch</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>


          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" className="text-body">Bio</label>
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
        <h3 className="font-bold" className="text-header">Account</h3>
        <div className="card-sm p-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'#A8C5B8'}}>Email</p>
          <p className="text-sm font-medium mt-0.5" className="text-header">{session?.user?.email}</p>
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-5 w-full max-w-md shadow-xl shadow-primary/10 flex flex-col max-h-[80vh]">
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
                    <div key={user.id} onClick={() => setSelectedUser(user)} className="flex items-center gap-3 p-2 rounded-lg bg-surface border border-primary/15 cursor-pointer hover:border-primary transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/5 overflow-hidden flex items-center justify-center shrink-0">
                        {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={16} className="text-body" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-header truncate">{user.name}</p>
                        <p className="text-[10px] text-primary font-bold">@{user.username || 'user'}</p>
                      </div>
                      {!isMe && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFollow(user.id); }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${isFollowing ? 'bg-background text-header border border-primary/15' : 'bg-primary text-white'}`}
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
        <UserProfilePopup 
          userId={selectedUser.id} 
          onClose={() => setSelectedUser(null)} 
          currentUserId={session?.user?.id}
          onFollowChange={(id, isFollowing) => {
            setFollowingMap(prev => ({ ...prev, [id]: isFollowing }));
            if (networkType === 'following') {
               setFollowingCount(prev => isFollowing ? prev + 1 : prev - 1);
            }
          }}
        />
      )}

      {/* Big Avatar Popup */}
      {showAvatarPopup && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowAvatarPopup(false)}>
          
          <button onClick={() => setShowAvatarPopup(false)} className="absolute top-6 right-6 p-2 text-white hover:bg-white/50 rounded-full transition-colors">
            <X size={28} />
          </button>
          
          <div className="relative w-full max-w-sm aspect-square bg-surface rounded-3xl overflow-hidden shadow-xl shadow-primary/10 animate-slide-up" onClick={e => e.stopPropagation()}>
            {userProfile?.avatar_url ? (
              <img src={userProfile?.avatar_url} className="w-full h-full object-cover" alt="avatar" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{background: 'rgba(107,168,152,15%, transparent)'}}>
                <User size={120} className="text-primary" />
              </div>
            )}
            
            <label className="absolute bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-primary/10 cursor-pointer hover:scale-105 transition-transform text-white border-2 border-white" style={{background:'var(--theme-primary)'}}>
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

