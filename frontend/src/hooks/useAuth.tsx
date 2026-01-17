import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type Role = "MASTER_ADMIN" | "ADMIN" | "TEKNISI";

type User = {
  id: number;
  name: string;
  role: Role;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.data);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (payload) => {
      await api.post("/auth/login", payload);
      const { data } = await api.get("/auth/me");
      setUser(data.data);
    },
    logout: async () => {
      await api.post("/auth/logout");
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
