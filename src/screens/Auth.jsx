import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
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
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.session) navigate('/');
        else { setMsg({ type:'success', text:'Account created! Please sign in.' }); setIsLogin(true); }
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

          <p className="text-center text-xs" style={{color:'#A8C5B8'}}>
            Your data is stored securely · Log in from any device
          </p>
        </div>
      </div>
    </div>
  );
}
