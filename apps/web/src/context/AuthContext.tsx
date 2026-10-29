import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { OwnerProfile } from '@akfa/shared';
import { api, tokenStorage, ApiError } from '../api/client';
import { useLanguage } from './LanguageContext';

interface AuthContextType {
  isAuthenticated: boolean;
  owner: OwnerProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  authError: string | null;
  login: (username: string, password: string) => Promise<void>;
  setup: (payload: { username: string; password: string; fullName: string; workshopName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateOwnerProfile: (data: { fullName?: string; workshopName?: string; language?: 'uz' | 'ru'; currentPassword?: string; newPassword?: string }) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Synchronously read cached authentication state so the initial frame renders instantly (0ms delay)
const getInitialAuthState = (): { isAuthenticated: boolean; owner: OwnerProfile | null } => {
  try {
    const token = tokenStorage.getAccessToken();
    const cachedOwnerStr = localStorage.getItem('akfa_owner');
    if (token) {
      let cachedOwner: OwnerProfile | null = null;
      if (cachedOwnerStr) {
        try {
          cachedOwner = JSON.parse(cachedOwnerStr);
        } catch {}
      }
      return {
        isAuthenticated: true,
        owner: cachedOwner || {
          id: 'owner',
          username: 'admin',
          fullName: 'Alisher Qodirov',
          workshopName: 'AKFA Rom va Eshiklar Tsexi',
          language: 'uz',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    }
  } catch {}
  return {
    isAuthenticated: false,
    owner: null,
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialAuth = getInitialAuthState();
  const [owner, setOwner] = useState<OwnerProfile | null>(initialAuth.owner);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuth.isAuthenticated);
  // Zero-loading startup: initialized state is immediately ready on frame 0
  const isLoading = false;
  const [isInitialized, setIsInitialized] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { setLang } = useLanguage();

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      // Silently verify or refresh profile in the background without blocking UI
      api.auth.getProfile()
        .then((profileRes) => {
          if (profileRes.success && profileRes.data) {
            setOwner(profileRes.data);
            try {
              localStorage.setItem('akfa_owner', JSON.stringify(profileRes.data));
            } catch {}
            if (profileRes.data.language) {
              setLang(profileRes.data.language as 'uz' | 'ru');
            }
          }
        })
        .catch(() => {
          // Token refresh / unauthorized event in client.ts will handle expiry if invalid
        });
    } else {
      // If unauthenticated, silently check backend status in the background
      api.auth.status()
        .then((res) => {
          if (res && typeof res.isInitialized === 'boolean') {
            setIsInitialized(res.isInitialized);
          }
        })
        .catch(() => {});
    }

    const handleUnauthorized = () => {
      tokenStorage.clearTokens();
      try {
        localStorage.removeItem('akfa_owner');
      } catch {}
      setOwner(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('akfa:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('akfa:unauthorized', handleUnauthorized);
  }, [setLang]);

  const login = async (username: string, password: string) => {
    setAuthError(null);
    try {
      const res = await api.auth.login(username, password);
      tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
      try {
        localStorage.setItem('akfa_owner', JSON.stringify(res.data.user));
      } catch {}
      setOwner(res.data.user);
      setIsAuthenticated(true);
      if (res.data.user.language) {
        setLang(res.data.user.language as 'uz' | 'ru');
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Tizimga kirishda xatolik';
      setAuthError(msg);
      throw err;
    }
  };

  const setup = async (payload: { username: string; password: string; fullName: string; workshopName?: string }) => {
    setAuthError(null);
    try {
      const res = await api.auth.setup(payload);
      tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
      try {
        localStorage.setItem('akfa_owner', JSON.stringify(res.data.owner));
      } catch {}
      setOwner(res.data.owner);
      setIsAuthenticated(true);
      setIsInitialized(true);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Hisob yaratishda xatolik';
      setAuthError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      tokenStorage.clearTokens();
      try {
        localStorage.removeItem('akfa_owner');
      } catch {}
      setOwner(null);
      setIsAuthenticated(false);
    }
  };

  const updateOwnerProfile = async (data: {
    fullName?: string;
    workshopName?: string;
    language?: 'uz' | 'ru';
    currentPassword?: string;
    newPassword?: string;
  }) => {
    setAuthError(null);
    try {
      const res = await api.auth.updateProfile(data);
      setOwner(res.data);
      try {
        localStorage.setItem('akfa_owner', JSON.stringify(res.data));
      } catch {}
      if (data.language) {
        setLang(data.language);
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Profilni yangilashda xatolik';
      setAuthError(msg);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        owner,
        isLoading,
        isInitialized,
        authError,
        login,
        setup,
        logout,
        updateOwnerProfile,
        clearError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
