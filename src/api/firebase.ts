import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  signInWithCustomToken,
  signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './client';
import { recordNotifyResult } from '../notifications/push';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    // Fast refresh / already initialized
    return getAuth(app);
  }
}

export const firebaseAuth = createAuth();
export const db = getFirestore(app);

let authPromise: Promise<unknown> | null = null;

export async function ensureFirebaseAuth(expectedUserId?: string) {
  if (
    firebaseAuth.currentUser &&
    expectedUserId &&
    firebaseAuth.currentUser.uid !== expectedUserId
  ) {
    await signOut(firebaseAuth);
    authPromise = null;
  }
  if (firebaseAuth.currentUser) return firebaseAuth.currentUser;
  if (authPromise) return authPromise;

  authPromise = (async () => {
    const res = await apiFetch<{ success: boolean; data: { firebaseToken: string } }>(
      '/communication/firebase-token',
    );
    const credential = await signInWithCustomToken(firebaseAuth, res.data.firebaseToken);
    return credential.user;
  })();

  try {
    return await authPromise;
  } catch (error) {
    authPromise = null;
    throw error;
  }
}

export async function signOutFirebase() {
  authPromise = null;
  if (!firebaseAuth.currentUser) return;
  try {
    await signOut(firebaseAuth);
  } catch {
    // App logout should still complete.
  }
}

export async function createConversation(participantUserId: string) {
  const res = await apiFetch<{ success: boolean; data: { conversationId: string } }>(
    '/communication/conversations',
    {
      method: 'POST',
      body: JSON.stringify({ participantUserId }),
    },
  );
  return res.data.conversationId;
}

export async function notifyConversation(
  conversationId: string,
  payload: { content: string; senderName: string },
) {
  try {
    await apiFetch(`/communication/conversations/${conversationId}/notify`, {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        content: payload.content,
        senderName: payload.senderName,
      }),
    });
    recordNotifyResult(true, 'Server accepted chat push for the other person.');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chat notify request failed.';
    recordNotifyResult(false, message);
    throw err;
  }
}
