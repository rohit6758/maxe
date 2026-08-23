import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);
  const { session } = useAppContext();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (session) navigate('/');
  }, [session, navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.session) {
          navigate('/');
        } else {
          setError('Account created! Please sign in now.');
          setIsLogin(true);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: '#020c1b', backgroundImage: 'radial-gradient(ellipse at 20% 30%, rgba(14,60,120,0.7) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(6,50,110,0.6) 0%, transparent 50%)'}}>
      
      {/* Glow orbs */}
      <div className="fixed top-20 left-20 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{background: 'rgba(56,189,248,0.08)'}} />
      <div className="fixed bottom-20 right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{background: 'rgba(6,182,212,0.06)'}} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/logo.png" alt="Maxe" className="w-12 h-12 rounded-xl" style={{boxShadow: '0 0 24px rgba(56,189,248,0.5)'}} />
            <h1 className="text-4xl font-bold text-header text-aberration">Maxe</h1>
          </div>
          <p className="text-body text-sm">Your academic study hub</p>
        </div>

        <div className="glass-strong rounded-2xl p-6 space-y-5" style={{boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(56,189,248,0.1)'}}>
          
          {/* Tabs */}
          <div className="flex glass rounded-xl p-1 gap-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isLogin ? 'glass-btn-primary' : 'text-body hover:text-header'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'glass-btn-primary' : 'text-body hover:text-header'}`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className={`p-3 rounded-xl text-xs ${error.includes('created') ? 'text-emerald-400 border border-emerald-400/20' : 'text-red-400 border border-red-400/20'}`} style={{background: error.includes('created') ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-body uppercase tracking-widest mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="glass-input w-full rounded-xl p-3 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-body uppercase tracking-widest mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full rounded-xl p-3 pr-10 text-sm"
                  required
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-body hover:text-header transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="glass-btn-primary w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 mt-2"
            >
              {loading ? 'Processing...' : (isLogin ? '→ Sign In' : '→ Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
