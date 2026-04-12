import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { AuthSession } from '@/types/auth';
import { createSessionFromLogin, lootopiaApi, setAuthToken } from '@/services/lootopia-api';

const SESSION_KEY = 'lootopia.mobile.session';

type AuthContextValue = {
  isLoading: boolean;
  session: AuthSession | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string, city?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function saveSession(session: AuthSession | null) {
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
      try {
        const raw = await SecureStore.getItemAsync(SESSION_KEY);
        if (!raw) {
          setSession(null);
          setAuthToken(null);
          return;
        }

        const parsed = JSON.parse(raw) as AuthSession;
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
        const nextSession = createSessionFromLogin(login);
        setAuthToken(nextSession.authToken);
        await saveSession(nextSession);
        setSession(nextSession);
      },
      signUp: async (email: string, username: string, password: string, city?: string) => {
        await lootopiaApi.register({ email, username, password, city });
        const login = await lootopiaApi.login({ email, password });
        const nextSession = createSessionFromLogin(login);
        setAuthToken(nextSession.authToken);
        await saveSession(nextSession);
        setSession(nextSession);
      },
      signOut: async () => {
        setAuthToken(null);
        await saveSession(null);
        setSession(null);
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

