import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { initGems } from '@/hooks/use-gems';
import { createSessionFromLogin, lootopiaApi, setAuthToken } from '@/services/lootopia-api';
import type { AuthSession } from '@/types/auth';

const SESSION_KEY = 'lootopia.mobile.session';

function isWebPlatform() {
  return Platform.OS === 'web';
}

type AuthContextValue = {
  isLoading: boolean;
  session: AuthSession | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string, city?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function saveSession(session: AuthSession | null) {
  if (isWebPlatform()) {
    if (!session) {
      window.localStorage.removeItem(SESSION_KEY);
      return;
    }

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return;
  }

  if (!session) {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const isStaleSession = (candidate: AuthSession) => Boolean(candidate.authToken) && !candidate.userId;

      try {
        if (isWebPlatform()) {
          const raw = window.localStorage.getItem(SESSION_KEY);

          if (!raw) {
            setSession(null);
            setAuthToken(null);
            return;
          }

          const parsed = JSON.parse(raw) as AuthSession;
          if (isStaleSession(parsed)) {
            setSession(null);
            setAuthToken(null);
            await saveSession(null);
            return;
          }

          setSession(parsed);
          setAuthToken(parsed.authToken);
          return;
        }

        const raw = await SecureStore.getItemAsync(SESSION_KEY);
        if (!raw) {
          setSession(null);
          setAuthToken(null);
          return;
        }

        const parsed = JSON.parse(raw) as AuthSession;
        if (isStaleSession(parsed)) {
          setSession(null);
          setAuthToken(null);
          await saveSession(null);
          return;
        }

        setSession(parsed);
        setAuthToken(parsed.authToken);
      } catch {
        setSession(null);
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    void loadSession();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      isLoading,
      session,
      signIn: async (email: string, password: string) => {
        const login = await lootopiaApi.login({ email, password });
        const nextSession = createSessionFromLogin(login, { email });
        setAuthToken(nextSession.authToken);
        await saveSession(nextSession);
        setSession(nextSession);
        if (nextSession.userId) {
          await initGems(nextSession.userId);
        }
      },
      signUp: async (email: string, username: string, password: string, city?: string) => {
        await lootopiaApi.register({ email, username, password, city });
        setAuthToken(null);
        await saveSession(null);
        setSession(null);
      },
      signOut: async () => {
        setAuthToken(null);
        setSession(null);
        try {
          await saveSession(null);
        } catch {
          // La session en memoire est deja videe; on evite de bloquer la deconnexion.
        }
      },
    };
  }, [isLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}

