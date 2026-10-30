import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  // Initialize profile synchronously from localStorage for instant role verification and 0ms initial load
  const [profile, setProfile] = useState(() => {
    try {
      const cached = localStorage.getItem('netfault_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profilePromiseRef = useRef(null);
  const isMountedRef = useRef(true);

  // loadProfile with deduplication, promise sharing, and 6s safety timeout
  const loadProfile = useCallback(async (userId) => {
    if (!userId) return null;

    // If an existing request is already in-flight for this user, share the promise
    if (profilePromiseRef.current) {
      return profilePromiseRef.current;
    }

    const fetchPromise = (async () => {
      try {
        const queryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        // Safety timeout to prevent slow cellular connections from hanging indefinitely
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timeout')), 6000)
        );

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (!error && data) {
          if (isMountedRef.current) {
            setProfile(data);
          }
          try {
            localStorage.setItem('netfault_profile', JSON.stringify(data));
          } catch {}
          return data;
        }
        return null;
      } catch (err) {
        console.warn('Profile load warning:', err.message || err);
        return null;
      } finally {
        profilePromiseRef.current = null;
      }
    })();

    profilePromiseRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    async function initAuth() {
      try {
        // Fast session check from local storage with 5s timeout
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 5000))
        ]);

        if (!isMountedRef.current) return;
        const currentSession = sessionResult?.data?.session ?? null;
        setSession(currentSession);

        if (currentSession?.user) {
          // Check if we already have a valid cached profile matching this user
          const cachedStr = localStorage.getItem('netfault_profile');
          let hasValidCache = false;
          if (cachedStr) {
            try {
              const cached = JSON.parse(cachedStr);
              if (cached && cached.id === currentSession.user.id) {
                setProfile(cached);
                hasValidCache = true;
                // UNBLOCK IMMEDIATELY: role & profile are already known
                setLoading(false);
              }
            } catch {}
          }

          // Revalidate profile in background (or wait for it only if no cache exists)
          const pPromise = loadProfile(currentSession.user.id);
          if (!hasValidCache) {
            await pPromise;
          }
        } else {
          setProfile(null);
          try {
            localStorage.removeItem('netfault_profile');
          } catch {}
        }
      } catch (err) {
        console.warn('Auth initialization fallback:', err.message || err);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // Listen for auth state changes (login, token refresh, logout)
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMountedRef.current) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        try {
          localStorage.removeItem('netfault_profile');
          sessionStorage.clear();
        } catch {}
        setLoading(false);
        return;
      }

      if (newSession?.user) {
        setSession(newSession);
        loadProfile(newSession.user.id);
      } else if (event !== 'INITIAL_SESSION') {
        setSession(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMountedRef.current = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Comprehensive, race-condition-free logout that guarantees redirect to public landing page ('/')
  const signOut = useCallback(async () => {
    setIsLoggingOut(true);
    setProfile(null);
    setSession(null);
    try {
      localStorage.removeItem('netfault_profile');
      sessionStorage.clear();
    } catch {}

    // Navigate immediately to public landing page before or during auth clearing
    navigate('/', { replace: true });

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoggingOut(false);
      }
    }
  }, [navigate]);

  const refreshProfile = useCallback(() => {
    if (session?.user) return loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    isLoggingOut,
    signOut,
    refreshProfile
  }), [session, profile, loading, isLoggingOut, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
