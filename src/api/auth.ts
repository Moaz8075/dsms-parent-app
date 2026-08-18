import { apiFetch } from './client';
import type { AuthSchool, AuthUser, ParentChild } from '../types';

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

export async function teacherLogin(email: string, password: string, subdomain: string) {
  const response = await apiFetch<{
    success: boolean;
    data: {
      token: string;
      user: AuthUser;
      role: { id: string; name: string; code: string };
      permissions: string[];
      school: AuthSchool;
    };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    subdomain,
  });
  const data = response.data;
  const roleCode = data.role?.code || data.user?.userType;
  if (roleCode !== 'TEACHER' && data.user?.userType !== 'TEACHER') {
    throw new Error('This account is not a teacher. Switch to Parent and try again.');
  }
  return {
    ...data,
    school: {
      id: data.school?.id,
      name: data.school?.name,
      subdomain: data.school?.subdomain || subdomain,
    },
  };
}

export async function updateUserProfile(payload: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}) {
  const response = await apiFetch<{ success: boolean; data: AuthUser }>('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
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
