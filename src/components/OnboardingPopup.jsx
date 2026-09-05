import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BRANCHES, COLLEGES } from '../lib/constants';
import { useAppContext } from '../context/AppContext';
import { User, BookOpen } from 'lucide-react';

export default function OnboardingPopup() {
  const { session, fetchProfile } = useAppContext();
  const [username, setUsername] = useState('');
  const [branch, setBranch] = useState('');
  const [college, setCollege] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (session?.user?.email && !username) {
      let base = session.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      setUsername(base + Math.floor(Math.random() * 100));
    }
  }, [session]);


  const [usernameError, setUsernameError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !branch || !college) return;
    
    setLoading(true);
    setError(null);
    setUsernameError(null);
    
    try {
      const user = session?.user;
      if (!user) throw new Error("No active session.");

      // Check if username is already taken by someone else
      const { data: existing } = await supabase.from('profiles').select('id').eq('username', username).neq('id', user.id).maybeSingle();
      if (existing) {
        setUsernameError("Username unavailable, already taken.");
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: username.toLowerCase().replace(/[^a-z0-9_.]/g, ''),
        branch: branch,
        college: college,
        name: user.user_metadata?.full_name || user.user_metadata?.name || username,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      }, { onConflict: 'id' });

      if (updateError) {
        if (updateError.code === '23505') {
          setUsernameError("Username unavailable, already taken.");
          setLoading(false);
          return;
        }
        throw updateError;
      }
      
      // Success! Fetch the new profile to unblock the app
      await fetchProfile(user.id);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="card w-full max-w-sm p-6 space-y-6 shadow-2xl border-2 border-primary/20 animate-slide-up bg-white">
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-black text-header">Welcome to Maxe!</h2>
          <p className="text-sm text-body">Complete your profile to join the community and start your academic journey.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-body flex items-center gap-1.5">
              <User size={14} className="text-primary"/> Pick a Username
            </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => {
                  let val = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
                  if (val.length > 0 && (val[0] === '_' || val[0] === '.')) val = val.substring(1);
                  setUsername(val);
                  if (usernameError) setUsernameError(null);
                }}
                placeholder="e.g. rohit.67"
                className={`app-input w-full bg-surface ${usernameError ? 'border-[var(--theme-header)]' : ''}`}
                maxLength={20}
              />
              {usernameError ? (
                <p className="text-[11px] font-bold px-1" style={{color: 'var(--theme-header)'}}>{usernameError}</p>
              ) : (
                <p className="text-[10px] text-body/60 px-1">Letters, numbers, underscores, and dots. Must start with letter/number.</p>
              )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-body flex items-center gap-1.5">
              <BookOpen size={14} className="text-primary"/> Select Your College
            </label>
            <select
              required
              value={college}
              onChange={e => setCollege(e.target.value)}
              className="app-input w-full bg-surface"
            >
              <option value="" disabled>Choose college...</option>
              {COLLEGES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-body flex items-center gap-1.5">
              <BookOpen size={14} className="text-primary"/> Select Your Branch
            </label>
            <select
              required
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className="app-input w-full bg-surface"
            >
              <option value="" disabled>Choose branch...</option>
              {BRANCHES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading || !username || !branch}
            className="btn-primary w-full py-3.5 text-sm rounded-xl mt-4"
          >
            {loading ? 'Setting up...' : 'Get Started 🚀'}
          </button>
        </form>
        
      </div>
    </div>
  );
}
