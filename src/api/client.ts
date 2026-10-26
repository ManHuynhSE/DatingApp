const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://YOUR_COMPUTER_LAN_IP:3000/api';

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

  const bodyText = await response.text();
  let body: unknown = null;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = null;
  }
  const errorMessage =
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string'
      ? body.message
      : bodyText || response.statusText || 'Request failed';
  if (!response.ok) {
    throw new ApiError(response.status, `${errorMessage} (${response.status})`);
  }
  return body as T;
}

export const api = {
  health: () => request<{ status: string; service: string }>('/health/live'),
  getMyProfile: (idToken: string) =>
    request<BackendProfile | null>('/profile/me', {}, idToken),
  updateMyProfile: (idToken: string, profile: Record<string, unknown>) =>
    request<BackendProfile>('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }, idToken),
};

export { API_BASE_URL };
