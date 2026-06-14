import type { AuthSession, LoginPayload, LoginResponse, RegisterPayload } from '@/types/auth';
import type {
    Achievement,
    Hunt,
    HuntHistoryEntry,
    HuntReview,
    HuntReviewStats,
    LeaderboardEntry,
    LeaderboardStats,
    Participation,
    PlayerProfile,
    Step,
    UserRank,
} from '@/types/game';
import { Platform } from 'react-native';

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

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    if ('hydra:member' in obj) {
      return (obj['hydra:member'] as T[]) ?? [];
    }

    if ('member' in obj) {
      return (obj['member'] as T[]) ?? [];
    }
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

function parseResourceId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const direct = Number(value);
    if (Number.isFinite(direct)) {
      return direct;
    }

    const iriMatch = value.match(/\/(\d+)$/);
    if (iriMatch) {
      const iriId = Number(iriMatch[1]);
      if (Number.isFinite(iriId)) {
        return iriId;
      }
    }
  }

  return null;
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

function parseStepIriToId(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null;
  }

  const iriMatch = value.match(/\/steps\/(\d+)$/);
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
  const user = source.user as PrimitiveRecord | undefined;

  return {
    id: toNumber(source.id, index + 1),

    username: toString(
      source.username ||
      source.userName ||
      source.name ||
      user?.username,
      'Joueur'
    ),

    city: toNullableString(source.city ?? user?.city),

    level: toString(source.level, 'BRONZE'),

    totalPoints: toNumber(
      source.totalPoints ??
      source.points ??
      source.score
    ),

    completedHunts: toNumber(
      source.completedHunts ??
      source.huntsCompleted
    ),

    loginStreak: toNumber(
      source.loginStreak ??
      source.streak
    ),

    rank: source.rank != null
      ? toNumber(source.rank)
      : index + 1,
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
}

function isStepFromHunt(step: Step, huntId: number): boolean {
  if (!step.hunt) return false;

  return step.hunt === `/api/hunts/${huntId}` || step.hunt.endsWith(`/${huntId}`);
}

function normalizeHunt(raw: unknown): Hunt {
  const source = (raw ?? {}) as PrimitiveRecord;

  // Le sérialiseur Symfony interprète isActive() comme getter de "active" (sans préfixe "is")
  // mais ne l'associe pas à la propriété $isActive → le champ disparaît de la réponse.
  // Fallback : si tous les variants sont absents, la valeur par défaut de l'entité est true.
  const isActiveRaw =
    source.isActive ??
    source.is_active ??
    source.active;
  const isActive =
    isActiveRaw === undefined
      ? true  // champ absent = valeur par défaut de l'entité PHP (true)
      : isActiveRaw === true || isActiveRaw === 1 || isActiveRaw === 'true' || isActiveRaw === '1';

  const id =
    parseResourceId(source.id) ??
    parseResourceId(source['@id']) ??
    0;

  return {
    id,
    title: toString(source.title),
    description: toNullableString(source.description),
    city: typeof source.city === 'object' && source.city !== null
      ? toNullableString((source.city as PrimitiveRecord)['name'])
      : toNullableString(source.city),
    isActive,
    createdAt: toString(source.createdAt ?? source.created_at),
    updatedAt: toString(source.updatedAt ?? source.updated_at),
  };
}

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

