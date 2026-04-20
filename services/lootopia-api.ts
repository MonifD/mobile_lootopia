import type { AuthSession, LoginPayload, LoginResponse, RegisterPayload } from '@/types/auth';
import type {
    Achievement,
    Hunt,
    HuntReview,
    HuntReviewStats,
    LeaderboardEntry,
    LeaderboardStats,
    PlayerProfile,
    Step,
    UserRank,
} from '@/types/game';

const FALLBACK_API_URL = 'http://10.0.2.2:8080/api';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? FALLBACK_API_URL;
const LOGIN_PATH = process.env.EXPO_PUBLIC_LOGIN_PATH ?? '/login';

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
type LoginIdentity = {
  id: number | null;
  email: string;
  username: string;
};

class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiRequestError';
  }
}

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

function toNullableNumber(value: unknown): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function decodeBase64Url(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);

    if (typeof globalThis.atob === 'function') {
      return globalThis.atob(padded);
    }

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(padded, 'base64').toString('utf-8');
    }

    return null;
  } catch {
    return null;
  }
}

function parseJwtPayload(token: string | null | undefined): PrimitiveRecord | null {
  if (!token) {
    return null;
  }

  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  const decoded = decodeBase64Url(segments[1]);
  if (!decoded) {
    return null;
  }

  try {
    return JSON.parse(decoded) as PrimitiveRecord;
  } catch {
    return null;
  }
}

function parseUserIriToId(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null;
  }

  const iriMatch = value.match(/\/users\/(\d+)$/);
  if (!iriMatch) {
    return null;
  }

  return toNullableNumber(iriMatch[1]);
}

function extractIdentityFromToken(token: string | null | undefined): Partial<LoginIdentity> {
  const payload = parseJwtPayload(token);
  if (!payload) {
    return {};
  }

  const numericSub = toNullableNumber(payload.sub);
  const iriSub = parseUserIriToId(payload.sub);
  const id =
    toNullableNumber(payload.id) ??
    toNullableNumber(payload.userId) ??
    toNullableNumber(payload.user_id) ??
    numericSub ??
    iriSub ??
    null;

  const email =
    toString(payload.email, '') ||
    toString(payload.preferred_username, '') ||
    toString(payload.username, '');

  const username =
    toString(payload.username, '') ||
    toString(payload.preferred_username, '');

  return {
    id,
    email,
    username,
  };
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

function normalizeStep(raw: unknown, index: number): Step {
  const source = (raw ?? {}) as PrimitiveRecord;
  const hunt = source.hunt;

  return {
    id: toNumber(source.id, index + 1),
    orderNumber: toNumber(source.orderNumber ?? source.order_number, index + 1),
    clue: toString(source.clue, ''),
    latitude: parseFloat(toString(source.latitude, '0')),
    longitude: parseFloat(toString(source.longitude, '0')),
    arMarkerUrl: toNullableString(source.arMarkerUrl ?? source.ar_marker_url),
    hunt: typeof hunt === 'string' ? hunt : undefined,
  };
function extractLoginIdentity(payload: LoginResponse, fallback?: Partial<LoginIdentity>): LoginIdentity {
  const root = payload as PrimitiveRecord;
  const user = (root.user as PrimitiveRecord | undefined) ?? {};
  const tokenIdentity = extractIdentityFromToken(payload.token ?? payload.access_token ?? payload.jwt ?? null);

  const id =
    toNullableNumber(root.id) ??
    toNullableNumber(root.userId) ??
    toNullableNumber(root.user_id) ??
    toNullableNumber(user.id) ??
    toNullableNumber(user.userId) ??
    toNullableNumber(user.user_id) ??
    tokenIdentity.id ??
    fallback?.id ??
    null;

  const email =
    toString(root.email, '') ||
    toString(user.email, '') ||
    toString(tokenIdentity.email, '') ||
    toString(fallback?.email, '');

  const username =
    toString(root.username, '') ||
    toString(user.username, '') ||
    toString(user.userName, '') ||
    toString(tokenIdentity.username, '') ||
    toString(fallback?.username, '');

  return { id, email, username };
}

async function requestWithFallback<T>(paths: string[]): Promise<T> {
  let lastError: unknown = null;

  for (const path of paths) {
    try {
      return await request<T>(path);
    } catch (error) {
      lastError = error;

      if (error instanceof ApiRequestError && error.status === 404) {
        continue;
      }

      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Resource not found');
}

async function requestCollectionWithFallback<T>(paths: string[]): Promise<T[]> {
  const payload = await requestWithFallback<unknown>(paths);
  return unwrapCollection<T>(payload);
}

export function setAuthToken(token: string | null) {
  bearerToken = token;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
        ...(init?.headers ?? {}),
      },
      ...init,
    });
  } catch {
    const apiUrl = API_BASE_URL.replace(/\/$/, '');
    const localhostHint = apiUrl.includes('localhost')
      ? ' Sur un telephone reel, remplace localhost par l\'IP locale de ton Mac (ex: http://192.168.x.x:8080/api).'
      : '';
    throw new Error(`Impossible de joindre l'API (${apiUrl}).${localhostHint}`);
  }

  const text = await response.text();
  const parsed = parseJsonSafe(text);

  if (!response.ok) {
    const message =
      (parsed as ApiErrorPayload | null)?.message ??
      (parsed as ApiErrorPayload | null)?.error ??
      (parsed as ApiErrorPayload | null)?.detail ??
      (parsed as ApiErrorPayload | null)?.['hydra:description'] ??
      `HTTP ${response.status}`;
    throw new ApiRequestError(message, response.status);
  }

  return unwrapData<T>(parsed);
}

