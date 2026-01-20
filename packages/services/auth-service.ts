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
      debugEnv();

      const supabaseUrl = getEnv('SUPABASE_URL');
      const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

      console.group('AuthService: Configuration Bridge');
      
      if (supabaseUrl && supabaseAnonKey) {
        this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        console.log('✅ Supabase Client generated successfully.');
      } else {
        console.error('❌ Configuration missing in all layers (process.env, import.meta, window).');
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
          'Authentication service is not properly configured. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your environment.', 
          'CONFIG_ERROR'
        );
      }
    }
    return this.supabase.auth;
  }

  /**
   * Universal OTP sender for both Phone and Email.
   */
  async sendOtp(identifier: string, type: 'email' | 'phone') {
    try {
      const auth = this.getAuthClient();
      const options: any = {
        options: { 
          shouldCreateUser: true,
          emailRedirectTo: getRedirectUrl()
        }
      };

      if (type === 'phone') {
        options.phone = identifier;
        options.options.channel = 'sms';
      } else {
        options.email = identifier;
      }

      const { error } = await auth.signInWithOtp(options);
      
      if (error) throw new AuthError(error.message, error.status?.toString());
      return { success: true };
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || 'Failed to send verification code.', 'NETWORK_ERROR');
    }
  }

  /**
   * Email + Password Sign Up (RESTORED)
   */
  async signUp(email: string, password: string) {
    try {
      const auth = this.getAuthClient();
      const { data, error } = await auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getRedirectUrl(),
        }
      });

      if (error) throw new AuthError(error.message, error.status?.toString());
      return data;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || 'Signup failed.', 'AUTH_ERROR');
    }
  }

  /**
   * Password-based Sign In (RESTORED)
   */
  async signInWithPassword(email: string, password: string) {
    try {
      const auth = this.getAuthClient();
      const { data, error } = await auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new AuthError(error.message, error.status?.toString());
      return data;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || 'Login failed.', 'AUTH_ERROR');
    }
  }

  /**
   * Universal Social Sign-In (OAuth)
   */
  async signInWithSocial(provider: 'google' | 'apple' | 'azure' | 'facebook') {
    try {
      const auth = this.getAuthClient();
      const { error } = await auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getRedirectUrl(),
        },
      });

      if (error) throw new AuthError(error.message, error.status?.toString());
      return { success: true };
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || `Failed to sign in with ${provider}.`, 'SOCIAL_AUTH_FAILED');
    }
  }

  /**
   * Universal OTP verifier for both Phone and Email.
   */
  async verifyOtp(identifier: string, token: string, type: 'email' | 'phone') {
    try {
      const auth = this.getAuthClient();
      const verifyOptions: any = {
        token,
        type: type === 'phone' ? 'sms' : 'email',
      };

      if (type === 'phone') {
        verifyOptions.phone = identifier;
      } else {
        verifyOptions.email = identifier;
      }

      const { data, error } = await auth.verifyOtp(verifyOptions);

      if (error) throw new AuthError(error.message, error.status?.toString());
      if (!data.user) throw new AuthError('Verification failed.', 'AUTH_FAILED');

      return data;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || 'Verification failed.', 'VERIFY_FAILED');
    }
  }

  async signOut() {
    try {
      const auth = this.getAuthClient();
      await auth.signOut();
    } catch (err) {
      console.error('Signout failed:', err);
    }
  }

  public getSupabase(): SupabaseClient | null {
    if (!this.supabase) this.initialize();
    return this.supabase;
  }

  async checkProfileInitialization(userId: string): Promise<boolean> {
    if (!this.supabase) return false;
    const { data } = await this.supabase.from('profiles').select('id, username').eq('id', userId).maybeSingle();
    return !!(data && data.username);
  }
}

export const authService = AuthService.getInstance();