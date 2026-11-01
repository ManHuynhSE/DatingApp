import { create } from 'zustand';
import { datingApi } from '../api/datingClient';
import { type LikedUserItem, mapSwipedMeToLikedUser } from '../types/likedUser';

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

    if (!currentUserId) {
      set({ likedUsers: [], loading: false });
      return;
    }

    try {
      const response = await datingApi.getUsersSwipedMe(currentUserId, {
        limit: 50,
      });

      const serverItems = response.data || [];
      set({ likedUsers: serverItems.map(mapSwipedMeToLikedUser), loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load likes.';
      set({ likedUsers: [], loading: false, error: message });
    }
  },

  passLikedUser: async (currentUserId: string | undefined, targetUserId: string) => {
    set((state) => ({
      likedUsers: state.likedUsers.filter((u) => u.userId !== targetUserId),
    }));

    if (currentUserId) {
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
    if (currentUserId) {
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
