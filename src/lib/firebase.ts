// Firebase client SDK initialization.
// All values come from NEXT_PUBLIC_* env vars — see .env.example.
// Safe to expose on the client: Firebase web config is not a secret,
// access is controlled by Firestore/Storage security rules, not by hiding this config.
//
// Lazy getters (not eager top-level exports): Next.js can evaluate this module
// during server-side rendering / build, where calling getAuth() eagerly can
// throw or create duplicate instances. Each getFirebase*() only initializes on
// first use, in the browser, when something actually needs it.
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function assertConfig() {
  const missing = Object.entries(firebaseConfig).filter(([, v]) => !v);
  if (missing.length > 0 && typeof window !== 'undefined') {
    // Fail loudly in the browser console rather than silently no-oping —
    // a half-configured Firebase app produces confusing "auth/invalid-api-key" errors otherwise.
    console.error(
      `[firebase] Missing env vars: ${missing.map(([k]) => k).join(', ')}. Copy .env.example to .env.local and fill in your Firebase web app config.`
    );
  }
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    assertConfig();
    appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return appInstance;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) authInstance = getAuth(getFirebaseApp());
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(getFirebaseApp());
  return dbInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) storageInstance = getStorage(getFirebaseApp());
  return storageInstance;
}

export function getGoogleProvider(): GoogleAuthProvider {
  if (!googleProviderInstance) {
    googleProviderInstance = new GoogleAuthProvider();
  }
  return googleProviderInstance;
}
