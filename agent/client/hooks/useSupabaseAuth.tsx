import React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined,
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };
    init();

    if (!isSupabaseConfigured) return;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = React.useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const ProtectedRoute: React.FC<{ children: React.ReactNode }>= ({ children }) => {
  const { user, loading } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Setup required</h1>
        <p>
          Supabase is not configured. Click Open MCP popover and connect to Supabase, then set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </p>
      </div>
    );
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) {
    window.location.href = "/agent/login";
    return null;
  }
  return <>{children}</>;
};
