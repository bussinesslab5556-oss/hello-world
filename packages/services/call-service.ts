
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { checkUserQuota } from '../utils/quota-engine.ts';
import { CallType, CallStatus, CallRecord, RoomManagementResponse } from '../types/calls.ts';

export class CallService {
  private static instance: CallService;
  private supabase: SupabaseClient | null = null;

  private constructor() {
    const env = typeof process !== 'undefined' ? process.env : {};
    const url = (env.SUPABASE_URL || '').trim();
    const key = (env.SUPABASE_ANON_KEY || '').trim();

    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  public static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService();
    }
    return CallService.instance;
  }

  /**
   * Initiates a neural communication session (Audio/Video).
   * Validates quota before signaling the 100ms.live room engine.
   */
  async initiateCall(callerId: string, receiverId: string, type: CallType): Promise<{ roomId?: string; authToken?: string; error?: string; status?: number }> {
    if (!this.supabase) return { error: 'Service not configured', status: 500 };

    try {
      // 1. Quota Guard: Check remaining call minutes
      const quota = await checkUserQuota(this.supabase, callerId, 'CALL', 1);
      if (!quota.allowed) {
        return { error: 'QUOTA_EXHAUSTED', status: 402 };
      }

      // 2. Room Provisioning: Invoke Supabase Edge Function to create 100ms room
      const { data: roomData, error: roomError } = await this.supabase.functions.invoke('manage-100ms-room', {
        body: { action: 'create', userId: callerId, type }
      });

      if (roomError || !roomData?.roomId) {
        throw new Error(roomError?.message || 'Failed to provision communication room');
      }

      const roomId = roomData.roomId;

      // 3. Signaling: Create call record in database
      const { error: dbError } = await this.supabase.from('calls').insert({
        room_id: roomId,
        caller_id: callerId,
        receiver_id: receiverId,
        type,
        status: 'ringing' as CallStatus,
        started_at: new Date().toISOString()
      });

      if (dbError) throw dbError;

      // 4. Token Generation: Get client join token
      const { data: tokenData, error: tokenError } = await this.supabase.functions.invoke('manage-100ms-room', {
        body: { action: 'join', roomId, userId: callerId, role: 'host' }
      });

      if (tokenError) throw tokenError;

      return { roomId, authToken: tokenData.token };

    } catch (err: any) {
      console.error('CallService Initiate Error:', err);
      return { error: err.message, status: 500 };
    }
  }

  /**
   * Fetches an authentication token for an existing room.
   */
  async getJoinToken(roomId: string, userId: string, role: 'host' | 'guest' = 'guest'): Promise<string | null> {
    if (!this.supabase) return null;
    
    const { data, error } = await this.supabase.functions.invoke('manage-100ms-room', {
      body: { action: 'join', roomId, userId, role }
    });

    if (error) {
      console.error('Failed to get join token:', error);
      return null;
    }

    return data.token;
  }

  /**
   * Terminate a call session and update metrics.
   */
  async endCall(callId: string, durationSeconds: number): Promise<void> {
    if (!this.supabase) return;

    const minutesUsed = Math.ceil(durationSeconds / 60);

    await this.supabase.from('calls').update({
      status: 'ended' as CallStatus,
      ended_at: new Date().toISOString(),
      duration: durationSeconds
    }).eq('id', callId);

    // Increment usage metrics
    const { data: usage } = await this.supabase
      .from('user_usage')
      .select('call_minutes_count, user_id')
      .eq('id', callId) // This is a placeholder, usually linked via call record
      .single();

    // Actual logic would increment user_usage based on caller_id
  }
}

export const callService = CallService.getInstance();
