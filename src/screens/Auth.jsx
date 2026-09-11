import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Mail, Lock, AtSign, ArrowLeft } from 'lucide-react';

export default function Auth() {
  const [tab, setTab] = useState(() => {
    // Supabase appends #access_token=...&type=recovery or ?type=recovery
    if (window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
      return 'update';
    }
    return 'login';
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Pre-fill from ?hint= param
  const [loginId, setLoginId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('hint') || '';
  });
  const [loginPass, setLoginPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Reset/Update fields
  const [resetEmail, setResetEmail] = useState('');
  const [newPass, setNewPass] = useState('');

  const setErr = (text) => setMsg({ type: 'error', text });
  const setOk  = (text) => setMsg({ type: 'success', text });

  useEffect(() => {
    // Check if we just clicked a recovery link in email
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setTab('update');
        setMsg(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  /* ── Google OAuth ── */
  const handleGoogle = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err) {
      setErr(err.message);
      setLoading(false);
    }
  };

  /* ── Email / Username + Password login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !loginPass) return setErr('Enter your email or username and password.');
    setLoading(true);
    setMsg(null);

    try {
      let email = loginId.trim();

      if (!email.includes('@')) {
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('username', email.toLowerCase())
          .maybeSingle();

        if (profErr || !profile) {
          setLoading(false);
          return setErr('No account found with that username.');
        }

        if (!profile.email) {
          setLoading(false);
          return setErr('Could not find email for that username. Try signing in with your email instead.');
        }
        email = profile.email;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password: loginPass });
      if (error) {
        if (error.message.includes('Invalid login')) {
          return setErr('Wrong email or password. Did you sign up with Google? Try "Continue with Google" instead.');
        }
        throw error;
      }
    } catch (err) {
      setErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Forgot Password ── */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) return setErr('Please enter your email.');
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
      if (error) throw error;
      setOk('Password reset email sent! Check your inbox.');
    } catch (err) {
      setErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Update Password (after clicking recovery link) ── */
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPass) return setErr('Please enter a new password.');
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      setOk('Password updated successfully! You can now log in.');
      setTab('login');
      setLoginPass('');
      window.history.replaceState(null, '', window.location.pathname); // clear the #access_token from URL
    } catch (err) {
      setErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  const GoogleButton = () => (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      className="w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
      style={{
        background: '#FFFFFF',
        color: 'var(--theme-header)',
        border: '2px solid color-mix(in srgb, var(--theme-primary) 15%, transparent)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {loading ? 'Connecting...' : 'Continue with Google'}
    </button>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'var(--theme-bg)' }}
    >
      <div className="fixed top-0 right-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'rgba(107,168,152,0.08)', transform: 'translate(30%,-30%)' }} />
      <div className="fixed bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'rgba(168,197,184,0.1)', transform: 'translate(-30%,30%)' }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <img src="/icon-192x192.png" alt="Maxe Logo" className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-md" />
          <h1 className="text-3xl font-black" style={{ color: 'var(--theme-header)' }}>Maxe</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--theme-primary)' }}>Your academic study hub</p>
        </div>

        <div className="card p-6 space-y-5">
          {/* Tab switcher - hide during forgot/update flows */}
          {(tab === 'login' || tab === 'signup') && (
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'color-mix(in srgb, var(--theme-ring) 60%, transparent)' }}>
              {['login', 'signup'].map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setMsg(null); }}
                  className="flex-1 py-2.5 text-sm font-bold capitalize transition-all"
                  style={{
                    background: tab === t ? 'var(--theme-primary)' : 'transparent',
                    color: tab === t ? '#fff' : 'var(--theme-body)',
                  }}
                >
                  {t === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              ))}
            </div>
          )}

          {msg && (
            <div
              className="p-3 rounded-xl text-xs font-medium text-center"
              style={{
                background: msg.type === 'success' ? 'rgba(107,168,152,0.12)' : 'rgba(220,107,107,0.1)',
                color: msg.type === 'success' ? '#3D7A6A' : '#DC6B6B',
                border: `1px solid ${msg.type === 'success' ? 'rgba(107,168,152,0.25)' : 'rgba(220,107,107,0.2)'}`,
              }}
            >
              {msg.text}
            </div>
          )}

          {/* ── LOGIN TAB ── */}
          {tab === 'login' && (
            <>
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="relative">
                  <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body pointer-events-none" />
                  <input
                    className="app-input w-full"
                    style={{ paddingLeft: '36px' }}
                    type="text"
                    placeholder="Email or username"
                    value={loginId}
                    onChange={e => setLoginId(e.target.value)}
                    autoComplete="username"
                  />
                </div>
                <div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body pointer-events-none" />
                    <input
                      className="app-input w-full"
                      style={{ paddingLeft: '36px', paddingRight: '40px' }}
                      type={showPass ? 'text' : 'password'}
                      placeholder="Password"
                      value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-body hover:text-header"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="text-right mt-1.5">
                    <button 
                      type="button" 
                      onClick={() => { setTab('forgot'); setMsg(null); }}
                      className="text-xs font-semibold hover:underline"
                      style={{ color: 'var(--theme-primary)' }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 font-bold text-sm mt-2">
                  {loading ? 'Logging in…' : 'Log In'}
                </button>
              </form>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'color-mix(in srgb, var(--theme-ring) 50%, transparent)' }} />
                <span className="text-xs text-body">or</span>
                <div className="flex-1 h-px" style={{ background: 'color-mix(in srgb, var(--theme-ring) 50%, transparent)' }} />
              </div>

              <GoogleButton />
              
              <p className="text-center text-xs" style={{ color: 'var(--theme-body)' }}>
                Signed up with Google? Use the Google button above.
              </p>
            </>
          )}

          {/* ── SIGN UP TAB ── */}
          {tab === 'signup' && (
            <>
              <div className="text-center px-2 pb-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--theme-header)' }}>
                  Create your account with Google
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--theme-body)' }}>
                  New accounts are created through Google sign-in to keep Maxe safe and verified.
                </p>
              </div>

              <GoogleButton />

              <p className="text-center text-xs" style={{ color: 'var(--theme-body)' }}>
                Already have an account?{' '}
                <button onClick={() => setTab('login')} className="font-bold underline" style={{ color: 'var(--theme-primary)' }}>
                  Log in instead
                </button>
              </p>
            </>
          )}

          {/* ── FORGOT PASSWORD TAB ── */}
          {tab === 'forgot' && (
            <div className="space-y-4 animate-fade-in">
              <button 
                onClick={() => setTab('login')} 
                className="flex items-center gap-1 text-sm font-bold mb-4"
                style={{ color: 'var(--theme-primary)' }}
              >
                <ArrowLeft size={16} /> Back to Login
              </button>
              
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg" style={{ color: 'var(--theme-header)' }}>Reset Password</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--theme-body)' }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body pointer-events-none" />
                  <input
                    className="app-input w-full"
                    style={{ paddingLeft: '36px' }}
                    type="email"
                    placeholder="Email address"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 font-bold text-sm">
                  {loading ? 'Sending link…' : 'Send Reset Link'}
                </button>
              </form>
            </div>
          )}

          {/* ── UPDATE PASSWORD TAB (RECOVERY) ── */}
          {tab === 'update' && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg" style={{ color: 'var(--theme-header)' }}>Set New Password</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--theme-body)' }}>
                  Please enter your new password below.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body pointer-events-none" />
                  <input
                    className="app-input w-full"
                    style={{ paddingLeft: '36px', paddingRight: '40px' }}
                    type={showPass ? 'text' : 'password'}
                    placeholder="New Password"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-body hover:text-header"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 font-bold text-sm">
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