async function loginWithFallback(payload: LoginPayload): Promise<LoginResponse> {
  const fallbackPath = '/login';
  const paths = Array.from(new Set([LOGIN_PATH, fallbackPath]));
  const loginPayload = { email: payload.email, password: payload.password };

  let lastError: unknown = null;

  for (const path of paths) {
    try {
      return await request<LoginResponse>(path, {
        method: 'POST',
        body: JSON.stringify(loginPayload),
      });
    } catch (error) {
      lastError = error;

      if (!(error instanceof ApiRequestError)) {
        throw error;
      }

      if (error.status === 404) {
        continue;
      }

      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Login failed');
}

export const lootopiaApi = {
  register: (payload: RegisterPayload) =>
    request<PlayerProfile>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) => loginWithFallback(payload),

  getUser: (userId: number) => request<PlayerProfile>(`/users/${userId}`),

  getCurrentUser: () => {
    const identity = extractIdentityFromToken(bearerToken);
    if (!identity.id) {
      throw new Error("Profil indisponible sans userId. Reconnecte-toi pour regenerer une session complete.");
    }

    return request<PlayerProfile>(`/users/${identity.id}`);
  },

  getAchievements: () => request<unknown>('/achievements').then((payload) => unwrapCollection<Achievement>(payload)),

  getHunts: () => request<unknown>('/hunts').then((payload) => unwrapCollection<Hunt>(payload)),

  getHunt: (huntId: number) => request<Hunt>(`/hunts/${huntId}`),

  /**
   * Récupère les étapes d'une chasse.
   * Essaie d'abord le filtre IRI (nécessite SearchFilter côté backend).
   * Si aucun résultat, récupère toutes les étapes et filtre côté client.
   */
  getHuntSteps: async (huntId: number): Promise<Step[]> => {
    // Tentative avec le filtre IRI API Platform
    try {
      const payload = await request<unknown>(`/steps?hunt=/api/hunts/${huntId}&itemsPerPage=200`);
      const items = unwrapCollection<unknown>(payload);
      if (items.length > 0) {
        return items.map((s, i) => normalizeStep(s, i));
      }
    } catch {
      // Le filtre n'est pas supporté, on passe au fallback
    }

    // Fallback : récupère toutes les étapes et filtre côté client
    const fallbackPayload = await request<unknown>('/steps?itemsPerPage=200');
    return unwrapCollection<unknown>(fallbackPayload)
      .map((s, i) => normalizeStep(s, i))
      .filter((s) => {
        if (!s.hunt) return false;
        // Vérifie que l'IRI correspond à la chasse demandée
        return s.hunt === `/api/hunts/${huntId}` || s.hunt.endsWith(`/${huntId}`);
      });
  },

  getAchievementsForUser: (userId: number) =>
    request<unknown>(`/users/${userId}/achievements`).then((payload) => unwrapCollection<Achievement>(payload)),

  getAchievementsForCurrentUser: () => requestCollectionWithFallback<Achievement>(['/achievements']),

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

export function createSessionFromLogin(
  login: LoginResponse,
  fallbackIdentity?: Partial<{ id: number | null; email: string; username: string }>
): AuthSession {
  const identity = extractLoginIdentity(login, fallbackIdentity);

  return {
    userId: identity.id,
    email: identity.email,
    username: identity.username,
    authToken: login.token ?? login.access_token ?? login.jwt ?? null,
  };
}
