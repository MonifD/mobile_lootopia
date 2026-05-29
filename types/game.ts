export type Hunt = {
  id: number;
  title: string;
  description: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PlayerProfile = {
  id: number;
  email: string;
  username: string;
  city: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  completedHunts: number;
  completedSteps: number;
  loginStreak: number;
  level: string;
  lastActivityAt: string | null;
};

export type UserRank = {
  rank: number;
  total: number;
  percentile: number;
};

export type LeaderboardEntry = {
  id: number;
  username: string;
  city: string | null;
  level: string;
  totalPoints: number;
  completedHunts: number;
  loginStreak: number;
  rank?: number;
};

export type LeaderboardStats = {
  totalPlayers: number;
  totalPoints: number;
  totalCompletedHunts: number;
  averagePoints: number;
};

export type AchievementType =
  | 'hunts_completed'
  | 'steps_completed'
  | 'login_streak'
  | 'first_hunt'
  | 'top_leaderboard'
  | 'social';

export type Achievement = {
  id: number;
  name: string;
  description: string;
  iconUrl: string | null;
  pointsReward: number;
  type: AchievementType;
  threshold: number;
  createdAt: string;
};

export type HuntReview = {
  id: number;
  rating: number;
  comment: string;
  status?: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
  } | null;
};

export type HuntReviewStats = {
  averageRating: number;
  totalReviews: number;
  distribution: Record<string, number>;
};

export type Step = {
  id: number;
  orderNumber: number;
  clue: string;
  latitude: number;
  longitude: number;
  arMarkerUrl: string | null;
  /** IRI de la chasse parente, ex: "/api/hunts/1" */
  hunt?: string;
};

export type Participation = {
  id: number;
  step: string;
  user: string;
  pointsEarned: number;
  completedAt: string | null;
};

export type HuntHistoryHunt = {
  id: number;
  title: string;
  description: string | null;
  isActive: boolean;
  city: { id: number; name: string } | null;
};

export type HuntHistoryEntry = {
  hunt: HuntHistoryHunt;
  status: 'completed' | 'in_progress';
  stepsCompleted: number;
  totalSteps: number;
  progress: number;
  totalPoints: number;
  startedAt: string;
  lastActivityAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
};
