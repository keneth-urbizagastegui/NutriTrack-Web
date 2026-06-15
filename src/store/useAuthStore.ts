import { create } from 'zustand';

export interface UserSession {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

interface AuthState {
  user: UserSession | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (username: string, access: string, refresh: string) => void;
  logout: () => void;
  updateAccessToken: (access: string) => void;
}

const getRolesFromUsername = (username: string): string[] => {
  const roles = ['ROLE_USER'];
  if (username.toLowerCase().includes('admin')) {
    roles.push('ROLE_ADMIN');
    roles.push('ROLE_MANAGER');
  } else if (username.toLowerCase().includes('manager')) {
    roles.push('ROLE_MANAGER');
  }
  return roles;
};

// Cargar estado inicial desde sessionStorage para hidratación rápida
const getInitialState = () => {
  try {
    const storedAccess = sessionStorage.getItem('accessToken');
    const storedRefresh = sessionStorage.getItem('refreshToken');
    const storedUser = sessionStorage.getItem('user');

    if (storedAccess && storedRefresh && storedUser) {
      return {
        accessToken: storedAccess,
        refreshToken: storedRefresh,
        user: JSON.parse(storedUser) as UserSession,
        isAuthenticated: true,
      };
    }
  } catch (e) {
    console.error('Error loading initial auth state', e);
  }
  return {
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
  };
};

const initialState = getInitialState();

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  login: (username, access, refresh) => {
    const roles = getRolesFromUsername(username);
    const userData: UserSession = {
      id: Date.now(), // ID temporal
      username,
      email: `${username}@utec.edu.pe`, // Correo temporal
      roles
    };
    
    sessionStorage.setItem('accessToken', access);
    sessionStorage.setItem('refreshToken', refresh);
    sessionStorage.setItem('user', JSON.stringify(userData));
    
    set({
      user: userData,
      accessToken: access,
      refreshToken: refresh,
      isAuthenticated: true
    });
  },
  logout: () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false
    });
  },
  updateAccessToken: (access) => {
    sessionStorage.setItem('accessToken', access);
    set({
      accessToken: access
    });
  }
}));
