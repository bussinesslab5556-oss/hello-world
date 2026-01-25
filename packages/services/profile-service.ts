
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile } from '../types/index.ts';
import { getEnv } from '../utils/env-config.ts';

export class ProfileService {
  private static instance: ProfileService;
  private supabase: SupabaseClient | null = null;

  private constructor() {
    this.initialize();
  }

  private initialize() {
    const supabaseUrl = getEnv('SUPABASE_URL');
    const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

    if (supabaseUrl && supabaseAnonKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
      } catch (err) {
        console.warn('ProfileService: Init error:', err);
      }
    }
  }

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  private getClient(): SupabaseClient | null {
    if (!this.supabase) this.initialize();
    return this.supabase;
  }

  /**
   * Validates if a string is a valid UUID to prevent Postgres 400 errors.
   */
  private isValidUuid(uuid: string): boolean {
    if (!uuid || typeof uuid !== 'string' || uuid === 'null' || uuid === 'undefined') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return true;

    const { data, error } = await client
      .from('profiles')
      .select('username')
      .ilike('username', username)
      .maybeSingle();

    return !data && !error;
  }

  async getProfile(userId: string): Promise<Profile | null> {
    if (!this.isValidUuid(userId)) {
      console.warn(`ProfileService: Aborted fetch for invalid UUID: ${userId}`);
      return null;
    }

    const client = this.getClient();
    if (!client) return null;

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return error ? null : data;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ success: boolean; error?: string }> {
    if (!this.isValidUuid(userId)) {
      return { success: false, error: 'Invalid User Identity Link (ID null)' };
    }

    const client = this.getClient();
    if (!client) return { success: false, error: 'Service configuration missing' };

    if (updates.primary_language && updates.secondary_language && updates.primary_language === updates.secondary_language) {
      return { success: false, error: 'Languages must be distinct.' };
    }

    const { error } = await client
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return error ? { success: false, error: error.message } : { success: true };
  }
}

export const profileService = ProfileService.getInstance();
