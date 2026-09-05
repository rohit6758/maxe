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
    if (!session?.user?.id) return;
    try {
      const payload = JSON.stringify({ theme: t, profileEffects: e });
      await supabase.from('profiles').update({ interests: payload }).eq('id', session.user.id);
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
  }, [theme]);

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
      // Auto-select the user's branch for the Hub if not already selected
      if (data.branch && !activeBranch) {
        setActiveBranch(data.branch);
      }
    } else {
      setUserProfile(null);
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
