import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  company: { trade_name: string; gstin: string; email: string; role?: string } | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  company: null,
  isAdmin: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<{ trade_name: string; gstin: string; email: string; role?: string } | null>(null);

  const isAdmin = useMemo(() => {
    return company?.role === 'admin' || user?.email === 'ismsexports@gmail.com';
  }, [company, user]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        setSession(session ?? null);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Load company based on user email; sign out if not registered
  useEffect(() => {
    if (loading || !user?.email) {
      if (!user) setCompany(null);
      return;
    }

    const loadCompany = async () => {
      const authedEmail = user.email.trim();

      const { data, error } = await supabase
        .from("companies")
        .select("trade_name,gstin,email,role")
        .ilike("email", authedEmail)
        .maybeSingle();
      
      if (error) {
        setCompany(null);
        return;
      }
      
      setCompany(data ?? null);
    };
    loadCompany();
  }, [user, loading]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      company,
      isAdmin,
      signOut: async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
      },
    }),
    [session, user, loading, company, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
