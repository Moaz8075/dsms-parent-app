import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { apiFetch } from '../api/client';

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
  const Notifications = loadNotifications();
  if (!Notifications) return null;
  if (!Device.isDevice) return null;

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
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
    if (!projectId) return null;

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResponse.data;
    if (!token) return null;

    await apiFetch('/communication/fcm-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform: TOKEN_KEY_PLATFORM }),
    });
    registeredToken = token;
    return token;
  } catch {
    return null;
  }
}

export async function unregisterPushNotifications() {
  const token = registeredToken;
  registeredToken = null;
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
