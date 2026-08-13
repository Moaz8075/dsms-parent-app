import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthSession, AuthUser, ParentChild } from '../types';
import { getStoredAuth, setStoredAuth } from '../api/client';
import { parentLogin } from '../api/auth';

type AuthContextValue = {
  ready: boolean;
  session: AuthSession | null;
  user: AuthUser | null;
  children: ParentChild[];
  activeChild: ParentChild | null;
  activeChildId: string | null;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setActiveChild: (childId: string) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  syncChildren: (children: ParentChild[]) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function buildSession(data: {
  token: string;
  user: AuthUser;
  role: AuthSession['role'];
  permissions: string[];
  children: ParentChild[];
  activeChildId?: string | null;
}): AuthSession {
  const children = data.children ?? [];
  return {
    token: data.token,
    user: data.user,
    role: data.role,
    permissions: data.permissions ?? [],
    children,
    activeChildId: data.activeChildId ?? children[0]?.childId ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    getStoredAuth()
      .then((stored) => {
        if (stored?.token && stored?.user) setSession(stored);
      })
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((next: AuthSession | null) => {
    setSession(next);
    void setStoredAuth(next);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await parentLogin(email.trim().toLowerCase(), password);
    persist(buildSession(data));
  }, [persist]);

  const logout = useCallback(async () => {
    persist(null);
  }, [persist]);

  const setActiveChild = useCallback((childId: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, activeChildId: childId };
      void setStoredAuth(next);
      return next;
    });
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, user: { ...prev.user, ...patch } };
      void setStoredAuth(next);
      return next;
    });
  }, []);

  const syncChildren = useCallback((childList: ParentChild[]) => {
    setSession((prev) => {
      if (!prev) return prev;
      const activeStillThere = childList.some((c) => c.childId === prev.activeChildId);
      const next = {
        ...prev,
        children: childList,
        activeChildId: activeStillThere ? prev.activeChildId : childList[0]?.childId ?? null,
      };
      void setStoredAuth(next);
      return next;
    });
  }, []);

  const activeChild = useMemo(() => {
    if (!session?.children?.length) return null;
    return (
      session.children.find((c) => c.childId === session.activeChildId) ?? session.children[0]
    );
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      children: session?.children ?? [],
      activeChild,
      activeChildId: activeChild?.childId ?? null,
      isAuthenticated: Boolean(session?.token),
      needsOnboarding: Boolean(session?.token && !session.user?.onboardingCompletedAt),
      login,
      logout,
      setActiveChild,
      updateUser,
      syncChildren,
    }),
    [ready, session, activeChild, login, logout, setActiveChild, updateUser, syncChildren],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
