export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  city?: string;
};

export type LoginResponse = {
  id?: number | string;
  userId?: number | string;
  user_id?: number | string;
  email?: string;
  username?: string;
  user?: {
    id?: number | string;
    userId?: number | string;
    user_id?: number | string;
    email?: string;
    username?: string;
    userName?: string;
  };
  totalPoints?: number;
  loginStreak?: number;
  lastActivityAt?: string | null;
  level?: string;
  avatarUrl?: string | null;
  token?: string;
  access_token?: string;
  jwt?: string;
};

export type AuthSession = {
  userId: number | null;
  email: string;
  username: string;
  authToken: string | null;
};

