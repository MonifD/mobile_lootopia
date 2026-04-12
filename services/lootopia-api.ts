import type { AuthSession, LoginPayload, LoginResponse, RegisterPayload } from '@/types/auth';
import type {
    Achievement,
    Hunt,
    HuntReview,
    HuntReviewStats,
    LeaderboardEntry,
    LeaderboardStats,
    PlayerProfile,
    UserRank,
} from '@/types/game';

const FALLBACK_API_URL = 'http://10.0.2.2:8080/api';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? FALLBACK_API_URL;

let bearerToken: string | null = null;

type ApiErrorPayload = {
  message?: string;
  error?: string;
  detail?: string;
  'hydra:description'?: string;
};

type HydraCollection<T> = {
  'hydra:member'?: T[];
};

type PrimitiveRecord = Record<string, unknown>;

function buildUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function parseJsonSafe(text: string): unknown {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

function unwrapCollection<T>(payload: unknown): T[] {
  const data = unwrapData<unknown>(payload);

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === 'object' && 'hydra:member' in data) {
    return ((data as HydraCollection<T>)['hydra:member'] ?? []) as T[];
  }

  return [];
}

function toNumber(value: unknown, fallback = 0): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizeLeaderboardEntry(raw: unknown, index: number): LeaderboardEntry {
  const source = (raw ?? {}) as PrimitiveRecord;

  return {
    id: toNumber(source.id, index + 1),
    username: toString(source.username || source.userName || source.name, 'Joueur'),
    city: toNullableString(source.city),
    level: toString(source.level, 'BRONZE'),
    totalPoints: toNumber(source.totalPoints || source.points),
    completedHunts: toNumber(source.completedHunts || source.huntsCompleted),
    loginStreak: toNumber(source.loginStreak || source.streak),
    rank: source.rank != null ? toNumber(source.rank) : index + 1,
  };
}

function normalizeLeaderboardStats(raw: unknown): LeaderboardStats {
  const source = (raw ?? {}) as PrimitiveRecord;

  return {
    totalPlayers: toNumber(source.totalPlayers || source.players || source.total_users),
    totalPoints: toNumber(source.totalPoints || source.points || source.total_points),
    totalCompletedHunts: toNumber(source.totalCompletedHunts || source.completedHunts || source.total_hunts),
    averagePoints: toNumber(source.averagePoints || source.avgPoints || source.average_points),
  };
}

function normalizeReview(raw: unknown, index: number): HuntReview {
  const source = (raw ?? {}) as PrimitiveRecord;
  const userValue = source.user as PrimitiveRecord | undefined;

  return {
    id: toNumber(source.id, index + 1),
    rating: toNumber(source.rating, 0),
    comment: toString(source.comment),
    status: toString(source.status),
    createdAt: toString(source.createdAt || source.created_at),
    user: userValue
      ? {
          id: toNumber(userValue.id),
          username: toString(userValue.username || userValue.name, 'Joueur'),
        }
      : null,
  };
}

function normalizeReviewStats(raw: unknown): HuntReviewStats {
  const source = (raw ?? {}) as PrimitiveRecord;

  return {
    averageRating: toNumber(source.averageRating || source.average || source.rating_avg),
    totalReviews: toNumber(source.totalReviews || source.total || source.count),
    distribution: ((source.distribution || source.breakdown || {}) as Record<string, number>) ?? {},
  };
}

function normalizeLeaderboard(payload: unknown): LeaderboardEntry[] {
  return unwrapCollection<unknown>(payload).map(normalizeLeaderboardEntry);
}

export function setAuthToken(token: string | null) {
  bearerToken = token;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
    ...init,
  });

  const text = await response.text();
  const parsed = parseJsonSafe(text);

  if (!response.ok) {
    const message =
      (parsed as ApiErrorPayload | null)?.message ??
      (parsed as ApiErrorPayload | null)?.error ??
      (parsed as ApiErrorPayload | null)?.detail ??
      (parsed as ApiErrorPayload | null)?.['hydra:description'] ??
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  return unwrapData<T>(parsed);
}

export const lootopiaApi = {
  register: (payload: RegisterPayload) =>
    request<PlayerProfile>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getUser: (userId: number) => request<PlayerProfile>(`/users/${userId}`),

  getAchievements: () => request<unknown>('/achievements').then((payload) => unwrapCollection<Achievement>(payload)),

  getHunts: () => request<unknown>('/hunts').then((payload) => unwrapCollection<Hunt>(payload)),

  getHunt: (huntId: number) => request<Hunt>(`/hunts/${huntId}`),

  getAchievementsForUser: (userId: number) =>
    request<unknown>(`/users/${userId}/achievements`).then((payload) => unwrapCollection<Achievement>(payload)),

  getLeaderboardGlobal: () => request<unknown>('/leaderboard/global').then((payload) => normalizeLeaderboard(payload)),

  getLeaderboardWeekly: () => request<unknown>('/leaderboard/weekly').then((payload) => normalizeLeaderboard(payload)),

  getLeaderboardMonthly: () => request<unknown>('/leaderboard/monthly').then((payload) => normalizeLeaderboard(payload)),

  getLeaderboardByHunts: () => request<unknown>('/leaderboard/by-hunts').then((payload) => normalizeLeaderboard(payload)),

  getLeaderboardByStreak: () => request<unknown>('/leaderboard/by-streak').then((payload) => normalizeLeaderboard(payload)),

  getLeaderboardWeeklyStars: () =>
    request<unknown>('/leaderboard/weekly-stars').then((payload) => normalizeLeaderboard(payload)),

  getLeaderboardStats: () => request<unknown>('/leaderboard/stats').then((payload) => normalizeLeaderboardStats(payload)),

  getHuntReviews: (huntId: number) =>
    request<unknown>(`/hunts/${huntId}/reviews`).then((payload) => unwrapCollection<unknown>(payload).map(normalizeReview)),

  postHuntReview: (huntId: number, payload: { rating: number; comment: string }) =>
    request<HuntReview>(`/hunts/${huntId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getHuntReviewStats: (huntId: number) =>
    request<unknown>(`/hunts/${huntId}/reviews/stats`).then((payload) => normalizeReviewStats(payload)),

  getMyRank: () => request<UserRank>('/leaderboard/my-rank'),
};

export function createSessionFromLogin(login: LoginResponse): AuthSession {
  return {
    userId: login.id,
    email: login.email,
    username: login.username,
    authToken: login.token ?? login.access_token ?? login.jwt ?? null,
  };
}
