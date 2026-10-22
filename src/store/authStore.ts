import { create } from 'zustand';
import { currentUser, UserProfile } from '@/data/mockData';

interface AuthState {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  user: UserProfile | null;
  idToken: string | null;
  login: () => void;
  logout: () => void;
  completeOnboarding: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  setIdToken: (idToken: string | null) => void;
  setSession: (idToken: string | null, user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isOnboarded: false,
  user: null,
  idToken: null,

  login: () =>
    set({
      isAuthenticated: true,
      user: currentUser,
    }),

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
    }),
}));
