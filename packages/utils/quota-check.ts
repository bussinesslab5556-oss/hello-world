
import { PlanTier, ActionType, QuotaCheckResult, UserUsage, Subscription } from '../types/index.ts';
import { SUBSCRIPTION_LIMITS } from './constants.ts';

/**
 * Validates if a user has sufficient quota for a requested action.
 */
export const checkQuota = (
  usage: UserUsage,
  subscription: Subscription,
  action: ActionType,
  amount: number = 1
): QuotaCheckResult => {
  const tier = subscription.tier as PlanTier;
  const limits = SUBSCRIPTION_LIMITS[tier];

  switch (action) {
    case 'translation': {
      const current = usage.translation_chars_count;
      const limit = limits.translation_limit;
      const allowed = (current + amount) <= limit;
      return { allowed, remaining: Math.max(0, limit - current), limit };
    }
    
    case 'call': {
      const current = usage.call_minutes_count;
      const limit = limits.call_minutes_limit;
      const allowed = (current + amount) <= limit;
      return { allowed, remaining: Math.max(0, limit - current), limit };
    }

    case 'upload': {
      const limit = limits.storage_limit_mb;
      return { allowed: true, remaining: limit, limit };
    }

    default:
      return { allowed: false, remaining: 0, limit: 0 };
  }
};
