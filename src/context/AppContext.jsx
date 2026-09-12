import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 3-step funnel state
  const [activeBranch, setActiveBranch] = useState('');
  const [activeSemester, setActiveSemester] = useState(null);
  const [activeSubject, setActiveSubject] = useState(null);
  const [theme, setThemeState] = useState('default');
  const [profileEffects, setProfileEffectsState] = useState({
    banner: 'none',
    avatar: 'none'
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('maxe_theme');
    if (savedTheme) setThemeState(savedTheme);
    const savedEffects = localStorage.getItem('maxe_effects');
    if (savedEffects) {
      try {
        setProfileEffectsState(JSON.parse(savedEffects));
      } catch(e) {}
    }
  }, []);

  const saveEffectsToDb = async (t, e) => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user?.id) return;
      const payload = JSON.stringify({ theme: t, profileEffects: e });
      await supabase.from('profiles').update({ interests: payload }).eq('id', currentSession.user.id);
    } catch(err) {
      console.error('Failed to sync effects to DB', err);
    }
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('maxe_theme', newTheme);
    saveEffectsToDb(newTheme, profileEffects);
  };
  
  const setProfileEffects = (newEffects) => {
    setProfileEffectsState(newEffects);
    localStorage.setItem('maxe_effects', JSON.stringify(newEffects));
    saveEffectsToDb(theme, newEffects);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const themeColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--theme-sidebar')
      .trim() || getComputedStyle(document.documentElement).getPropertyValue('--theme-bg').trim();
    if (themeColor) {
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) themeMeta.setAttribute('content', themeColor);
      const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (appleMeta) appleMeta.setAttribute('content', 'default');
    }
  }, [theme]);

  // Ensure DB always has latest effects from local storage
  useEffect(() => {
    if (userProfile && session) {
      const dbInterests = userProfile.interests;
      const currentPayload = JSON.stringify({ theme, profileEffects });
      if (dbInterests !== currentPayload) {
        saveEffectsToDb(theme, profileEffects);
      }
    }
  }, [userProfile, theme, profileEffects, session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (data) {
      setUserProfile(data);

      // ── Save account info for the Switch Account feature ──
      try {
        const SAVED_KEY = 'maxe_saved_accounts';
        const saved = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
        const { data: { session: s } } = await supabase.auth.getSession();
        const email = s?.user?.email || null;
        
        // Save token so we can quick-switch without password
        const entry = { 
          id: data.id, 
          name: data.name || 'Unnamed', 
          username: data.username || '', 
          avatar_url: data.avatar_url || null, 
          email, 
          saved_at: Date.now(),
          token: s ? { access_token: s.access_token, refresh_token: s.refresh_token } : null
        };
        
        const idx = saved.findIndex(a => a.id === data.id);
        if (idx >= 0) saved[idx] = entry; else saved.push(entry);
        localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
      } catch (_) {}

      if (typeof data.interests === 'string' && data.interests.startsWith('{')) {
        try {
          const savedSettings = JSON.parse(data.interests);
          if (savedSettings.theme) {
            setThemeState(savedSettings.theme);
            localStorage.setItem('maxe_theme', savedSettings.theme);
          }
          if (savedSettings.profileEffects) {
            setProfileEffectsState(savedSettings.profileEffects);
            localStorage.setItem('maxe_effects', JSON.stringify(savedSettings.profileEffects));
          }
        } catch (error) {
          console.error('Could not load profile appearance settings', error);
        }
      }
      // Auto-select the user's branch for the Hub if not already selected
      if (data.branch && !activeBranch) {
        setActiveBranch(data.branch);
      }
    } else {
      setUserProfile({});
    }
    setLoading(false);
  };

  return (
    <AppContext.Provider value={{
      session,
      userProfile,
      loading,
      theme, setTheme,
      profileEffects, setProfileEffects,
      activeBranch, setActiveBranch,
      activeSemester, setActiveSemester,
      activeSubject, setActiveSubject,
      setUserProfile,
      fetchProfile
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
