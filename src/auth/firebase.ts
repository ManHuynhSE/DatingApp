import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Platform } from 'react-native';
import { Firestore, getFirestore } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  getReactNativePersistence,
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
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});
const isConfigured = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

if (isConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  firestore = getFirestore(app);
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      // Firebase can already hold an Auth instance during Fast Refresh.
      // Reuse it; this fallback is not used for the first initialization.
      auth = getAuth(app);
    }
  }
}

export const firebaseDb = firestore;

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
    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore if not signed in via Google
    }
    return auth.signOut();
  },
  async signInWithGoogleToken(accessToken: string) {
    if (!auth) throw new Error('Firebase is not configured');
    return signInWithCredential(
      auth,
      GoogleAuthProvider.credential(null, accessToken),
    );
  },
  async signInWithGoogleNative() {
    if (!auth) throw new Error('Firebase is not configured');
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;
    if (!idToken) throw new Error('Could not retrieve Google ID Token');
    
    const credential = GoogleAuthProvider.credential(idToken);
    return signInWithCredential(auth, credential);
  },
  async getIdToken() {
    if (!auth?.currentUser) throw new Error('No user signed in');
    return auth.currentUser.getIdToken();
  },
};
