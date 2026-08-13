import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const AUTH_KEY = 'dsms_parent_auth';

function expoLanHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.linkingUri ||
    '';
  const match = String(hostUri).match(/(\d{1,3}(?:\.\d{1,3}){3})/);
  const ip = match?.[1];
  if (!ip || ip.startsWith('127.')) return null;
  return ip;
}

function resolveApiBase() {
  const configured = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  const isLoopback = /localhost|127\.0\.0\.1/.test(configured);
  if (!isLoopback || Platform.OS === 'ios' || Platform.OS === 'web') return configured;

  // Android emulator/device cannot reach the host via localhost.
  const host = expoLanHost() ?? '10.0.2.2';
  return configured.replace(/localhost|127\.0\.0\.1/g, host);
}

export const API_BASE = resolveApiBase();

export async function getStoredAuth() {
  const raw = await AsyncStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setStoredAuth(value: unknown | null) {
  if (!value) {
    await AsyncStorage.removeItem(AUTH_KEY);
    return;
  }
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(value));
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit & { subdomain?: string | null } = {},
): Promise<T> {
  const auth = await getStoredAuth();
  const token = auth?.token;
  const subdomain =
    options.subdomain ??
    auth?.children?.find((child: { childId: string }) => child.childId === auth.activeChildId)
      ?.subdomain ??
    auth?.children?.[0]?.subdomain ??
    null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (subdomain) headers['custom-subdomain'] = subdomain;

  const { subdomain: _ignored, ...fetchOptions } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  const body = await response.text();
  let parsed: any = null;
  try {
    parsed = body ? JSON.parse(body) : null;
  } catch {
    parsed = { message: body };
  }

  if (!response.ok) {
    const message = Array.isArray(parsed?.message)
      ? parsed.message.join(', ')
      : parsed?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return parsed as T;
}
