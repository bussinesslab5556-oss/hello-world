
import { createClient, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getRedirectUrl } from '../utils/auth-config.ts';
import { debugEnv } from '../utils/env-config.ts';

export class AuthError extends Error {
  constructor(public message: string, public code?: string) {
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
      const { url, key } = debugEnv();
      let supabaseUrl = url;
      if (supabaseUrl && supabaseUrl.endsWith('/')) {
        supabaseUrl = supabaseUrl.slice(0, -1);
      }

      if (!supabaseUrl || !key) {
        throw new AuthError('Critical: Missing Supabase Credentials', 'CONFIG_MISSING');
      }

      // Hardened client configuration for Production Auth
      this.supabase = createClient(supabaseUrl, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce' // Ensure PKCE is used for secure code exchange
        }
      });
      
      console.log('✅ Neural Sync: Supabase Auth Uplink Active [Flow: PKCE].');
    } catch (err: any) {
      console.error('AuthService: Initialization Failure:', err.message);
      throw err;
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public getAuthClient() {
    if (!this.supabase) this.initialize();
    return this.supabase!.auth;
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const auth = this.getAuthClient();
    const { data: { subscription } } = auth.onAuthStateChange(callback);
    return subscription;
  }

  /**
   * Normalizes the email to prevent casing mismatches.
   */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async signInWithPassword(email: string, password: string) {
    try {
      const auth = this.getAuthClient();
      const normalizedEmail = this.normalizeEmail(email);

      console.log(`[Auth Audit] Attempting sign-in for: ${normalizedEmail}`);
      
      const { data, error } = await auth.signInWithPassword({ 
        email: normalizedEmail, 
        password // Send raw password string without manipulation
      });

      if (error) {
        // Detailed Diagnostic Logging
        console.table({
          event: 'Auth_Sign_In_Failure',
          status: error.status,
          message: error.message,
          code: error.code,
          hint: 'If confirmation is disabled, ensure the user exists in auth.users'
        });

        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login credentials')) {
          throw new AuthError('The email or password provided is incorrect. Please check your credentials.', 'INVALID_CREDENTIALS');
        }
        if (msg.includes('email not confirmed')) {
          throw new AuthError('Neural identity not verified. Please check your inbox for a confirmation link.', 'EMAIL_NOT_CONFIRMED');
        }
        throw new AuthError(error.message, error.status?.toString());
      }

      console.log('[Auth Audit] Sign-in successful. Session captured.');
      return data;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || 'The neural link encountered a network timeout during authentication.', 'UNEXPECTED_FAILURE');
    }
  }

  async signUp(email: string, password: string) {
    try {
      const auth = this.getAuthClient();
      const normalizedEmail = this.normalizeEmail(email);

      const { data, error } = await auth.signUp({
        email: normalizedEmail,
        password,
        options: { 
          emailRedirectTo: getRedirectUrl(),
          data: {
            full_name: normalizedEmail.split('@')[0] // Fallback for profile creation
          }
        }
      });

      if (error) throw new AuthError(error.message, error.status?.toString());
      return data;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || 'Signup sequence failed.', 'SIGNUP_ERROR');
    }
  }

  /**
   * Resends the confirmation email for a pending signup.
   * Fixes: Error in file packages/web/components/auth/AuthForm.tsx on line 69
   */
  async resendConfirmation(email: string) {
    try {
      const auth = this.getAuthClient();
      const normalizedEmail = this.normalizeEmail(email);
      const { error } = await auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: {
          emailRedirectTo: getRedirectUrl()
        }
      });
      if (error) throw new AuthError(error.message, error.status?.toString());
      return true;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || 'Resend confirmation failed.', 'RESEND_ERROR');
    }
  }

  /**
   * Verifies an OTP token sent via email or phone.
   * Fixes: Error in file packages/web/components/auth/OtpInput.tsx on line 67
   */
  async verifyOtp(identifier: string, token: string, type: 'email' | 'phone') {
    try {
      const auth = this.getAuthClient();
      const { data, error } = await auth.verifyOtp({
        email: type === 'email' ? this.normalizeEmail(identifier) : undefined,
        phone: type === 'phone' ? identifier : undefined,
        token,
        type: type === 'email' ? 'magiclink' : 'sms'
      });
      if (error) throw new AuthError(error.message, error.status?.toString());
      return data;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || 'OTP verification failed.', 'VERIFY_OTP_ERROR');
    }
  }

  /**
   * Sends an OTP token via email or phone.
   * Fixes: Error in file packages/web/components/auth/OtpInput.tsx on line 90
   */
  async sendOtp(identifier: string, type: 'email' | 'phone') {
    try {
      const auth = this.getAuthClient();
      const { error } = await auth.signInWithOtp({
        email: type === 'email' ? this.normalizeEmail(identifier) : undefined,
        phone: type === 'phone' ? identifier : undefined,
        options: {
          emailRedirectTo: getRedirectUrl()
        }
      });
      if (error) throw new AuthError(error.message, error.status?.toString());
      return true;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(err.message || 'Failed to send OTP.', 'SEND_OTP_ERROR');
    }
  }

  async exchangeCodeForSession(code: string) {
    const auth = this.getAuthClient();
    try {
      const { data, error } = await auth.exchangeCodeForSession(code);
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[Auth Audit] Code exchange failed:', err);
      throw err;
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
    const supabase = this.getSupabase();
    if (!supabase) return false;
    // Direct check against profiles table
    const { data, error } = await supabase.from('profiles').select('id, username').eq('id', userId).maybeSingle();
    if (error) {
      console.error('[Auth Audit] Profile check failed:', error);
      return false;
    }
    return !!(data && data.username);
  }
}

export const authService = AuthService.getInstance();
