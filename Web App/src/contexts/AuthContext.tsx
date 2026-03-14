import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api, ApiError } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  workspaceId: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  register: (payload: { email: string; password: string; name: string; workspaceName: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<{ data: { user?: User } | User }>('/auth/me', { skipAuthRefresh: true });
      const user = 'user' in res.data ? res.data.user ?? null : res.data;
      setState({ user, isLoading: false, isAuthenticated: Boolean(user) });
    } catch {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ data: { user: User } }>('/auth/login', { email, password });
    setState({ user: res.data.user, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(async (payload: { email: string; password: string; name: string; workspaceName: string }) => {
    const res = await api.post<{ data: { user: User } }>('/auth/register', payload, { skipAuthRefresh: true });
    setState({ user: res.data.user, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if API fails, clear local state
    }
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, register, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export { type User, type AuthState };
