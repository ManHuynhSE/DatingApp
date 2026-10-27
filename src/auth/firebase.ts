import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Platform } from 'react-native';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const isConfigured = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getReactNativePersistence } = require('firebase/auth/react-native');
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      auth = getAuth(app);
    }
  }
}

export const firebaseAuth = {
  isConfigured,
  get currentAuth() {
    return auth;
  },
  subscribe(listener: (user: User | null) => void) {
    return auth ? onAuthStateChanged(auth, listener) : () => undefined;
  },
  async signInWithEmail(email: string, password: string) {
    if (!auth) throw new Error('Firebase is not configured');
    return signInWithEmailAndPassword(auth, email, password);
  },
  async createAccount(email: string, password: string) {
    if (!auth) throw new Error('Firebase is not configured');
    return createUserWithEmailAndPassword(auth, email, password);
  },
  async resetPassword(email: string) {
    if (!auth) throw new Error('Firebase is not configured');
    return sendPasswordResetEmail(auth, email);
  },
  async signOut() {
    if (!auth) return;
    return auth.signOut();
  },
  async signInWithGoogleToken(accessToken: string) {
    if (!auth) throw new Error('Firebase is not configured');
    return signInWithCredential(
      auth,
      GoogleAuthProvider.credential(null, accessToken),
    );
  },
  async getIdToken() {
    if (!auth?.currentUser) throw new Error('No user signed in');
    return auth.currentUser.getIdToken();
  },
};
