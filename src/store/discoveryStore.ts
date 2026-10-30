import { create } from 'zustand';
import { discoveryProfiles } from '@/data/mockData';
import type { UserPreferences } from '@/api/datingClient';

export interface DiscoveryFilters {
  gender: 'women' | 'men' | 'everyone';
  ageRange: [number, number];
  distance: number;
  fallbackDistance: number;
  languages: string[];
}

export interface SwipeRecord {
  profileId: string;
  direction: 'left' | 'right';
}

interface DiscoveryState {
  currentIndex: number;
  filters: DiscoveryFilters;
  preferencesVersion: number;
  swipeHistory: SwipeRecord[];
  likedProfiles: string[];
  passedProfiles: string[];
  profiles: typeof discoveryProfiles;
  swipeRight: (profileId: string) => void;
  swipeLeft: (profileId: string) => void;
  undoSwipe: () => void;
  nextProfile: () => void;
  setFilters: (filters: Partial<DiscoveryFilters>) => void;
  applyBackendPreferences: (prefs: Partial<UserPreferences>) => void;
  incrementPreferencesVersion: () => void;
  resetDiscovery: () => void;
}

export const defaultFilters: DiscoveryFilters = {
  gender: 'everyone',
  ageRange: [18, 80],
  distance: 50,
  fallbackDistance: 50,
  languages: [],
};

export const mapGenderToInterestedIn = (
  gender: DiscoveryFilters['gender'],
): 'male' | 'female' | 'everyone' => {
  if (gender === 'women') return 'female';
  if (gender === 'men') return 'male';
  return 'everyone';
};

export const mapInterestedInToGender = (
  interestedIn?: 'male' | 'female' | 'everyone',
): DiscoveryFilters['gender'] => {
  if (interestedIn === 'female') return 'women';
  if (interestedIn === 'male') return 'men';
  return 'everyone';
};

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
  currentIndex: 0,
  filters: defaultFilters,
  preferencesVersion: 0,
  swipeHistory: [],
  likedProfiles: [],
  passedProfiles: [],
  profiles: discoveryProfiles,

  swipeRight: (profileId: string) =>
    set((state) => ({
      likedProfiles: [...state.likedProfiles, profileId],
      swipeHistory: [
        ...state.swipeHistory,
        { profileId, direction: 'right' },
      ],
    })),

  swipeLeft: (profileId: string) =>
    set((state) => ({
      passedProfiles: [...state.passedProfiles, profileId],
      swipeHistory: [
        ...state.swipeHistory,
        { profileId, direction: 'left' },
      ],
    })),

  undoSwipe: () =>
    set((state) => {
      if (state.swipeHistory.length === 0) return state;

      const lastSwipe = state.swipeHistory[state.swipeHistory.length - 1];
      const newHistory = state.swipeHistory.slice(0, -1);

      return {
        swipeHistory: newHistory,
        likedProfiles:
          lastSwipe.direction === 'right'
            ? state.likedProfiles.filter((id) => id !== lastSwipe.profileId)
            : state.likedProfiles,
        passedProfiles:
          lastSwipe.direction === 'left'
            ? state.passedProfiles.filter((id) => id !== lastSwipe.profileId)
            : state.passedProfiles,
      };
    }),

  nextProfile: () =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
    })),

  setFilters: (newFilters: Partial<DiscoveryFilters>) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      preferencesVersion: state.preferencesVersion + 1,
    })),

  applyBackendPreferences: (prefs: Partial<UserPreferences>) =>
    set((state) => {
      const nextFilters: DiscoveryFilters = {
        gender: prefs.interested_in
          ? mapInterestedInToGender(prefs.interested_in)
          : state.filters.gender,
        ageRange: [
          prefs.age_min ?? state.filters.ageRange[0],
          prefs.age_max ?? state.filters.ageRange[1],
        ],
        distance: prefs.max_distance_km ?? state.filters.distance,
        fallbackDistance: state.filters.fallbackDistance,
        languages: prefs.interested_languages ?? state.filters.languages,
      };
      return {
        filters: nextFilters,
      };
    }),

  incrementPreferencesVersion: () =>
    set((state) => ({
      preferencesVersion: state.preferencesVersion + 1,
    })),

  resetDiscovery: () =>
    set({
      currentIndex: 0,
      swipeHistory: [],
      likedProfiles: [],
      passedProfiles: [],
    }),
}));
