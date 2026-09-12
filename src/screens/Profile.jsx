import { toast } from '../context/ToastContext';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BRANCHES, COLLEGES } from '../lib/constants';
import { useAppContext } from '../context/AppContext';
import { User, Save, UploadCloud, LogOut, Camera, Users, X, Sparkles, CheckSquare } from 'lucide-react';
import VerifiedBadge from '../components/VerifiedBadge';
import UserProfilePopup from '../components/UserProfilePopup';
import ProSettingsModal from '../components/ProSettingsModal';
import ImageCropper from '../components/ImageCropper';
import AppDialog from '../components/AppDialog';
import { normalizeUsername, validateUsername } from '../lib/username';

export default function Profile() {
  const { session, userProfile, setUserProfile, profileEffects } = useAppContext();


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
  const [followStatsLoading, setFollowStatsLoading] = useState(true);
  
  const [followingMap, setFollowingMap] = useState({});
  const [selectedUser, setSelectedUser] = useState(null); // For Profile Popup
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);
  const [showProModal, setShowProModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    if (error) { toast('Error loading network'); setIsLoadingNetwork(false); return; }
    if (data && data.length > 0) {
      const ids = data.map(d => d[selectCol]);
      const { data: profiles } = await supabase.from('profiles').select('id, name, username, avatar_url, branch').in('id', ids);
      setNetworkList(profiles || []);
    }
    setIsLoadingNetwork(false);
  };
