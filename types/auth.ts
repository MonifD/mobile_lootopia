export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
};

export type LoginResponse = {
  id: number;
  email: string;
  username: string;
  totalPoints: number;
  loginStreak: number;
  lastActivityAt: string | null;
  level: string;
  avatarUrl: string | null;
  token?: string;
  access_token?: string;
  jwt?: string;
};

export type AuthSession = {
  userId: number;
  email: string;
  username: string;
  authToken: string | null;
};

