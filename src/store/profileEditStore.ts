import { create } from 'zustand';
import type { UserProfile } from '@/data/mockData';

type Draft = Pick<
  UserProfile,
  | 'name'
  | 'age'
  | 'occupation'
  | 'location'
  | 'city'
  | 'ward'
  | 'education'
  | 'aboutMe'
  | 'photos'
  | 'interests'
  | 'hobbies'
  | 'languages'
  | 'details'
>;

interface ProfileEditState {
  draft: Draft | null;
  start: (user: UserProfile) => void;
  update: (updates: Partial<Draft>) => void;
  reset: () => void;
}

export const useProfileEditStore = create<ProfileEditState>((set) => ({
  draft: null,
  start: (user) =>
    set({
      draft: {
        name: user.name,
        age: user.age,
        occupation: user.occupation,
        location: user.location,
        city: user.city,
        ward: user.ward,
        aboutMe: user.aboutMe,
        education: user.education,
        photos: [...user.photos],
        interests: [...user.interests],
        hobbies: user.hobbies ? [...user.hobbies] : [],
        languages: [...user.languages],
        details: { ...user.details },
      },
    }),
  update: (updates) => set((state) => ({
    draft: state.draft ? { ...state.draft, ...updates } : null,
  })),
  reset: () => set({ draft: null }),
}));
