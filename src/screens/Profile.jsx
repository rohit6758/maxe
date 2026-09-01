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
  const [showNetwork, setShowNetwork] = useState(false);
  const [networkType, setNetworkType] = useState('followers'); // 'followers' or 'following'
  const [networkList, setNetworkList] = useState([]);

  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (session) {
      loadFollowStats();
    }
  }, [session]);

  
  const openNetwork = async (type) => {
    setNetworkType(type);
    setShowNetwork(true);
    setNetworkList([]);
    const column = type === 'followers' ? 'following_id' : 'follower_id';
    const selectCol = type === 'followers' ? 'follower_id' : 'following_id';
    
    const { data, error } = await supabase.from('follows').select(selectCol).eq(column, session.user.id);
    if (error) { alert('Error loading network'); return; }
    if (data && data.length > 0) {
      const ids = data.map(d => d[selectCol]);
      const { data: profiles } = await supabase.from('profiles').select('id, name, username, avatar_url, branch').in('id', ids);
      setNetworkList(profiles || []);
    }
  };
const loadFollowStats = async () => {
    const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', session.user.id);
    const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', session.user.id);
    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);
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
      
      // Instantly update database
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', session.user.id);
      setUserProfile(prev => ({ ...prev, avatar_url: url }));
      
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
        if (regs.length > 0) {
          for (let reg of regs) {
            await reg.update();
          }
          // The index.html listener will automatically reload the page if an update is found.
          // If we reach here after 2 seconds, no update was found.
          setTimeout(() => {
            alert('Your app is already up to date! 🚀');
            setCheckingUpdate(false);
          }, 2000);
        } else {
          setCheckingUpdate(false);
        }
      } catch (e) {
        setCheckingUpdate(false);
      }
    } else {
      alert('App updates are not supported in this browser.');
      setCheckingUpdate(false);
    }
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

      <div className="card overflow-hidden">
        {/* Big Avatar Area */}
        <div className="w-full aspect-square flex items-center justify-center relative" style={{background: 'rgba(107,168,152,0.15)'}}>
          {userProfile?.avatar_url ? (
            <img src={userProfile?.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={80} style={{color:'#6BA898'}} />
          )}
          
          <label className="absolute bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform text-white" style={{background:'#6BA898'}}>
            {uploading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Camera size={24} />
            )}
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
              await handleAvatarUpload(e);
              // Save it to DB instantly
              if (session) {
                const url = avatarUrl || e.target.files?.[0]?.url;
                if (!url) {
                  // We need the new url from handleAvatarUpload, so let's use a trick
                  setTimeout(async () => {
                     // The state might take a tick to update, the best way is to fetch profile again or just let userProfile handle it
                     const { data } = await supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single();
                     if (data) setUserProfile(prev => ({...prev, avatar_url: data.avatar_url}));
                  }, 2000);
                }
              }
            }} />
          </label>
        </div>

        <div className="p-6 text-center">
          <h2 className="text-3xl font-black truncate text-header" style={{color:'#2D4A3E'}}>{userProfile?.name || userProfile?.username || 'Student'}</h2>
          <p className="text-sm font-bold mt-1 tracking-widest uppercase" style={{color:'#6BA898'}}>@{userProfile?.username || 'username'}</p>
          <p className="text-sm font-semibold mt-2" style={{color:'#5E7A6E'}}>{userProfile?.branch ? `Branch: ${userProfile.branch}` : 'No branch selected'}</p>
          
          <div className="flex justify-center gap-8 mt-6 pt-6 border-t" style={{borderColor: 'rgba(107,168,152,0.15)'}}>
            <button onClick={() => openNetwork('followers')} className="flex flex-col items-center hover:opacity-80">
              <span className="font-black text-2xl" style={{color:'#2D4A3E'}}>{followerCount}</span>
              <span className="text-xs uppercase font-bold" style={{color:'#6BA898'}}>Followers</span>
            </button>
            <button onClick={() => openNetwork('following')} className="flex flex-col items-center hover:opacity-80">
              <span className="font-black text-2xl" style={{color:'#2D4A3E'}}>{followingCount}</span>
              <span className="text-xs uppercase font-bold" style={{color:'#6BA898'}}>Following</span>
            </button>
          </div>
        </div>
      </div>



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
              {networkList.length === 0 ? (
                <p className="text-center text-xs text-body italic mt-4">No {networkType} found.</p>
              ) : (
                networkList.map(user => (
                  <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface border border-[#333]">
                    <div className="w-10 h-10 rounded-full bg-black/5 overflow-hidden flex items-center justify-center shrink-0">
                      {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-header truncate">{user.name}</p>
                      <p className="text-[10px] text-primary font-bold">@{user.username || 'user'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

