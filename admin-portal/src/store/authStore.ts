import { create } from 'zustand';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
  initialize: () => void;
}

const loadUserFromStorage = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null,
  isAuthenticated: false,
  initialized: false,
  initialize: () => {
    if (typeof window === 'undefined') {
      set({ initialized: true });
      return;
    }
    
    const token = localStorage.getItem('accessToken');
    const user = loadUserFromStorage();
    
    if (token && user) {
      set({
        user,
        accessToken: token,
        refreshToken: localStorage.getItem('refreshToken'),
        isAuthenticated: true,
        initialized: true,
      });
    } else if (token) {
      // We have a token but no user - will fetch user in AuthInitializer
      set({
        accessToken: token,
        refreshToken: localStorage.getItem('refreshToken'),
        isAuthenticated: false, // Will be set to true after user is fetched
        initialized: true,
      });
    } else {
      set({ initialized: true });
    }
  },
  setUser: (user) => {
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    set({ user, isAuthenticated: !!user });
  },
  setTokens: (accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
    set({ accessToken, refreshToken, isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
  isAdmin: () => {
    const user = get().user;
    return user?.role === 'admin' || false;
  },
}));