const loadFollowStats = async () => {
    setFollowStatsLoading(true);
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', session.user.id),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', session.user.id)
    ]);
    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);
    setFollowStatsLoading(false);
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

  const removeFollowerFromNetwork = (e, user) => {
    e.stopPropagation();
    setShowRemoveConfirm(user);
  };

  const confirmRemoveFollower = async () => {
    if (!showRemoveConfirm) return;
    const followerId = showRemoveConfirm.id;
    
    setNetworkList(prev => prev.filter(u => u.id !== followerId));
    setFollowerCount(prev => Math.max(0, prev - 1));
    setShowRemoveConfirm(null);

    const { error } = await supabase.from('follows').delete().match({ follower_id: followerId, following_id: session.user.id });
    if (error) {
      toast('Could not remove follower: ' + error.message, 'error');
    }
  };

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

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => setCropImageSrc(reader.result));
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleCroppedAvatarUpload = async (file) => {
    setCropImageSrc(null);
    if (!file || !session) return;
    setUploading(true);
    try {
      const path = `avatars/${session.user.id}_${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('uploads')
        .upload(path, file, { upsert: true, contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      const url = `${data.publicUrl}`;
      
      // Instantly update database so popup uploads save immediately
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', session.user.id);
      if (profileError) throw profileError;
      setUserProfile(prev => ({ ...prev, avatar_url: url }));
      setAvatarUrl(url);
      
    } catch (err) {
      toast('Avatar upload failed: ' + err.message);
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
    const normalizedUsername = normalizeUsername(username);
    const usernameError = validateUsername(normalizedUsername);
    if (usernameError) {
      toast(usernameError);
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        username: normalizedUsername,
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
        toast('This username is already taken. Please choose another one.');
      } else {
        toast('Save failed: ' + error.message);
      }
    } else if (data) {
      setUserProfile(data);
      setSaved(true);
      setTimeout(() => { setSaved(false); setIsEditing(false); }, 1000);
    }
    else {
      toast('Profile was not updated. Please try again.', 'error');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-3 pb-24 md:pb-8">

      {!isEditing ? (
        <div className="card relative overflow-hidden" style={{
          padding: 0,
          ...(profileEffects?.wallpaper && profileEffects.wallpaper !== 'none' ? {
            background: profileEffects.wallpaper === 'custom' && profileEffects.customWallpaperUrl ? `url('${profileEffects.customWallpaperUrl}')` :
                        profileEffects.wallpaper === 'dots' ? 'radial-gradient(circle, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                        profileEffects.wallpaper === 'grid' ? 'linear-gradient(var(--theme-ring) 1px, transparent 1px), linear-gradient(90deg, var(--theme-ring) 1px, var(--theme-surface) 1px)' :
                        profileEffects.wallpaper === 'waves' ? 'repeating-linear-gradient(-45deg, var(--theme-ring), var(--theme-ring) 1px, var(--theme-surface) 1px, var(--theme-surface) 8px)' : undefined,
            backgroundSize: profileEffects.wallpaper === 'custom' ? 'cover' : profileEffects.wallpaper === 'waves' ? 'auto' : '20px 20px',
            backgroundPosition: 'center',
          } : {})
        }}>
          {profileEffects?.wallpaper === 'custom' && profileEffects.customWallpaperUrl && (
            <div className="absolute inset-0 bg-black/20 pointer-events-none" aria-hidden="true" />
          )}
          {/* Compact profile row */}
          <div className="flex items-center gap-4 relative z-10 px-4 pt-4">
            <div
              onClick={() => setShowAvatarPopup(true)}
              className="relative w-20 h-20 shrink-0 cursor-pointer hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center border-[3px] relative z-10"
                style={{borderColor: 'color-mix(in srgb, var(--theme-primary) 35%, transparent)', background:'color-mix(in srgb, var(--theme-sidebar) 60%, white)'}}>
                {userProfile?.avatar_url
                  ? <img src={userProfile?.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <User size={32} style={{color:'var(--theme-primary)'}} />}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-black flex items-center gap-1.5" style={{color:'var(--theme-header)', textShadow:'0 1px 4px rgba(255,255,255,0.7)'}}>
                {userProfile?.name || 'Your Name'}
                {userProfile?.is_premium && <VerifiedBadge />}
              </h2>
              <p className="text-sm font-bold mt-0.5" style={{color:'var(--theme-primary)', textShadow:'0 1px 3px rgba(255,255,255,0.5)'}}>@{userProfile?.username || 'username'}</p>
              <p className="text-xs font-semibold mt-0.5" style={{color:'var(--theme-body)'}}>{userProfile?.branch || ''}{userProfile?.college ? ` • ${userProfile.college}` : ''}</p>
              <div className="flex gap-4 mt-2">
                <button onClick={() => openNetwork('followers')} className="flex items-center gap-1.5 hover:opacity-80">
                  <span className="text-sm font-black" style={{color:'var(--theme-header)'}}>{followStatsLoading ? '…' : followerCount}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{color:'var(--theme-body)'}}>Followers</span>
                </button>
                <button onClick={() => openNetwork('following')} className="flex items-center gap-1.5 hover:opacity-80">
                  <span className="text-sm font-black" style={{color:'var(--theme-header)'}}>{followStatsLoading ? '…' : followingCount}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{color:'var(--theme-body)'}}>Following</span>
                </button>
              </div>
            </div>
          </div>
          {userProfile?.bio && (
            <div className="relative z-10 mt-2 px-4">
              <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{color:'var(--theme-body)'}}>{userProfile.bio}</p>
            </div>
          )}
          <div className="flex gap-2 mt-4 relative z-10 px-4 pb-4">
            <button onClick={() => setIsEditing(true)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 bg-white/80 backdrop-blur-sm"
              style={{color:'var(--theme-header)', border:'1px solid color-mix(in srgb, var(--theme-ring) 60%, transparent)'}}>
              Edit Profile
            </button>
            <button onClick={() => setShowProModal(true)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 bg-white/80 backdrop-blur-sm shadow-sm"
              style={{color:'var(--theme-primary)', border:'1px solid color-mix(in srgb, var(--theme-primary) 40%, transparent)'}}>
              Settings
            </button>
          </div>
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

          <button type="button" onClick={handleSave} disabled={saving || uploading}
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
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          style={{background:'rgba(220,107,107,0.08)', border:'1.5px solid rgba(220,107,107,0.2)', color:'#DC6B6B'}}>
          <LogOut size={16} /> Log out
        </button>
      </div>

      {showLogoutConfirm && <AppDialog
        type="confirm"
        title="Log out of Maxe?"
        message="Are you sure you want to log out?"
        confirmText="Log out"
        danger
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={async () => { await supabase.auth.signOut(); window.location.reload(); }}
      />}

      {showProModal && <ProSettingsModal isOpen={showProModal} onClose={() => setShowProModal(false)} />}

      {/* Network Modal */}
      {showNetwork && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative card p-5 w-full max-w-md shadow-xl shadow-primary/10 flex flex-col max-h-[80vh]">
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
                      <div className="flex gap-2">
                        {networkType === 'followers' && !isMe && (
                          <button onClick={(e) => { e.stopPropagation(); setShowRemoveConfirm(user); }} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
                            Remove
                          </button>
                        )}
                        {networkType === 'following' && !isMe && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleFollow(user.id); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${isFollowing ? 'bg-background text-header border border-primary/15' : 'bg-primary text-white'}`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Remove Follower Confirmation - layered inside the card */}
            {showRemoveConfirm && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center p-6 rounded-2xl">
                <div className="bg-surface p-6 rounded-2xl shadow-2xl w-full text-center">
                  <h4 className="text-header font-bold text-lg mb-2">Remove Follower?</h4>
                  <p className="text-sm text-body mb-6">Remove <span className="font-bold text-header">@{showRemoveConfirm.username}</span> from your followers?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowRemoveConfirm(null)} className="flex-1 px-4 py-2 rounded-lg font-bold text-body bg-background border border-primary/10">Cancel</button>
                    <button onClick={confirmRemoveFollower} className="flex-1 px-4 py-2 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600">Remove</button>
                  </div>
                </div>
              </div>
            )}
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
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>
          
          <div className="mt-6 text-center animate-slide-up">
            <h2 className="text-2xl font-black text-white">{userProfile?.name || 'Your Name'}</h2>
            <p className="text-sm font-bold mt-1 tracking-widest uppercase text-white/70">@{userProfile?.username || 'username'}</p>
          </div>

        </div>
      )}

      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          aspectRatio={1}
          onCropComplete={handleCroppedAvatarUpload}
          onCancel={() => setCropImageSrc(null)}
        />
      )}

    </div>
  );
}
