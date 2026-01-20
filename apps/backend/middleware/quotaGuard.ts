// File Path: /apps/backend/middleware/quotaGuard.ts

import { checkUserQuota } from '../../../packages/utils/quota-engine';
import { QuotaAction } from '../../../packages/types/quota';

/**
 * Quota Guard Middleware
 * 
 * Intercepts requests to resource-heavy endpoints (Translation, Calls, Storage).
 * 1. Authenticates the request and extracts user context.
 * 2. Runs the Quota Engine check.
 * 3. Rejects with 402 (Payment Required) if limits are reached.
 */
export const quotaGuard = (action: QuotaAction) => {
  return async (req: any, res: any, next: any) => {
    try {
      // 1. Context Extraction (Assume auth middleware has populated req.user)
      const userId = req.user?.id;
      const supabase = req.supabase; // Shared supabase client from request context
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User context missing' });
      }

      // 2. Determine consumption amount
      // For TRANSLATION: length of text
      // For CALL: 1 (initial check)
      // For STORAGE: size of file
      let amount = 1;
      if (action === 'TRANSLATION' && req.body.text) {
        amount = req.body.text.length;
      } else if (action === 'STORAGE' && req.file) {
        amount = req.file.size;
      }

      // 3. High-Performance Quota Check
      const status = await checkUserQuota(supabase, userId, action, amount);

      // 4. Decision Logic
      if (!status.allowed) {
        console.warn(`[Quota Guard] Blocked ${action} for User ${userId}. Remaining: ${status.remaining}`);
        
        return res.status(402).json({
          error: 'Quota Exceeded',
          message: `You have reached your ${action.toLowerCase()} limit. Please upgrade your plan.`,
          status: {
            remaining: status.remaining,
            usagePercent: status.usagePercent,
            limitReached: true
          }
        });
      }

      // 5. Success - Attach status for potential downstream usage (e.g. warning headers)
      req.quotaStatus = status;
      
      // If in warning zone (>= 80%), we can append a custom header to alert the client
      if (status.isWarningZone) {
        res.setHeader('X-Quota-Warning', `Usage at ${status.usagePercent}%`);
      }

      console.log(`[Quota Guard] Approved ${action} for User ${userId}. ${status.usagePercent}% used.`);
      return next();

    } catch (err: any) {
      console.error('[Quota Guard] Critical Failure:', err.message);
      // Fail-safe: In case of engine error, we might choose to block or allow. 
      // For a billing-sensitive app, we block and return 500.
      return res.status(500).json({ error: 'Internal Quota Verification Failure' });
    }
  };
};
