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
      // Profile doesn't exist (e.g. they signed in with Google for the first time)
      // Auto-create it!
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) {
        let baseUsername = user.email ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : `user_${Math.floor(Math.random() * 10000)}`;
        
        const { data: newProfile } = await supabase.from('profiles').upsert({
          id: userId,
          username: baseUsername, // We use email prefix as a fallback username
          name: user.user_metadata?.full_name || user.user_metadata?.name || 'New User',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        }).select().single();
        
        if (newProfile) {
          setUserProfile(newProfile);
        }
      }
    }
    setLoading(false);
  };

  return (
    <AppContext.Provider value={{
      session,
      userProfile,
      loading,
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
