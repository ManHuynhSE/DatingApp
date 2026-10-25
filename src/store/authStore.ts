import { create } from 'zustand';
import { currentUser, UserProfile } from '@/data/mockData';
import type { BackendProfile } from '@/api/client';

export function profileToUser(
  profile: BackendProfile,
  fallback: Partial<UserProfile> = {},
): UserProfile {
  return {
    id: profile.userId,
    name: profile.name,
    age: profile.age ?? 0,
    verified: fallback.verified ?? false,
    pronouns: fallback.pronouns ?? '',
    occupation: profile.occupation ?? '',
    company: fallback.company,
    education: fallback.education,
    distance: fallback.distance ?? '',
    location: fallback.location ?? '',
    aboutMe: profile.bio ?? '',
    photos: profile.photoUrls.length > 0 ? profile.photoUrls : (fallback.photos ?? []),
    details: fallback.details ?? {
      height: '',
      smoking: '',
      drinking: '',
      pets: '',
      children: '',
      zodiac: '',
      religion: '',
      education: '',
      exercise: '',
    },
    interests: profile.interests,
    languages: profile.languages,
    relationshipGoal: fallback.relationshipGoal ?? '',
    profileCompletion: profile.completion,
    online: true,
  };
}

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
  setProfile: (profile: BackendProfile) => void;
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
  setProfile: (profile) =>
    set((state) => ({
      user: profileToUser(profile, state.user ?? undefined),
      isAuthenticated: Boolean(state.idToken),
    })),
}));
