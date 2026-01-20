
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { checkUserQuota } from '../utils/quota-engine.ts';

export class StorageService {
  private static instance: StorageService;
  private supabase: SupabaseClient | null = null;

  private constructor() {
    const env = typeof process !== 'undefined' ? process.env : {};
    const url = (env.SUPABASE_URL || '').trim();
    const key = (env.SUPABASE_ANON_KEY || '').trim();
    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Request a pre-signed R2 upload URL.
   * Performs quota validation before provisioning.
   */
  async getUploadUrl(userId: string, fileName: string, fileSize: number, fileType: string): Promise<{ url?: string; key?: string; error?: string; status?: number }> {
    if (!this.supabase) return { error: 'STORAGE_CONFIG_MISSING', status: 500 };

    try {
      // 1. Pre-flight Quota Guard
      const quota = await checkUserQuota(this.supabase, userId, 'STORAGE', fileSize);
      if (!quota.allowed) {
        return { error: 'QUOTA_EXHAUSTED', status: 402 };
      }

      // 2. Provision Pre-signed URL via Edge Function
      const { data, error } = await this.supabase.functions.invoke('manage-storage', {
        body: { action: 'get-upload-url', userId, fileName, fileType, fileSize }
      });

      if (error || !data?.url) throw new Error(error?.message || 'Failed to provision storage slot');

      return { url: data.url, key: data.key };
    } catch (err: any) {
      return { error: err.message, status: 500 };
    }
  }

  /**
   * Performs the binary upload directly to R2 with progress tracking.
   */
  async uploadFile(url: string, file: File, onProgress: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(Math.round(percentComplete));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) resolve();
        else reject(new Error(`Upload failed with status: ${xhr.status}`));
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(file);
    });
  }

  /**
   * Confirms upload completion and triggers atomic usage increment.
   */
  async confirmUpload(userId: string, key: string, size: number): Promise<void> {
    if (!this.supabase) return;
    await this.supabase.functions.invoke('manage-storage', {
      body: { action: 'confirm-upload', userId, key, size }
    });
  }

  /**
   * Generates a temporary signed download URL.
   */
  async getDownloadUrl(key: string): Promise<string | null> {
    if (!this.supabase) return null;
    const { data } = await this.supabase.functions.invoke('manage-storage', {
      body: { action: 'get-download-url', key }
    });
    return data?.url || null;
  }
}

export const storageService = StorageService.getInstance();
