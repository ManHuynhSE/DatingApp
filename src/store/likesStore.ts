import { create } from 'zustand';
import { datingApi } from '../api/datingClient';
import { discoveryProfiles } from '../data/mockData';
import {
  type LikedUserItem,
  mapSwipedMeToLikedUser,
  mapMockProfileToLikedUser,
} from '../types/likedUser';

interface LikesState {
  likedUsers: LikedUserItem[];
  loading: boolean;
  error: string | null;
  fetchLikedUsers: (currentUserId?: string) => Promise<void>;
  passLikedUser: (currentUserId: string | undefined, targetUserId: string) => Promise<void>;
  likeLikedUser: (
    currentUserId: string | undefined,
    targetUserId: string,
  ) => Promise<{ isMatch: boolean; matchedUser?: LikedUserItem }>;
  removeLikedUser: (userId: string) => void;
}

export const useLikesStore = create<LikesState>((set, get) => ({
  likedUsers: [],
  loading: false,
  error: null,

  fetchLikedUsers: async (currentUserId?: string) => {
    set({ loading: true, error: null });

    // Fallback sample profiles if unauthenticated or offline/empty
    const fallbackSamples = discoveryProfiles.slice(0, 6).map(mapMockProfileToLikedUser);

    if (!currentUserId) {
      set({ likedUsers: fallbackSamples, loading: false });
      return;
    }

    try {
      const response = await datingApi.getUsersSwipedMe(currentUserId, {
        action: 'like',
        limit: 50,
      });

      const serverItems = response.data || [];
      if (serverItems.length > 0) {
        const mapped = serverItems.map(mapSwipedMeToLikedUser);
        set({ likedUsers: mapped, loading: false });
      } else {
        // If server returned 0 likes, fall back to sample liked users for demonstration
        set({ likedUsers: fallbackSamples, loading: false });
      }
    } catch (err: unknown) {
      // In case of error (e.g. server offline or network failure), use fallback sample profiles
      console.warn('Could not fetch server likes, using sample profiles:', err);
      set({ likedUsers: fallbackSamples, loading: false });
    }
  },

  passLikedUser: async (currentUserId: string | undefined, targetUserId: string) => {
    set((state) => ({
      likedUsers: state.likedUsers.filter((u) => u.userId !== targetUserId),
    }));

    if (currentUserId && !targetUserId.startsWith('profile-')) {
      try {
        await datingApi.createSwipe(currentUserId, targetUserId, 'pass');
      } catch (err) {
        console.warn('Error recording pass on liked user:', err);
      }
    }
  },

  likeLikedUser: async (currentUserId: string | undefined, targetUserId: string) => {
    const target = get().likedUsers.find((u) => u.userId === targetUserId);

    set((state) => ({
      likedUsers: state.likedUsers.filter((u) => u.userId !== targetUserId),
    }));

    let isMatch = true;
    if (currentUserId && !targetUserId.startsWith('profile-')) {
      try {
        const res = await datingApi.createSwipe(currentUserId, targetUserId, 'like');
        isMatch = res.isMatch ?? true;
      } catch (err) {
        console.warn('Error recording like back on user:', err);
      }
    }

    return { isMatch, matchedUser: target };
  },

  removeLikedUser: (userId: string) => {
    set((state) => ({
      likedUsers: state.likedUsers.filter((u) => u.userId !== userId),
    }));
  },
}));
