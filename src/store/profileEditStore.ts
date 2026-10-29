import { create } from 'zustand';
import type { UserProfile } from '@/data/mockData';

type Draft = Pick<UserProfile, 'name' | 'age' | 'occupation' | 'location' |'education'| 'aboutMe' | 'photos' | 'interests' | 'languages' | 'details'>;

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
        aboutMe: user.aboutMe,
        education:user.education,
        photos: [...user.photos],
        interests: [...user.interests],
        languages: [...user.languages],
        details: { ...user.details },
      },
    }),
  update: (updates) => set((state) => ({
    draft: state.draft ? { ...state.draft, ...updates } : null,
  })),
  reset: () => set({ draft: null }),
}));
