
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UsageSummary, UsageMetric, UsageStatus, PlanTier, UserUsage } from '../types/index.ts';
import { SUBSCRIPTION_LIMITS } from '../utils/constants.ts';

export class UsageService {
  private static instance: UsageService;
  private supabase: SupabaseClient | null = null;

  private constructor() {
    const env = typeof process !== 'undefined' ? process.env : {};
    const supabaseUrl = (env.SUPABASE_URL || '').trim();
    const supabaseAnonKey = (env.SUPABASE_ANON_KEY || '').trim();

    if (supabaseUrl && supabaseAnonKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
      } catch (err) {
        console.warn('UsageService: Initialization error:', err);
      }
    }
  }

  public static getInstance(): UsageService {
    if (!UsageService.instance) {
      UsageService.instance = new UsageService();
    }
    return UsageService.instance;
  }

  private getClient(): SupabaseClient | null {
    return this.supabase;
  }

  private calculateStatus(used: number, limit: number): UsageStatus {
    const percent = (used / limit) * 100;
    if (percent >= 100) return 'exhausted';
    if (percent >= 80) return 'warning';
    return 'normal';
  }

  async getUserUsageSummary(userId: string): Promise<UsageSummary | null> {
    const client = this.getClient();
    
    if (!client) {
      // Return mock data for local/preview consistency if Supabase is missing
      return {
        translation: { used: 0, limit: 2000000, percentage: 0, status: 'normal', unit: 'Chars' },
        calls: { used: 0, limit: 100, percentage: 0, status: 'normal', unit: 'Mins' },
        storage: { used: 0, limit: 524288000, percentage: 0, status: 'normal', unit: 'MB' },
        overallStatus: 'normal',
        tier: PlanTier.FREE
      };
    }

    const [usageRes, subRes] = await Promise.all([
      client.from('user_usage').select('*').eq('user_id', userId).single(),
      client.from('subscriptions').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle()
    ]);

    if (usageRes.error || !usageRes.data) {
      return null;
    }

    const usage = usageRes.data as UserUsage;
    const tier = (subRes.data?.tier as PlanTier) || PlanTier.FREE;
    const limits = SUBSCRIPTION_LIMITS[tier];

    const metrics = {
      translation: {
        used: Number(usage.translation_chars_count),
        limit: limits.translation_limit,
        unit: 'Chars',
      },
      calls: {
        used: Number(usage.call_minutes_count),
        limit: limits.call_minutes_limit,
        unit: 'Mins',
      },
      storage: {
        used: Number(usage.storage_used),
        limit: limits.storage_limit_mb * 1024 * 1024,
        unit: 'MB',
      }
    };

    const processMetric = (m: { used: number, limit: number, unit: string }): UsageMetric => {
      const percentage = m.limit > 0 ? (m.used / m.limit) * 100 : 0;
      return {
        ...m,
        percentage: parseFloat(percentage.toFixed(1)),
        status: this.calculateStatus(m.used, m.limit),
      };
    };

    const translation = processMetric(metrics.translation);
    const calls = processMetric(metrics.calls);
    const storage = processMetric(metrics.storage);

    const statuses: UsageStatus[] = [translation.status, calls.status, storage.status];
    let overallStatus: UsageStatus = 'normal';
    if (statuses.includes('exhausted')) overallStatus = 'exhausted';
    else if (statuses.includes('warning')) overallStatus = 'warning';

    return { translation, calls, storage, overallStatus, tier };
  }
}

export const usageService = UsageService.getInstance();
