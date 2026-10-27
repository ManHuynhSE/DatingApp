const API_HOST =
  process.env.EXPO_PUBLIC_API_HOST ||
  'localhost';

const DATING_API_BASE_URL =
  process.env.EXPO_PUBLIC_DATING_API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  `http://${API_HOST}:3000/api`;

const AUTH_API_BASE_URL =
  process.env.EXPO_PUBLIC_AUTH_API_URL ||
  DATING_API_BASE_URL.replace(/\/api\/?$/, '');

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

export interface DatingProfile {
  id: string;
  user_id: string;
  display_name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'non_binary' | 'other';
  bio: string | null;
  job_title: string | null;
  city: string | null;
  latitude?: number | null;
  longitude?: number | null;
  height_cm?: number | null;
  education?: string | null;
  pets?: string[];
  life_style?: string[];
  languages: string[];
  is_verified: boolean;
  users?: {
    id: string;
    email?: string | null;
    phone?: string | null;
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
  user1_id: string;
  user2_id: string;
  status: string;
  matched_at: string;
  otherUser?: {
    id: string;
    profiles?: DatingProfile;
    photos?: DatingPhoto[];
  };
}

export interface DatingMatchListResponse {
  success: boolean;
  data: DatingMatchItem[];
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
  const response = await fetchWithTimeout(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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

  getUserProfile: (userId: string) =>
    request<{ success: boolean; data: DatingProfile }>(`/profiles/user/${userId}`),

  listProfiles: (params: {
    page?: number;
    limit?: number;
    gender?: 'male' | 'female' | 'non_binary' | 'other';
    city?: string;
    search?: string;
    minAge?: number;
    maxAge?: number;
    includeUser?: boolean;
    includePhotos?: boolean;
  } = {}) => {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 30),
      includeUser: String(params.includeUser ?? true),
      includePhotos: String(params.includePhotos ?? true),
    });

    if (params.gender) query.append('gender', params.gender);
    if (params.city) query.append('city', params.city);
    if (params.search) query.append('search', params.search);
    if (params.minAge !== undefined) query.append('minAge', String(params.minAge));
    if (params.maxAge !== undefined) query.append('maxAge', String(params.maxAge));

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

  createProfile: (profileData: {
    user_id: string;
    display_name: string;
    birth_date: string;
    gender: 'male' | 'female' | 'non_binary' | 'other';
    bio?: string | null;
    job_title?: string | null;
    city?: string | null;
    height_cm?: number | null;
  }) =>
    request<{ success: boolean; data: DatingProfile }>(
      '/profiles',
      {
        method: 'POST',
        body: JSON.stringify(profileData),
      }
    ),
};

export { DATING_API_BASE_URL };
