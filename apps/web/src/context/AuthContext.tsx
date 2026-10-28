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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { setLang } = useLanguage();

  const checkAuth = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      // First check if backend has an owner initialized
      const statusRes = await api.auth.status();
      setIsInitialized(statusRes.isInitialized);

      if (!statusRes.isInitialized) {
        setIsAuthenticated(false);
        setOwner(null);
        setIsLoading(false);
        return;
      }

      // If token exists, load authenticated profile
      const token = tokenStorage.getAccessToken();
      if (token) {
        const profileRes = await api.auth.getProfile();
        if (profileRes.success && profileRes.data) {
          setOwner(profileRes.data);
          setIsAuthenticated(true);
          if (profileRes.data.language) {
            setLang(profileRes.data.language as 'uz' | 'ru');
          }
        }
      } else {
        setIsAuthenticated(false);
        setOwner(null);
      }
    } catch (err: any) {
      tokenStorage.clearTokens();
      setIsAuthenticated(false);
      setOwner(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setOwner(null);
    };

    window.addEventListener('akfa:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('akfa:unauthorized', handleUnauthorized);
  }, []);

  const login = async (username: string, password: string) => {
    setAuthError(null);
    try {
      const res = await api.auth.login(username, password);
      tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
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
    } finally {
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
