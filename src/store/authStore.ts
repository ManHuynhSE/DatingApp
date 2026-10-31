import { create } from 'zustand';
import { UserProfile } from '@/data/mockData';

interface AuthState {
  isAuthenticated: boolean;
  /** true once the Firebase onAuthStateChanged callback has fired at least once.
   *  Used by the root index to know when it is safe to redirect. */
  isAuthReady: boolean;
  isOnboarded: boolean;
  user: UserProfile | null;
  idToken: string | null;
  logout: () => void;
  completeOnboarding: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  setIdToken: (idToken: string | null) => void;
  setSession: (idToken: string | null, user: UserProfile | null) => void;
  setAuthReady: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isAuthReady: false,
  isOnboarded: false,
  user: null,
  idToken: null,

  logout: () =>
    set({
      isAuthenticated: false,
      isOnboarded: false,
      user: null,
      idToken: null,
    }),

  completeOnboarding: () =>
    set({
      isOnboarded: true,
    }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  setIdToken: (idToken) => set({ idToken }),
  setSession: (idToken, user) =>
    set({
      idToken,
      user,
      isAuthenticated: Boolean(idToken),
      isAuthReady: true,
    }),
  setAuthReady: () => set({ isAuthReady: true }),
}));
