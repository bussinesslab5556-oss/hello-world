
// File Path: /packages/types/quota.ts

import { PlanTier } from './index.ts';

/**
 * Supported types of actions that consume user quota.
 */
export type QuotaAction = 'TRANSLATION' | 'CALL' | 'STORAGE';

/**
 * Current usage metrics for a specific user.
 */
export interface UserUsage {
  user_id: string;
  translation_chars_count: number;
  call_minutes_count: number;
  storage_used: number; // Aligned with DB storage_used column (Bytes)
  last_reset_date: string;
}

/**
 * The status object returned by the Quota Guard engine.
 */
export interface QuotaStatus {
  allowed: boolean;
  remaining: number;
  usagePercent: number;
  isWarningZone: boolean;
}
