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
  | 'relationship_intention'
  | 'relationshipGoal'
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
        relationship_intention: user.relationship_intention ?? null,
        relationshipGoal: user.relationshipGoal ?? '',
      },
    }),
  update: (updates) => set((state) => ({
    draft: state.draft ? { ...state.draft, ...updates } : null,
  })),
  reset: () => set({ draft: null }),
}));
