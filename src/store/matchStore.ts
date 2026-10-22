import { create } from 'zustand';
import { matchedProfiles, MatchedProfile } from '@/data/mockData';

interface MatchState {
  matches: MatchedProfile[];
  showMatchModal: boolean;
  latestMatch: MatchedProfile | null;
  addMatch: (match: MatchedProfile) => void;
  removeMatch: (matchId: string) => void;
  dismissMatchModal: () => void;
  showMatch: (match: MatchedProfile) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  matches: matchedProfiles,
  showMatchModal: false,
  latestMatch: null,

  addMatch: (match: MatchedProfile) =>
    set((state) => ({
      matches: [match, ...state.matches],
      latestMatch: match,
      showMatchModal: true,
    })),

  removeMatch: (matchId: string) =>
    set((state) => ({
      matches: state.matches.filter((m) => m.id !== matchId),
    })),

  dismissMatchModal: () =>
    set({
      showMatchModal: false,
    }),

  showMatch: (match: MatchedProfile) =>
    set({
      latestMatch: match,
      showMatchModal: true,
    }),
}));
