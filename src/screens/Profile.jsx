import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { User, Save, UploadCloud, LogOut } from 'lucide-react';

export default function Profile() {
  const { session, userProfile, fetchProfile } = useAppContext();
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [branch, setBranch] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setBio(userProfile.bio || '');
      setBranch(userProfile.branch || '');
      setAvatarUrl(userProfile.avatar_url || null);
    }
  }, [userProfile]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      name,
      bio,
      branch,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    });
    if (!error && fetchProfile) await fetchProfile(session.user.id);
    setSaving(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const filePath = `avatars/${session.user.id}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('uploads').upload(filePath, file, { upsert: true });
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="p-4 md:p-6 space-y-5 pb-24 md:pb-8">

      {/* Header */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-2xl font-bold text-header text-aberration">Profile</h2>
        <p className="text-body text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Avatar */}
      <div className="glass rounded-2xl p-5 flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-cyan-400/30 flex items-center justify-center" style={{background: 'rgba(56,189,248,0.1)'}}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={36} className="text-cyan-400" />
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 glass-btn p-2 rounded-xl cursor-pointer shadow-lg">
            <UploadCloud size={14} />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>
        {uploading && <p className="text-cyan-400 text-xs animate-pulse">Uploading...</p>}
        <div className="text-center">
          <p className="text-header font-bold">{name || 'Your Name'}</p>
          <p className="text-body text-xs mt-0.5">{session?.user?.email}</p>
        </div>
      </div>

      {/* Edit Form */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h3 className="text-header font-bold">Edit Profile</h3>
        
        <div>
          <label className="block text-xs font-semibold text-body uppercase tracking-wider mb-1.5">Display Name</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            className="glass-input w-full rounded-xl p-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-body uppercase tracking-wider mb-1.5">Branch</label>
          <select
            value={branch} onChange={e => setBranch(e.target.value)}
            className="glass-input w-full rounded-xl p-3 text-sm cursor-pointer"
          >
            <option value="">Select branch</option>
            {['CSE', 'CSM', 'IT', 'CSC', 'EEE', 'MECH', 'CIVIL', 'ECE'].map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-body uppercase tracking-wider mb-1.5">Bio</label>
          <textarea
            value={bio} onChange={e => setBio(e.target.value)}
            placeholder="About yourself..."
            rows={3}
            className="glass-input w-full rounded-xl p-3 text-sm resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="glass-btn-primary w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Account */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <h3 className="text-header font-bold">Account</h3>
        <div className="glass-card rounded-xl p-3">
          <p className="text-xs text-body uppercase tracking-wider">Email</p>
          <p className="text-header text-sm mt-0.5">{session?.user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20"
          style={{background: 'rgba(239,68,68,0.05)'}}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
