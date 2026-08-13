import { apiFetch } from './client';
import type { AuthUser, ParentChild } from '../types';

export async function parentLogin(email: string, password: string) {
  const response = await apiFetch<{
    success: boolean;
    data: {
      token: string;
      user: AuthUser;
      role: { id: string; name: string; code: string };
      permissions: string[];
      children: ParentChild[];
    };
  }>('/auth/parent/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return response.data;
}

export async function fetchParentMe() {
  const response = await apiFetch<{ success: boolean; data: any }>('/auth/parent/me');
  return response.data;
}

export async function updateParentProfile(payload: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}) {
  const response = await apiFetch<{ success: boolean; data: AuthUser }>('/auth/parent/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function fetchParentOnboarding() {
  const response = await apiFetch<{
    success: boolean;
    data: {
      completed: boolean;
      steps: { profileComplete: boolean; childrenLinked: boolean };
    };
  }>('/auth/parent/onboarding');
  return response.data;
}

export async function completeParentOnboarding() {
  const response = await apiFetch<{
    success: boolean;
    data: { completed: boolean; onboardingCompletedAt: string };
  }>('/auth/parent/onboarding/complete', { method: 'POST' });
  return response.data;
}
