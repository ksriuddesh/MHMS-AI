import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getAnalytics, type Analytics, isSupported, logEvent, setUserId } from 'firebase/analytics';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let db: Firestore | null = null;

// Fallback config provided by user (used only if .env is not present)
const fallbackConfig = {
  apiKey: 'AIzaSyBtJIKn2EB5XSsnpcV19riIXwwthWvyhUQ',
  authDomain: 'mhms77-27f4f.firebaseapp.com',
  projectId: 'mhms77-27f4f',
  storageBucket: 'mhms77-27f4f.firebasestorage.app',
  messagingSenderId: '863958127328',
  appId: '1:863958127328:web:61a8aef3620c2816f7b685'
} as const;

export function isFirebaseConfigured(): boolean {
  const hasEnv = Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID &&
      import.meta.env.VITE_FIREBASE_APP_ID
  );
  return hasEnv || Boolean(fallbackConfig.apiKey);
}

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackConfig.appId,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };
  app = initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  auth = getAuth(getFirebaseApp());
  // Ensure auth persists across reloads/sessions
  try {
    void setPersistence(auth, browserLocalPersistence);
  } catch {}
  return auth;
}

export function getDb(): Firestore {
  if (db) return db;
  db = getFirestore(getFirebaseApp());
  return db;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (analytics) return analytics;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    analytics = getAnalytics(getFirebaseApp());
    return analytics;
  } catch {
    return null;
  }
}

export function getGoogleProvider(): GoogleAuthProvider {
  if (googleProvider) return googleProvider;
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account', display: 'popup' });
  return googleProvider;
}

export async function logAnalyticsEvent(eventName: string, params?: Record<string, unknown>) {
  const a = await getFirebaseAnalytics();
  if (!a) return;
  logEvent(a, eventName as any, params as any);
}

export async function analyticsSetUserId(id: string) {
  const a = await getFirebaseAnalytics();
  if (!a) return;
  setUserId(a, id);
}