/** Upload multipart/form-data — ne force pas Content-Type pour que fetch pose la boundary */
export async function requestMultipart<T>(path: string, formData: FormData, method = 'POST'): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers: {
        Accept: 'application/json',
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      },
      body: formData,
    });
  } catch {
    const apiUrl = API_BASE_URL.replace(/\/$/, '');
    throw new Error(`Impossible de joindre l'API (${apiUrl}).`);
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
  getCities: () =>
    request<unknown>('/cities').then((payload) => {
      const items = unwrapCollection<unknown>(payload);
      return items.map((raw) => {
        const source = (raw ?? {}) as PrimitiveRecord;
        return {
          id: toNumber(source.id),
          name: toString(source.name),
          iri: `/api/cities/${toNumber(source.id)}`,
        };
      });
    }),

  searchCities: (q: string) =>
    request<unknown>(`/cities/search?q=${encodeURIComponent(q)}`).then((payload) => {
      const items = Array.isArray(payload) ? payload : unwrapCollection<unknown>(payload);
      return (items as PrimitiveRecord[]).map((source) => ({
        id: toNumber(source['id']),
        name: toString(source['name']),
        zipCode: toString(source['zipCode']),
        iri: `/api/cities/${toNumber(source['id'])}`,
      }));
    }),

  register: (payload: RegisterPayload) =>
    request<PlayerProfile>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) => loginWithFallback(payload),

  getUser: (userId: number) => request<PlayerProfile>(`/users/${userId}`),

  updateProfile: (userId: number, data: { username?: string; city?: string }) =>
    request<PlayerProfile>(`/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: JSON.stringify(data),
    }),

  uploadAvatar: async (userId: number, imageUri: string, mimeType: string, fileName: string) => {
    const formData = new FormData();

    // Sur le web, il faut convertir l'URI en Blob/File
    if (Platform.OS === 'web') {
      const resp = await fetch(imageUri);
      const blob = await resp.blob();
      // File est disponible dans les environnements web
      const file = new File([blob], fileName, { type: mimeType });
      formData.append('avatar', file as unknown as Blob);
    } else {
      // React Native / Expo mobile: forme attendue par fetch RN
      formData.append('avatar', { uri: imageUri, type: mimeType, name: fileName } as unknown as Blob);
    }

    return requestMultipart<{ avatarUrl: string }>(`/users/${userId}/avatar`, formData);
  },

  deleteAvatar: (userId: number) =>
    request<void>(`/users/${userId}/avatar`, { method: 'DELETE' }),

  getCurrentUser: () => {
    const identity = extractIdentityFromToken(bearerToken);
    if (!identity.id) {
      throw new Error("Profil indisponible sans userId. Reconnecte-toi pour regenerer une session complete.");
    }

    return request<PlayerProfile>(`/users/${identity.id}`);
  },

  getAchievements: () => request<unknown>('/achievements').then((payload) => unwrapCollection<Achievement>(payload)),

  // getHunts: () =>
  //   request<unknown>('/hunts').then((payload) =>
  //     unwrapCollection<unknown>(payload).map(normalizeHunt)
  //   ),

  getHunts: () =>
  request<unknown>('/hunts').then((payload) =>
    unwrapCollection<unknown>(payload).map(normalizeHunt)
  ),

  // getHunt: (huntId: number) =>
  //   request<unknown>(`/hunts/${huntId}`).then(normalizeHunt),

  getHunt: (huntId: number) =>
  request<unknown>(`/hunts/${huntId}`).then((payload) => {
    console.log('HUNT API =', payload);
    return normalizeHunt(payload);
  }),

  getHuntSteps: async (huntId: number): Promise<Step[]> => {
    try {
      const payload = await request<unknown>(
        `/steps?hunt=/api/hunts/${huntId}&itemsPerPage=200`
      );

      const items = unwrapCollection<unknown>(payload)
        .map((s, i) => normalizeStep(s, i))
        .filter((s) => isStepFromHunt(s, huntId))
        .sort((a, b) => a.orderNumber - b.orderNumber);

      if (items.length > 0) {
        return items;
      }
    } catch {
      // filtre non supporté → fallback
    }

    const fallbackPayload = await request<unknown>('/steps?itemsPerPage=200');

    return unwrapCollection<unknown>(fallbackPayload)
      .map((s, i) => normalizeStep(s, i))
      .filter((s) => isStepFromHunt(s, huntId))
      .sort((a, b) => a.orderNumber - b.orderNumber);
  },

  getAchievementsForUser: (userId: number) =>
    request<unknown>(`/users/${userId}/achievements`).then((payload) => unwrapCollection<Achievement>(payload)),

  // getAchievementsForCurrentUser: () => requestCollectionWithFallback<Achievement>(['/achievements']),
  getAchievementsForCurrentUser: () => {
  const identity = extractIdentityFromToken(bearerToken);

  if (!identity.id) {
    throw new Error("Impossible de charger tes achievements sans userId.");
  }

  return request<unknown>(`/users/${identity.id}/achievements`)
    .then((payload) => unwrapCollection<Achievement>(payload));
},

  getLeaderboardGlobal: () => request<unknown>('/leaderboard/global').then((payload) => normalizeLeaderboard(payload)),

  getLeaderboardWeekly: () => request<unknown>('/leaderboard/weekly').then((payload) => normalizeLeaderboard(payload)),

  getLeaderboardMonthly: () => request<unknown>('/leaderboard/monthly').then((payload) => normalizeLeaderboard(payload)),

  getLeaderboardByHunts: () => request<unknown>('/leaderboard/by-hunts').then((payload) => normalizeLeaderboard(payload)),

  getLeaderboardByStreak: () => request<unknown>('/leaderboard/by-streak').then((payload) => normalizeLeaderboard(payload)),

  getLeaderboardWeeklyStars: () =>
    request<unknown>('/leaderboard/weekly-stars').then((payload) => normalizeLeaderboard(payload)),

  getLeaderboardLocal: (city: string) =>
    request<unknown>(`/leaderboard/local/${encodeURIComponent(city)}`).then((payload) => normalizeLeaderboard(payload)),

  getLeaderboardStats: () => request<unknown>('/leaderboard/stats').then((payload) => normalizeLeaderboardStats(payload)),

  getHuntReviews: (huntId: number) =>
    request<unknown>(`/hunts/${huntId}/reviews`).then((payload) => unwrapCollection<unknown>(payload).map(normalizeReview)),

  postHuntReview: (huntId: number, payload: { userId: number; rating: number; comment: string , huntCompletedAt?: string;}) =>
    request<HuntReview>(`/hunts/${huntId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    
  completeStep: async (userId: number, stepId: number, pointsEarned = 0) => {
    const participations = await lootopiaApi.getMyParticipations(userId);
    const existing = participations.find(
      (participation) => parseStepIriToId(participation.step) === stepId
    );

    if (existing) {
      return existing;
    }

    return request<Participation>('/participations', {
      method: 'POST',
      body: JSON.stringify({
        user: `/api/users/${userId}`,
        step: `/api/steps/${stepId}`,
        pointsEarned,
      }),
    });
  },

  getHuntReviewStats: (huntId: number) =>
    request<unknown>(`/hunts/${huntId}/reviews/stats`).then((payload) => normalizeReviewStats(payload)),

  getHuntHistory: (userId: number, limit = 100) =>
    request<unknown>(`/users/${userId}/hunt-history?limit=${limit}`).then((payload) => {
      const raw = (payload ?? {}) as Record<string, unknown>;
      const items = Array.isArray(raw['data']) ? (raw['data'] as unknown[]) : unwrapCollection<unknown>(payload);
      return items.map((entry) => {
        const e = (entry ?? {}) as Record<string, unknown>;
        const hunt = (e['hunt'] ?? {}) as Record<string, unknown>;
        const city = hunt['city'] ? (hunt['city'] as Record<string, unknown>) : null;
        return {
          hunt: {
            id: toNumber(hunt['id']),
            title: toString(hunt['title']),
            description: toNullableString(hunt['description']),
            isActive: hunt['isActive'] === true,
            city: city ? { id: toNumber(city['id']), name: toString(city['name']) } : null,
          },
          status: toString(e['status']) as 'completed' | 'in_progress',
          stepsCompleted: toNumber(e['stepsCompleted']),
          totalSteps: toNumber(e['totalSteps']),
          progress: typeof e['progress'] === 'number' ? e['progress'] : 0,
          totalPoints: toNumber(e['totalPoints']),
          startedAt: toString(e['startedAt']),
          lastActivityAt: toString(e['lastActivityAt']),
          completedAt: toNullableString(e['completedAt']),
          durationSeconds: toNullableNumber(e['durationSeconds']),
        } satisfies HuntHistoryEntry;
      });
    }),

  getAllSteps: (): Promise<Step[]> =>
    request<unknown>('/steps?itemsPerPage=500').then((payload) =>
      unwrapCollection<unknown>(payload).map((s, i) => normalizeStep(s, i))
    ),

  getMyRank: () => request<UserRank>('/leaderboard/my-rank'),

  /**
   * Récupère le rang d'un utilisateur spécifique.
   * Endpoint: GET /users/{id}/rank → { rank, total, percentile }
   */
  getUserRank: (userId: number) => request<UserRank>(`/users/${userId}/rank`),

  /**
   * Récupère toutes les participations (étapes validées) d'un utilisateur.
   * Endpoint: GET /participations?user=/api/users/{id}
   * Chaque participation contient l'IRI de l'étape et la date de complétion.
   */
 getMyParticipations: async (userId: number): Promise<Participation[]> => {
  const keepOnlyCurrentUser = (
    participations: Participation[]
  ) =>
    participations.filter((participation) => {
      const user = participation.user;

      if (typeof user !== 'string') {
        return false;
      }

      return (
        user === `/api/users/${userId}` ||
        user.endsWith(`/${userId}`)
      );
    });

  try {
    const payload = await request<unknown>(
      `/participations?user=/api/users/${userId}&itemsPerPage=200`
    );

    const items = unwrapCollection<Participation>(payload);

    return keepOnlyCurrentUser(items);
  } catch {
    const fallbackPayload = await request<unknown>(
      '/participations?itemsPerPage=200'
    );

    return keepOnlyCurrentUser(
      unwrapCollection<Participation>(fallbackPayload)
    );
  }
},
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