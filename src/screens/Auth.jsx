import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [branch, setBranch] = useState('');
  const [showPass, setShowPass] = useState(false);
  const BRANCHES = ['CSE', 'CSM', 'IT', 'CSC', 'EEE', 'MECH', 'CIVIL', 'ECE'];
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [msg, setMsg] = useState(null);
  const { session } = useAppContext();
  const navigate = useNavigate();

  React.useEffect(() => { if (session) navigate('/'); }, [session, navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              username: username,
              branch: branch
            }
          }
        });
        if (error) throw error;
        
        // Also manually insert into profiles table immediately if we have a user
        if (data?.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            username: username,
            branch: branch
          });
        }
        
        if (data?.session) {
          navigate('/');
        }
        else { 
          setMsg({ type:'success', text:'Account created! Please sign in.' }); 
          setIsLogin(true); 
        }
      }
    } catch (err) {
      setMsg({ type:'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in" style={{background:'#EDF4F0'}}>
      {/* Soft decorative bg circles */}
      <div className="fixed top-0 right-0 w-72 h-72 rounded-full pointer-events-none" style={{background:'rgba(107,168,152,0.08)', transform:'translate(30%,-30%)'}} />
      <div className="fixed bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none" style={{background:'rgba(168,197,184,0.1)', transform:'translate(-30%,30%)'}} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo text */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Maxe Logo" className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-md" />
          <h1 className="text-3xl font-black text-aberration" style={{color:'#2D4A3E'}}>Maxe</h1>
          <p className="text-sm mt-1" style={{color:'#6BA898'}}>Your academic study hub</p>
        </div>

        <div className="card p-6 space-y-5">
          {/* Sign in / Sign up tabs */}
          <div className="flex rounded-xl p-1 gap-1" style={{background:'#EAF4EF'}}>
            {['Sign In', 'Create Account'].map((t, i) => (
              <button key={t}
                onClick={() => { setIsLogin(i === 0); setMsg(null); }}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                style={isLogin === (i === 0)
                  ? {background:'#6BA898', color:'#FFFFFF', boxShadow:'0 2px 8px rgba(107,168,152,0.3)'}
                  : {background:'transparent', color:'#5E7A6E'}}>
                {t}
              </button>
            ))}
          </div>

          {msg && (
            <div className="p-3 rounded-xl text-xs font-medium" style={{
              background: msg.type === 'success' ? 'rgba(107,168,152,0.12)' : 'rgba(220,107,107,0.1)',
              color: msg.type === 'success' ? '#3D7A6A' : '#DC6B6B',
              border: `1px solid ${msg.type === 'success' ? 'rgba(107,168,152,0.25)' : 'rgba(220,107,107,0.2)'}`,
            }}>{msg.text}</div>
          )}

          <form onSubmit={handleAuth} className="space-y-3">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#5E7A6E'}}>Username (Unique)</label>
                  <input
                    type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="e.g. john_doe123" className="app-input" required={!isLogin}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#5E7A6E'}}>Branch</label>
                  <select 
                    value={branch} 
                    onChange={e => setBranch(e.target.value)} 
                    className="app-input" 
                    required={!isLogin}
                  >
                    <option value="" disabled>Select your branch</option>
                    {BRANCHES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#5E7A6E'}}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className="app-input" required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#5E7A6E'}}>Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="app-input pr-10" required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'#A8C5B8'}}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm mt-1">
              {loading ? 'Processing...' : isLogin ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <div className="flex items-center gap-2 text-xs" style={{color:'#A8C5B8'}}>
            <div className="flex-1 h-px" style={{background: 'rgba(107,168,152,0.2)'}}></div>
            <span>OR</span>
            <div className="flex-1 h-px" style={{background: 'rgba(107,168,152,0.2)'}}></div>
          </div>

          <button 
            type="button" 
            onClick={async () => {
              try {
                const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
                if (error) throw error;
              } catch (err) {
                setMsg({ type:'error', text: err.message });
              }
            }}
            className="w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-3 transition-colors shadow-sm"
            style={{background: '#FFFFFF', border: '1px solid rgba(107,168,152,0.3)', color: '#3F5E56'}}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-[10px] mt-4" style={{color:'#A8C5B8'}}>
            Your data is stored securely · Log in from any device
          </p>
        </div>
      </div>
    </div>
  );
}
