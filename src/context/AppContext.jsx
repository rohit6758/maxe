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
      setUserProfile(null);
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
