export type RiskLevel = 'low' | 'medium' | 'high';

export interface WellnessSnapshot {
  id: string;
  recordedAt: string;
  moodScore: number;
  sleepHours: number;
  activityLevel: number;
  stressIndex: number;
  riskLevel: RiskLevel;
}

export interface WellnessSummary {
  wellnessScore: number;
  moodScore: number;
  sleepHours: number;
  activityLevel: number;
  stressIndex: number;
  riskLevel: RiskLevel;
  moodTrend: number;
  sleepTrend: number;
  activityTrend: number;
  stressTrend: number;
  lastUpdated: string;
}

export type RecommendationCategory = 'sleep' | 'mindfulness' | 'activity' | 'general';

export interface Recommendation {
  id: string;
  title: string;
  body: string;
  category: RecommendationCategory;
  priority: number;
  generatedAt: string;
  dismissed: boolean;
  completed: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  passwordHash: string;
  privacyConsentAt: string | null;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  dataSharingEnabled: boolean;
  theme: 'dark' | 'light';
}

export interface Exercise {
  id: string;
  name: string;
  duration: string;
  steps: string[];
  explanation: string;
  category: string;
  custom: boolean;
  createdAt: string;
}
