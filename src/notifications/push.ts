import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { API_BASE, apiFetch } from '../api/client';

type NotificationsModule = typeof import('expo-notifications');

type NotificationLike = {
  request?: {
    identifier?: string;
    content?: { data?: Record<string, unknown> };
  };
};

type NotificationResponseLike = {
  notification?: NotificationLike;
};

let notificationsModule: NotificationsModule | null | undefined;
let handlerSet = false;

/**
 * Remote push APIs throw if `expo-notifications` is evaluated in Android Expo Go (SDK 53+).
 * Load the package only after we know we are not in Expo Go.
 */
function loadNotifications(): NotificationsModule | null {
  if (notificationsModule !== undefined) return notificationsModule;
  if (!canUseRemotePush()) {
    notificationsModule = null;
    return null;
  }
  // Delayed require: a static import runs DevicePushTokenAutoRegistration.fx, which
  // calls addPushTokenListener and throws in Android Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  notificationsModule = require('expo-notifications') as NotificationsModule;
  return notificationsModule;
}

function ensureNotificationHandler(Notifications: NotificationsModule) {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export function canUseRemotePush() {
  return Platform.OS !== 'web' && !isRunningInExpoGo();
}

const TOKEN_KEY_PLATFORM = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : Platform.OS;

let registeredToken: string | null = null;

export type PushDebugStatus = {
  state: 'idle' | 'registering' | 'registered' | 'skipped' | 'failed';
  detail: string;
  tokenTail: string | null;
  apiBase: string;
  lastNotify: 'idle' | 'ok' | 'failed';
  lastNotifyDetail: string;
};

const listeners = new Set<() => void>();

let pushStatus: PushDebugStatus = {
  state: 'idle',
  detail: 'Waiting for login…',
  tokenTail: null,
  apiBase: API_BASE,
  lastNotify: 'idle',
  lastNotifyDetail: 'Send a chat message to test.',
};

function emitPushStatus() {
  listeners.forEach((listener) => listener());
}

function setPushStatus(patch: Partial<PushDebugStatus>) {
  pushStatus = { ...pushStatus, ...patch, apiBase: API_BASE };
  emitPushStatus();
}

export function getPushStatus() {
  return pushStatus;
}

export function subscribePushStatus(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePushStatus() {
  return useSyncExternalStore(subscribePushStatus, getPushStatus, getPushStatus);
}

export function recordNotifyResult(ok: boolean, detail: string) {
  setPushStatus({
    lastNotify: ok ? 'ok' : 'failed',
    lastNotifyDetail: detail,
  });
}

function tokenTail(token: string) {
  const inner = token.match(/\[(.+)\]/)?.[1] ?? token;
  return inner.length <= 12 ? inner : `…${inner.slice(-8)}`;
}

export type PushPayload = {
  type?: string;
  conversationId?: string;
  schoolId?: string;
  href?: string;
};

export function getPushData(notification?: NotificationLike | null): PushPayload {
  const data = (notification?.request?.content?.data ?? {}) as Record<string, unknown>;
  return {
    type: typeof data.type === 'string' ? data.type : undefined,
    conversationId: typeof data.conversationId === 'string' ? data.conversationId : undefined,
    schoolId: typeof data.schoolId === 'string' ? data.schoolId : undefined,
    href: typeof data.href === 'string' ? data.href : undefined,
  };
}

export function subscribeToNotificationResponse(
  onOpen: (payload: PushPayload, identifier: string) => void,
): () => void {
  const Notifications = loadNotifications();
  if (!Notifications) return () => {};

  try {
    ensureNotificationHandler(Notifications);
    const open = (response: NotificationResponseLike | null | undefined) => {
      if (!response?.notification) return;
      const id = response.notification.request?.identifier ?? 'unknown';
      onOpen(getPushData(response.notification), id);
    };
    open(Notifications.getLastNotificationResponse() as NotificationResponseLike | null | undefined);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  } catch {
    return () => {};
  }
}

export async function registerPushNotifications() {
  setPushStatus({
    state: 'registering',
    detail: 'Requesting notification permission…',
    tokenTail: null,
  });

  if (!canUseRemotePush()) {
    setPushStatus({
      state: 'skipped',
      detail: isRunningInExpoGo()
        ? 'Expo Go cannot receive Android push. Install the EAS APK.'
        : 'Push is disabled on this platform.',
    });
    return null;
  }

  const Notifications = loadNotifications();
  if (!Notifications) {
    setPushStatus({ state: 'failed', detail: 'Could not load expo-notifications.' });
    return null;
  }
  if (!Device.isDevice) {
    setPushStatus({ state: 'skipped', detail: 'Push needs a physical device, not a simulator.' });
    return null;
  }

  try {
    ensureNotificationHandler(Notifications);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'School updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1A2B6D',
        sound: 'default',
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let permission = existing.status;
    if (permission !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      permission = requested.status;
    }
    if (permission !== 'granted') {
      setPushStatus({ state: 'skipped', detail: 'Notification permission was denied.' });
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
    if (!projectId) {
      setPushStatus({ state: 'failed', detail: 'Missing EAS projectId. Rebuild the app.' });
      return null;
    }

    setPushStatus({ detail: 'Fetching Expo push token…' });
    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResponse.data;
    if (!token) {
      setPushStatus({ state: 'failed', detail: 'Expo did not return a push token.' });
      return null;
    }

    setPushStatus({ detail: 'Saving token on the server…' });
    await apiFetch('/communication/fcm-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform: TOKEN_KEY_PLATFORM }),
    });
    registeredToken = token;
    setPushStatus({
      state: 'registered',
      detail: 'Token saved. This phone can receive push.',
      tokenTail: tokenTail(token),
    });
    return token;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Push registration failed.';
    setPushStatus({ state: 'failed', detail: message, tokenTail: null });
    return null;
  }
}

export async function unregisterPushNotifications() {
  const token = registeredToken;
  registeredToken = null;
  setPushStatus({
    state: 'idle',
    detail: 'Signed out. Token cleared on this device.',
    tokenTail: null,
    lastNotify: 'idle',
    lastNotifyDetail: 'Send a chat message to test.',
  });
  if (!token) return;
  try {
    await apiFetch('/communication/fcm-token/remove', {
      method: 'POST',
      body: JSON.stringify({ token, platform: TOKEN_KEY_PLATFORM }),
    });
  } catch {
    // Logout should still complete if unregister fails.
  }
}
