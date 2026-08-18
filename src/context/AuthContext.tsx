import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthSchool, AuthSession, AuthUser, ParentChild } from '../types';
import { getStoredAuth, setStoredAuth } from '../api/client';
import { parentLogin, teacherLogin } from '../api/auth';
import { registerPushNotifications, unregisterPushNotifications } from '../notifications/push';

export type LoginRole = 'parent' | 'teacher';

type AuthContextValue = {
  ready: boolean;
  session: AuthSession | null;
  user: AuthUser | null;
  children: ParentChild[];
  activeChild: ParentChild | null;
  activeChildId: string | null;
  school: AuthSchool | null;
  isAuthenticated: boolean;
  isTeacher: boolean;
  needsOnboarding: boolean;
  login: (email: string, password: string, options?: { role?: LoginRole; subdomain?: string }) => Promise<void>;
  logout: () => Promise<void>;
  setActiveChild: (childId: string) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  syncChildren: (children: ParentChild[]) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function teacherFrom(session: AuthSession | null) {
  return session?.user?.userType === 'TEACHER' || session?.role?.code === 'TEACHER';
}

function buildSession(data: {
  token: string;
  user: AuthUser;
  role: AuthSession['role'];
  permissions: string[];
  children?: ParentChild[];
  activeChildId?: string | null;
  school?: AuthSchool | null;
}): AuthSession {
  const children = data.children ?? [];
  return {
    token: data.token,
    user: data.user,
    role: data.role,
    permissions: data.permissions ?? [],
    children,
    activeChildId: data.activeChildId ?? children[0]?.childId ?? null,
    school: data.school ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    getStoredAuth()
      .then((stored) => {
        if (stored?.token && stored?.user) {
          setSession({
            ...stored,
            children: stored.children ?? [],
            school: stored.school ?? null,
          });
        }
      })
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((next: AuthSession | null) => {
    setSession(next);
    void setStoredAuth(next);
  }, []);

  useEffect(() => {
    if (!session?.token) return;
    registerPushNotifications().catch(() => {});
  }, [session?.token, session?.user?.id]);

  const login = useCallback(
    async (email: string, password: string, options?: { role?: LoginRole; subdomain?: string }) => {
      const role = options?.role ?? 'parent';
      if (role === 'teacher') {
        const subdomain = options?.subdomain?.trim();
        if (!subdomain) throw new Error('Enter your school code to continue.');
        const data = await teacherLogin(email.trim().toLowerCase(), password, subdomain);
        persist(buildSession(data));
        return;
      }
      const data = await parentLogin(email.trim().toLowerCase(), password);
      persist(buildSession(data));
    },
    [persist],
  );

  const logout = useCallback(async () => {
    await unregisterPushNotifications();
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

  const isTeacher = teacherFrom(session);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      children: session?.children ?? [],
      activeChild,
      activeChildId: activeChild?.childId ?? null,
      school: session?.school ?? null,
      isAuthenticated: Boolean(session?.token),
      isTeacher,
      needsOnboarding: Boolean(session?.token && !isTeacher && !session.user?.onboardingCompletedAt),
      login,
      logout,
      setActiveChild,
      updateUser,
      syncChildren,
    }),
    [ready, session, activeChild, isTeacher, login, logout, setActiveChild, updateUser, syncChildren],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
