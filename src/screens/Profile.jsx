import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { User, Save, UploadCloud, LogOut, Camera } from 'lucide-react';

export default function Profile() {
  const { session, userProfile, setUserProfile } = useAppContext();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [branch, setBranch] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (session) {
      loadFollowStats();
    }
  }, [session]);

  const loadFollowStats = async () => {
    const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', session.user.id);
    const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', session.user.id);
    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);
  };

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
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
      const path = `avatars/${session.user.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('uploads')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(url);
    } catch (err) {
      alert('Avatar upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
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
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex items-center justify-center shrink-0 border-2"
              style={{borderColor: 'rgba(107,168,152,0.3)', background: 'rgba(107,168,152,0.1)'}}>
              {userProfile?.avatar_url
                ? <img src={userProfile?.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <User size={40} style={{color:'#6BA898'}} />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold truncate" style={{color:'#2D4A3E'}}>{userProfile?.name || 'Your Name'}</h2>
              <p className="text-xs md:text-sm font-semibold mt-0.5" style={{color:'#6BA898'}}>{userProfile?.branch || 'No branch selected'}</p>
              
              <div className="flex gap-4 mt-2">
                <div className="flex flex-col items-start">
                  <span className="font-bold text-sm" style={{color:'#2D4A3E'}}>{followerCount}</span>
                  <span className="text-[10px] uppercase font-bold" style={{color:'#6BA898'}}>Followers</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-sm" style={{color:'#2D4A3E'}}>{followingCount}</span>
                  <span className="text-[10px] uppercase font-bold" style={{color:'#6BA898'}}>Following</span>
                </div>
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
    </div>
  );
}

