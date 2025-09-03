import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  employee_id: string;
  position: string;
  department: string;
  role: 'admin' | 'employee';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (user: User | null) => {
    setLoading(true); 
    if (user) {
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (profileData) {
          setProfile(profileData as Profile);
          setIsAdmin(profileData.role === 'admin');
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    } else {
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        // Defer Supabase calls to avoid deadlocks inside the callback
        setTimeout(() => {
          fetchProfile(currentUser);
        }, 0);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      fetchProfile(currentUser);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data.user) {
      await fetchProfile(data.user);
    }
    return { data, error };
  };

  const signOut = async () => {
    try {
      // Clear session and user state immediately
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);

      // Call Supabase signOut
      const { error } = await supabase.auth.signOut();

      // Normalize "session not found" as a successful logout
      if (error && (error.message?.toLowerCase().includes('session not found') || (error as any).status === 403)) {
        return { error: null };
      }

      if (error) {
        console.error("Error signing out:", error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error("Unexpected error during signOut:", error);
      return { error } as any;
    }
  };

  return {
    user,
    session,
    profile,
    isAdmin,
    loading,
    signIn,
    signOut,
  };
};