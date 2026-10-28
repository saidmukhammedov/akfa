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
      let activeOwner: OwnerProfile | null = null;

      // 1. Try to get or establish active session from backend
      try {
        const sessionRes = await api.auth.session();
        if (sessionRes.success && sessionRes.data) {
          tokenStorage.setTokens(sessionRes.data.accessToken, sessionRes.data.refreshToken);
          activeOwner = sessionRes.data.owner;
        }
      } catch {
        // Fallback to profile call
        try {
          const profileRes = await api.auth.getProfile();
          if (profileRes.success && profileRes.data) {
            activeOwner = profileRes.data;
          }
        } catch {}
      }

      if (activeOwner) {
        setOwner(activeOwner);
        if (activeOwner.language) {
          setLang(activeOwner.language as 'uz' | 'ru');
        }
      } else {
        setOwner({
          id: 'owner',
          username: 'admin',
          fullName: 'Ustaxona Rahbari',
          workshopName: 'AKFA Ustaxonasi',
          language: 'uz',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      setIsAuthenticated(true);
      setIsInitialized(true);
    } catch (err: any) {
      console.warn('Silent session load error, proceeding with owner access:', err);
      setIsAuthenticated(true);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = async () => {
      try {
        const sessionRes = await api.auth.session();
        if (sessionRes.success && sessionRes.data) {
          tokenStorage.setTokens(sessionRes.data.accessToken, sessionRes.data.refreshToken);
          setOwner(sessionRes.data.owner);
          setIsAuthenticated(true);
        }
      } catch {
        setIsAuthenticated(true);
      }
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
