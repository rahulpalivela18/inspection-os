import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { api } from "./api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  workspaceId: string;
};

type Workspace = {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  email?: string;
};

type AuthContextType = {
  user: User | null;
  workspace: Workspace | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; companyName: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshWorkspace: (data: Partial<Workspace>) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(({ user, workspace }) => {
        setUser(user);
        setWorkspace(workspace);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setUser(data.user);
    setWorkspace(data.workspace);
  };

  const register = async (formData: { name: string; email: string; password: string; companyName: string }) => {
    const data = await api.register(formData);
    setUser(data.user);
    setWorkspace(data.workspace);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setWorkspace(null);
  };

  const refreshWorkspace = (data: Partial<Workspace>) => {
    setWorkspace((prev) => prev ? { ...prev, ...data } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, workspace, isLoading, login, register, logout, refreshWorkspace }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
