import { create } from 'zustand';
import { discoveryProfiles } from '@/data/mockData';

interface DiscoveryFilters {
  gender: 'women' | 'men' | 'everyone';
  ageRange: [number, number];
  distance: number;
  fallbackDistance: number;
  languages: string[];
}

interface SwipeRecord {
  profileId: string;
  direction: 'left' | 'right';
}

interface DiscoveryState {
  currentIndex: number;
  filters: DiscoveryFilters;
  swipeHistory: SwipeRecord[];
  likedProfiles: string[];
  passedProfiles: string[];
  profiles: typeof discoveryProfiles;
  swipeRight: (profileId: string) => void;
  swipeLeft: (profileId: string) => void;
  undoSwipe: () => void;
  nextProfile: () => void;
  setFilters: (filters: Partial<DiscoveryFilters>) => void;
  resetDiscovery: () => void;
}

const defaultFilters: DiscoveryFilters = {
  gender: 'women',
  ageRange: [18, 35],
  distance: 25,
  fallbackDistance: 50,
  languages: [],
};

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
  currentIndex: 0,
  filters: defaultFilters,
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
    })),

  resetDiscovery: () =>
    set({
      currentIndex: 0,
      swipeHistory: [],
      likedProfiles: [],
      passedProfiles: [],
    }),
}));
