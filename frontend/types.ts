export enum UserRole {
  PARTICIPANT = 'participant',
  ADMIN = 'admin',
  HR = 'hr'
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  skills_profile?: {
    topic: string;
    score: number;
    max_score: number;
  }[];
}

export interface Event {
  id: number;
  title: string;
  date: string;
  event_code: string;
  is_active: boolean;
  description?: string;
  participants_count?: number;
}

export interface Quiz {
  id: number;
  event_id: number;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface LeaderboardEntry {
  username: string;
  score: number;
}

export interface EventStats {
  active_participants: number;
  total_participants: number;
  average_score: number;
  leaderboard: LeaderboardEntry[];
  skill_distribution: { name: string; value: number }[];
  activity_log: { time: string; message: string }[];
}