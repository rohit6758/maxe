import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { User, Save, UploadCloud } from 'lucide-react';

export default function Profile() {
  const { session, userProfile, fetchProfile, setUserProfile } = useAppContext();
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setBio(userProfile.bio || '');
      setDepartment(userProfile.department || '');
      setCgpa(userProfile.cgpa || '');
    }
  }, [userProfile]);

  const handleSave = async () => {
    setLoading(true);
    const updates = {
      id: session.user.id,
      name,
      bio,
      department,
      cgpa: parseFloat(cgpa) || null,
    };

    const { error } = await supabase.from('profiles').upsert(updates);
    if (!error) {
      setUserProfile({ ...userProfile, ...updates });
      alert('Profile updated!');
    } else {
      alert('Error updating profile: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-6 md:p-8">
      <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
        <User className="text-primary w-8 h-8" />
        <h2 className="text-2xl font-bold text-header">Student Profile</h2>
      </div>

      <div className="bg-surface p-6 rounded-2xl border border-[#1e293b] space-y-4">
        
        {/* Avatar mock */}
        <div className="flex items-center gap-4">
           <div className="w-20 h-20 bg-[#080F1D] border-2 border-primary rounded-full flex items-center justify-center overflow-hidden">
             {userProfile?.avatar_url ? (
               <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
               <User className="w-10 h-10 text-body" />
             )}
           </div>
           <button className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors">
              <UploadCloud size={16} /> Upload Avatar
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-body mb-1">FULL NAME</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-[#080F1D] border border-[#1e293b] text-header rounded-xl p-3"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-body mb-1">DEPARTMENT</label>
            <input 
              type="text" 
              value={department} 
              onChange={e => setDepartment(e.target.value)} 
              className="w-full bg-[#080F1D] border border-[#1e293b] text-header rounded-xl p-3"
              placeholder="e.g. Computer Science"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-body mb-1">CGPA</label>
            <input 
              type="number" 
              step="0.01"
              value={cgpa} 
              onChange={e => setCgpa(e.target.value)} 
              className="w-full bg-[#080F1D] border border-[#1e293b] text-header rounded-xl p-3"
              placeholder="e.g. 3.8"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-body mb-1">BIO</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              className="w-full bg-[#080F1D] border border-[#1e293b] text-header rounded-xl p-3 h-24"
              placeholder="A short bio about your academic interests..."
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-6 rounded-xl hover:bg-primary/90 transition-colors shadow-lg"
          >
            <Save size={18} /> {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
