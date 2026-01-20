
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class NotificationService {
  private static instance: NotificationService;
  private supabase: SupabaseClient | null = null;

  private constructor() {
    const env = typeof process !== 'undefined' ? process.env : {};
    const url = (env.SUPABASE_URL || '').trim();
    const key = (env.SUPABASE_ANON_KEY || '').trim();
    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Request push permission and save the FCM token to Supabase.
   */
  async requestPermissionAndSaveToken(userId: string): Promise<string | null> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Push notifications not supported on this platform');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return null;

      // This would normally use the Firebase SDK to get the token
      // For this implementation, we assume the logic exists or is handled by the platform-specific wrapper
      const fcmToken = await this.getFirebaseToken();
      if (fcmToken) {
        await this.saveDeviceToken(userId, fcmToken, 'web');
      }
      return fcmToken;
    } catch (err) {
      console.error('Failed to get notification permission', err);
      return null;
    }
  }

  /**
   * Registers/Updates an FCM token for a user.
   */
  async saveDeviceToken(userId: string, token: string, platform: 'web' | 'ios' | 'android') {
    if (!this.supabase) return;

    const { error } = await this.supabase
      .from('user_devices')
      .upsert({
        user_id: userId,
        fcm_token: token,
        platform: platform,
        last_seen_at: new Date().toISOString()
      }, { onConflict: 'fcm_token' });

    if (error) {
      console.error('Error saving device token:', error);
    }
  }

  /**
   * Placeholder for getting the FCM token from Firebase SDK.
   */
  private async getFirebaseToken(): Promise<string | null> {
    // Logic to call messaging.getToken() from Firebase JS SDK
    return "fcm_token_placeholder";
  }
}

export const notificationService = NotificationService.getInstance();
