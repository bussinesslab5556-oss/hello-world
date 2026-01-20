
export * from './profile.ts';

export enum PlanTier {
  FREE = 'Free',
  PREMIUM = 'Premium',
  PRO = 'Pro',
  BUSINESS = 'Business',
}

export type ActionType = 'translation' | 'call' | 'upload';
export type UsageStatus = 'normal' | 'warning' | 'exhausted';

export interface UsageMetric {
  used: number;
  limit: number;
  percentage: number;
  status: UsageStatus;
  unit: string;
}

export interface UsageSummary {
  translation: UsageMetric;
  calls: UsageMetric;
  storage: UsageMetric;
  overallStatus: UsageStatus;
  tier: PlanTier;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: PlanTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  current_period_end: string;
}

export interface UserUsage {
  id: string;
  user_id: string;
  translation_chars_count: number;
  call_minutes_count: number;
  storage_used: number; // Bytes
  last_reset_date: string;
}

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  originalText: string;
  translatedText?: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  status: 'sent' | 'delivered' | 'read';
}
