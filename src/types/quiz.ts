import { Question, QuestionAnalysis } from '../utils/quizLogic';

export type { Question, QuestionAnalysis };

export type QuizLanguage = 'bn' | 'en' | 'es' | 'hi' | 'fr' | 'ar' | 'other';

export type UserRole = 'teacher' | 'student';

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  language: QuizLanguage | string;
  category: string;
  creatorId: string;
  creatorName: string;
  shareCode: string;
  timeLimitMinutes: number; // 0 = untimed
  isPublic: boolean;
  questionsCount: number;
  questions: Question[];
  playsCount: number;
  averageScore?: number;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  hasMath?: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  wrongAnswersCount: number;
  completedAt: string;
  questionsAnalysis?: QuestionAnalysis[];
}

export interface LeaderboardEntry {
  userId: string;
  quizId: string;
  userName: string;
  userPhotoURL?: string;
  score: number;
  percentage: number;
  timeSpentSeconds: number;
  completedAt: string;
  rank?: number;
}

export interface GlobalUserRanking {
  userId: string;
  displayName: string;
  photoURL?: string;
  totalQuizzesTaken: number;
  totalScore: number;
  averagePercentage: number;
  rank?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  quizzesCreatedCount?: number;
  quizzesTakenCount?: number;
  totalScore?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AiQuizGenerationOptions {
  topic: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  includeMath: boolean;
  customPrompt?: string;
}
