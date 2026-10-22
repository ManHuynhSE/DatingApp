const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.31:3000/api';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface BackendProfile {
  id: string;
  userId: string;
  name: string;
  age: number | null;
  occupation: string | null;
  bio: string | null;
  interests: string[];
  languages: string[];
  photoUrls: string[];
  completion: number;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  idToken?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body?.message === 'string' ? body.message : 'Request failed';
    throw new ApiError(response.status, message);
  }
  return body as T;
}

export const api = {
  health: () => request<{ status: string; service: string }>('/health/live'),
  getMyProfile: (idToken: string) =>
    request<BackendProfile | null>('/profile/me', {}, idToken),
  updateMyProfile: (idToken: string, profile: Record<string, unknown>) =>
    request('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }, idToken),
};

export { API_BASE_URL };
