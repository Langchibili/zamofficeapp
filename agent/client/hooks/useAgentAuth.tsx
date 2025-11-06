import React from "react";
import { agentApi } from "@/lib/agentApi";

interface AuthContextValue {
  token: string | null;
  profile: {
    email: string;
    firstName?: string;
    lastName?: string;
    agentCode: string;
  } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined,
);

export const AgentAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = React.useState<string | null>(agentApi.getToken());
  const [profile, setProfile] =
    React.useState<AuthContextValue["profile"]>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        if (agentApi.getToken()) {
          const p = await agentApi.profile();
          if (!active) return;
          setProfile(p);
        }
      } catch (e) {
        agentApi.clearToken();
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  const signOut = React.useCallback(async () => {
    await agentApi.logout();
    setProfile(null);
    setToken(null);
    window.location.href = "/agent/login";
  }, []);

  const value: AuthContextValue = { token, profile, loading, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAgentAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx)
    throw new Error("useAgentAuth must be used within AgentAuthProvider");
  return ctx;
};

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, loading } = useAgentAuth();
  if (loading) return <div className="p-6">Loading…</div>;
  if (!token) {
    window.location.href = "/agent/login";
    return null;
  }
  return <>{children}</>;
};
