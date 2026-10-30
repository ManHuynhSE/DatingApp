import { Platform } from 'react-native';
import { firebaseAuth } from '@/auth/firebase';

const API_HOST =
  process.env.EXPO_PUBLIC_API_HOST ||
  'localhost';

const NATIVE_DATING_API_BASE_URL =
  process.env.EXPO_PUBLIC_DATING_API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  `http://${API_HOST}:3000/api`;

const WEB_DATING_API_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_DATING_API_URL || 'http://localhost:3000/api';

const DATING_API_BASE_URL = Platform.OS === 'web'
  ? WEB_DATING_API_BASE_URL
  : NATIVE_DATING_API_BASE_URL;

const AUTH_API_BASE_URL = Platform.OS === 'web'
  ? process.env.EXPO_PUBLIC_WEB_AUTH_API_URL || WEB_DATING_API_BASE_URL.replace(/\/api\/?$/, '')
  : process.env.EXPO_PUBLIC_AUTH_API_URL || NATIVE_DATING_API_BASE_URL.replace(/\/api\/?$/, '');

const REQUEST_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new DatingApiError(408, `Dating server did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export interface DatingPhoto {
  id: string;
  url: string;
  position: number;
  is_primary: boolean;
  created_at?: string;
}

export interface Hobby {
  id: string;
  name: string;
  category: string;
}

export interface DatingProfile {
  id: string;
  user_id: string;
  display_name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'non_binary' | 'other';
  bio: string | null;
  job_title: string | null;
  pets: string[];
  life_style: string[];
  hobbies: Hobby[];
  education: string | null;
  height_cm: number | null;
  city: string | null;
  ward: string | null;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
  languages: string[];
  users?: {
    id: string;
    email?: string | null;
    phone?: string | null;
    status?: string;
    last_active_at?: string | null;
    created_at?: string;
    photos?: DatingPhoto[];
  };
}

export interface DatingProfileListResponse {
  success: boolean;
  data: DatingProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RecommendationPageResponse {
  success: boolean;
  data: DatingProfile[];
  pagination: {
    limit: number;
    sessionId: string | null;
    nextCursor: string | null;
  };
}

export interface DatingSwipeResponse {
  success: boolean;
  isMatch: boolean;
  message: string;
  swipe?: {
    id: string;
    swiper_id: string;
    swiped_id: string;
    action: 'like' | 'pass' | 'super_like';
    created_at: string;
  };
  match?: {
    id: string;
    user1_id: string;
    user2_id: string;
    status: string;
    matched_at: string;
  };
  conversation?: {
    id: string;
    match_id: string;
    created_at: string;
  };
}

export interface DatingMatchItem {
  id: string;
  status: string;
  matched_at: string;
  unmatched_at?: string | null;
  partner: {
    id: string;
    status: string;
    profile: Pick<
      DatingProfile,
      'display_name' | 'birth_date' | 'gender' | 'bio' | 'city' | 'ward' | 'job_title' | 'is_verified'
    > | null;
    photo: Pick<DatingPhoto, 'url' | 'position' | 'is_primary'>[];
  };
  conversation?: { id: string; last_message_at: string | null; created_at: string } | null;
}

export interface DatingMatchListResponse {
  success: boolean;
  data: DatingMatchItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string | null;
      phone: string | null;
      status: string;
      last_active_at: string | null;
      created_at: string;
      updated_at: string;
    };
    isNewUser: boolean;
  };
}

export interface CreateDatingProfileInput {
  user_id: string;
  display_name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'non_binary' | 'other';
  bio?: string | null;
  job_title?: string | null;
  pets?: string[];
  life_style?: string[];
  hobbies?: Hobby[];
  education?: string | null;
  height_cm?: number | null;
  city?: string | null;
  ward?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  languages?: string[];
}

export interface UpdateDatingProfileInput {
  display_name?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'non_binary' | 'other';
  bio?: string | null;
  job_title?: string | null;
  pets?: string[];
  life_style?: string[];
  hobbies?: Hobby[];
  education?: string | null;
  height_cm?: number | null;
  city?: string | null;
  ward?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  languages?: string[];
}

export type UpsertDatingProfileInput = Omit<CreateDatingProfileInput, 'user_id'>;

export interface ListProfilesParams {
  page?: number;
  limit?: number;
  gender?: 'male' | 'female' | 'non_binary' | 'other';
  city?: string;
  ward?: string;
  search?: string;
  is_verified?: boolean;
  minAge?: number;
  maxAge?: number;
  sortBy?: 'display_name' | 'birth_date';
  sortOrder?: 'asc' | 'desc';
  includeUser?: boolean;
  includePhotos?: boolean;
}

export interface DeleteProfileResponse {
  success: boolean;
  message: string;
  deleted: boolean;
}

export class DatingApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'DatingApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${DATING_API_BASE_URL.replace(/\/+$/, '')}${path}`;
  const idToken = await firebaseAuth.getIdToken().catch(() => null);
  const response = await fetchWithTimeout(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : text || response.statusText || 'Dating server request failed';
    throw new DatingApiError(response.status, `${message} (${response.status})`);
  }

  return body as T;
}

