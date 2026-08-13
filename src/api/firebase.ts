import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  signInWithCustomToken,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './client';

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

export async function ensureFirebaseAuth() {
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
  await apiFetch(`/communication/conversations/${conversationId}/notify`, {
    method: 'POST',
    body: JSON.stringify({
      conversationId,
      content: payload.content,
      senderName: payload.senderName,
    }),
  });
}
