import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { api, setOnUnauthorized } from "./api";
import { queryClient, setQueryOnUnauthorized } from "./queryClient";

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
  phone?: string;
  plan?: string;
  planStatus?: string;
};

type AuthContextType = {
  user: User | null;
  workspace: Workspace | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshWorkspace: (data: Partial<Workspace>) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const onUnauth = () => {
      queryClient.clear();
      setUser(null);
      setWorkspace(null);
      if (!["/", "/login", "/register", "/contact"].includes(window.location.pathname) && !window.location.pathname.startsWith("/shared/")) {
        window.location.href = "/";
      }
    };
    setOnUnauthorized(onUnauth);
    setQueryOnUnauthorized(onUnauth);

    if (window.location.pathname.startsWith("/shared/")) {
      setIsLoading(false);
      return;
    }

    api
      .me()
      .then(({ user, workspace }) => {
        setUser(user);
        setWorkspace(workspace);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    queryClient.clear();
    setUser(data.user);
    setWorkspace(data.workspace);
  };

  const register = async (formData: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }) => {
    const data = await api.register(formData);
    queryClient.clear();
    setUser(data.user);
    setWorkspace(data.workspace);
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      queryClient.clear();
      setUser(null);
      setWorkspace(null);
    }
  };

  const refreshWorkspace = (data: Partial<Workspace>) => {
    setWorkspace((prev) => (prev ? { ...prev, ...data } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        isLoading,
        login,
        register,
        logout,
        refreshWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
