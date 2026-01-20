
import { QuotaAction, QuotaStatus } from '../types/quota.ts';
import { PlanTier, SUBSCRIPTION_LIMITS } from './constants.ts';

/**
 * Integrated Quota Engine
 */
export async function checkUserQuota(
  supabase: any,
  userId: string,
  actionType: QuotaAction,
  amount: number = 0
): Promise<QuotaStatus> {
  const [usageRes, subRes] = await Promise.all([
    supabase.from('user_usage').select('*').eq('user_id', userId).single(),
    supabase.from('subscriptions').select('tier').eq('user_id', userId).single()
  ]);

  if (usageRes.error || subRes.error || !usageRes.data || !subRes.data) {
    throw new Error('QUOTA_SYNC_ERROR: Blocking request for safety.');
  }

  const usage = usageRes.data;
  const tier = subRes.data.tier as PlanTier;
  const limits = SUBSCRIPTION_LIMITS[tier];

  let limit = 0;
  let current = 0;

  switch (actionType) {
    case 'TRANSLATION':
      limit = limits.translation_limit;
      current = usage.translation_chars_count;
      break;
    case 'CALL':
      limit = limits.call_minutes_limit;
      current = usage.call_minutes_count;
      break;
    case 'STORAGE':
      limit = limits.storage_limit_mb * 1024 * 1024;
      current = Number(usage.storage_used || 0);
      break;
    default:
      throw new Error(`UNSUPPORTED_ACTION: ${actionType}`);
  }

  const totalAfterAction = current + amount;
  const usagePercent = (totalAfterAction / limit) * 100;
  const allowed = totalAfterAction <= limit;
  const remaining = Math.max(0, limit - totalAfterAction);
  const isWarningZone = usagePercent >= 80;

  return {
    allowed,
    remaining,
    usagePercent: parseFloat(usagePercent.toFixed(2)),
    isWarningZone
  };
}
