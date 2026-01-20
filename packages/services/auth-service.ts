import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getRedirectUrl } from '../utils/auth-config.ts';
import { getEnv, debugEnv } from '../utils/env-config.ts';

export class AuthError extends Error {
  constructor(public message: string, public status?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  private static instance: AuthService;
  private supabase: SupabaseClient | null = null;

  private constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Run diagnostic
      debugEnv();

      const supabaseUrl = getEnv('SUPABASE_URL');
      const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

      console.group('AuthService: Configuration Bridge');
      
      if (supabaseUrl && supabaseAnonKey) {
        console.log('✅ SUPABASE_URL: Found');
        console.log('✅ SUPABASE_ANON_KEY: Found');
        
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase Client generated successfully.');
      } else {
        console.error('❌ Configuration missing in all layers (process.env, import.meta, window).');
        console.log('Requested URL Detected:', !!supabaseUrl);
        console.log('Requested KEY Detected:', !!supabaseAnonKey);
      }
      console.groupEnd();
    } catch (err) {
      console.error('AuthService: Fatal initialization error:', err);
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private getAuthClient(): any {
    if (!this.supabase) {
      this.initialize(); 
      if (!this.supabase) {
        throw new AuthError(
          'Authentication service is not properly configured. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env.local file.', 
          'CONFIG_ERROR'
        );
      }
    }
    return this.supabase.auth;
  }

  async sendOtp(phone: string) {
    try {
      const auth = this.getAuthClient();
      const { error } = await auth.signInWithOtp({
        phone,
        options: { channel: 'sms' },
      });
      if (error) throw new AuthError(error.message, error.status?.toString());
      return { success: true };
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || 'Failed to send verification code.', 'NETWORK_ERROR');
    }
  }

  async verifyOtp(phone: string, token: string) {
    try {
      const auth = this.getAuthClient();
      const { data, error } = await auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) throw new AuthError(error.message, error.status?.toString());
      if (!data.user) throw new AuthError('Verification failed.', 'AUTH_FAILED');

      await this.checkProfileInitialization(data.user.id);
      return data;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || 'Verification failed.', 'VERIFY_FAILED');
    }
  }

  async signUpWithEmail(email: string, password: string) {
    try {
      const auth = this.getAuthClient();
      const { data, error } = await auth.signUp({ email, password });
      if (error) throw new AuthError(error.message, error.status?.toString());
      return data;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || 'Signup failed.', 'AUTH_FAILED');
    }
  }

  async signInWithEmail(email: string, password: string) {
    try {
      const auth = this.getAuthClient();
      const { data, error } = await auth.signInWithPassword({ email, password });
      if (error) throw new AuthError(error.message, error.status?.toString());
      return data;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || 'Invalid email or password', 'AUTH_FAILED');
    }
  }

  async signInWithSocial(provider: 'google' | 'apple' | 'facebook' | 'azure') {
    try {
      const auth = this.getAuthClient();
      const { data, error } = await auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getRedirectUrl(),
          skipBrowserRedirect: false,
        },
      });
      if (error) throw new AuthError(error.message, error.status?.toString());
      return data;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || `Connection failed with ${provider}.`, 'OAUTH_FAILED');
    }
  }

  public getSupabase(): SupabaseClient | null {
    if (!this.supabase) this.initialize();
    return this.supabase;
  }

  private async checkProfileInitialization(userId: string): Promise<boolean> {
    if (!this.supabase) return false;
    const MAX_ATTEMPTS = 6;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const { data } = await this.supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
      if (data) return true;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return false;
  }
}

export const authService = AuthService.getInstance();