export const datingApi = {
  health: () => request<{ success: boolean; message: string }>('/health'),

  getRecommendations: (userId: string, options: { limit?: number; cursor?: string } = {}) => {
    const query = new URLSearchParams({ limit: String(options.limit ?? 50) });
    if (options.cursor) query.append('cursor', options.cursor);
    return request<RecommendationPageResponse>(`/recommendations/${userId}?${query.toString()}`);
  },

  recordRecommendationImpressions: (
    userId: string,
    sessionId: string,
    candidateUserIds: string[],
  ) =>
    request<{ success: boolean; data: { recorded: number } }>(
      `/recommendations/${userId}/impressions`,
      {
        method: 'POST',
        body: JSON.stringify({ sessionId, candidateUserIds }),
      },
    ),

  getUserProfile: (userId: string, includeUser = true, includePhotos = true) => {
    const query = new URLSearchParams({
      includeUser: String(includeUser),
      includePhotos: String(includePhotos),
    });
    return request<{ success: boolean; data: DatingProfile }>(`/profiles/user/${userId}?${query.toString()}`);
  },

  listProfiles: (params: ListProfilesParams = {}) => {
    const includePhotos = params.includePhotos ?? false;
    const includeUser = includePhotos ? true : (params.includeUser ?? false);

    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      includeUser: String(includeUser),
      includePhotos: String(includePhotos),
    });

    if (params.gender) query.append('gender', params.gender);
    if (params.city) query.append('city', params.city);
    if (params.ward) query.append('ward', params.ward);
    if (params.search) query.append('search', params.search);
    if (params.is_verified !== undefined) query.append('is_verified', String(params.is_verified));
    if (params.minAge !== undefined) query.append('minAge', String(params.minAge));
    if (params.maxAge !== undefined) query.append('maxAge', String(params.maxAge));
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    return request<DatingProfileListResponse>(`/profiles?${query.toString()}`);
  },

  getProfileById: (id: string, includeUser = true, includePhotos = true) => {
    const query = new URLSearchParams({
      includeUser: String(includeUser),
      includePhotos: String(includePhotos),
    });
    return request<{ success: boolean; data: DatingProfile }>(`/profiles/${id}?${query.toString()}`);
  },

  getProfileByUserId: (userId: string, includeUser = true, includePhotos = true) => {
    const query = new URLSearchParams({
      includeUser: String(includeUser),
      includePhotos: String(includePhotos),
    });
    return request<{ success: boolean; data: DatingProfile }>(`/profiles/user/${userId}?${query.toString()}`);
  },

  createProfile: (profileData: CreateDatingProfileInput) =>
    request<{ success: boolean; message?: string; data: DatingProfile }>(
      '/profiles',
      {
        method: 'POST',
        body: JSON.stringify(profileData),
      },
    ),

  updateProfile: (userId: string, profileData: UpdateDatingProfileInput) =>
    request<{ success: boolean; message?: string; data: DatingProfile }>(
      `/profiles/user/${userId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      },
    ),

  updateProfileById: (id: string, profileData: UpdateDatingProfileInput) =>
    request<{ success: boolean; message?: string; data: DatingProfile }>(
      `/profiles/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      },
    ),

  upsertProfile: (userId: string, profileData: UpsertDatingProfileInput) =>
    request<{ success: boolean; message: string; data: DatingProfile }>(
      `/profiles/user/${userId}`,
      {
        method: 'PUT',
        body: JSON.stringify(profileData),
      },
    ),

  deleteProfile: (id: string) =>
    request<DeleteProfileResponse>(`/profiles/${id}`, {
      method: 'DELETE',
    }),

  deleteProfileByUserId: (userId: string) =>
    request<DeleteProfileResponse>(`/profiles/user/${userId}`, {
      method: 'DELETE',
    }),

  createSwipe: (
    swiperId: string,
    swipedId: string,
    action: 'like' | 'pass' | 'super_like' = 'like',
  ) =>
    request<DatingSwipeResponse>('/swipes', {
      method: 'POST',
      body: JSON.stringify({
        swiper_id: swiperId,
        swiped_id: swipedId,
        action,
      }),
    }),

  getSwipesByUserId: (
    userId: string,
    params: { page?: number; limit?: number; action?: 'like' | 'pass' | 'super_like' } = {},
  ) => {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    });
    if (params.action) query.append('action', params.action);
    return request<{ success: boolean; data: unknown[]; pagination: unknown }>(
      `/swipes/user/${userId}?${query.toString()}`,
    );
  },

  getUserMatches: (userId: string) =>
    request<DatingMatchListResponse>(`/matches/user/${userId}`),

  getChatConversations: () =>
    request<{ success: boolean; data: ChatConversationSummary[] }>('/chat/conversations'),

  getChatConversation: (conversationId: string) =>
    request<{ success: boolean; data: ChatConversationSummary }>(
      `/chat/conversations/${conversationId}`,
    ),

  getOrCreateChatConversation: (matchId: string) =>
    request<{ success: boolean; data: ChatConversationSummary }>(
      `/chat/matches/${matchId}/conversation`,
      { method: 'POST' },
    ),

  sendChatMessage: (
    conversationId: string,
    input: { clientMessageId: string; text: string },
  ) =>
    request<{ success: boolean; data: ChatMessageDto }>(
      `/chat/conversations/${conversationId}/messages`,
      { method: 'POST', body: JSON.stringify(input) },
    ),

  signInWithFirebase: (idToken: string) => {
    const url = `${AUTH_API_BASE_URL}/auth/firebase`;
    return fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }).then(async (res) => {
      const body = await res.json();
      if (!res.ok) {
        throw new DatingApiError(res.status, body.message || 'Firebase sign-in failed');
      }
      return body as AuthResponse;
    });
  },
};

export interface ChatConversationSummary {
  conversationId: string;
  matchId: string;
  partner: {
    id: string;
    firebaseUid: string | null;
    name: string;
    birthDate: string | null;
    occupation: string | null;
    city: string | null;
    verified: boolean;
    avatar: string | null;
  };
  lastMessage?: string;
  lastMessageAt?: string | null;
}

export interface ChatMessageDto {
  id: string;
  senderUid: string;
  text: string;
  type: 'text';
  createdAt: string;
}

export { DATING_API_BASE_URL };
