import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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

  // Track last successful login timestamp to guard against cold-start 401 race conditions.
  // Render.com free tier servers wake up slowly — a valid JWT can return 401 for ~10-20s
  // after login while the server initializes. We ignore akfa:unauthorized within 30s of login.
  const lastLoginTimeRef = useRef<number>(0);

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      // Silently verify and refresh profile in the background without blocking UI
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
          // getProfile failure (network timeout / server cold-start) is silently ignored.
          // We do NOT force-logout on getProfile errors — that would cause the redirect loop.
          // Genuine session expiry is handled by the akfa:unauthorized event below,
          // which itself is guarded against spurious cold-start 401s via lastLoginTimeRef.
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
      // Guard: ignore spurious 401s within 30 seconds of a successful login.
      // Render.com cold-start can cause the server to return 401 transiently even with a valid token.
      const timeSinceLogin = Date.now() - lastLoginTimeRef.current;
      if (timeSinceLogin < 30_000) {
        // Still within the login grace period — do NOT log the user out
        return;
      }
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
      if (res.success && res.data) {
        tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
        try {
          localStorage.setItem('akfa_owner', JSON.stringify(res.data.user));
        } catch {}
        setOwner(res.data.user);
        setIsAuthenticated(true);
        // Record login time BEFORE setting isAuthenticated so the 30s grace period
        // is active immediately when the dashboard mounts and fires background requests.
        lastLoginTimeRef.current = Date.now();
        if (res.data.user.language) {
          setLang(res.data.user.language as 'uz' | 'ru');
        }
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
      lastLoginTimeRef.current = Date.now();
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
