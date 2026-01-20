
/**
 * Call System Types & Statuses
 */

export type CallType = 'audio' | 'video';

export type CallStatus = 'ringing' | 'ongoing' | 'ended' | 'missed' | 'rejected';

export interface CallRecord {
  id: string;
  room_id: string;
  caller_id: string;
  receiver_id: string;
  type: CallType;
  status: CallStatus;
  started_at: string;
  ended_at?: string;
  duration?: number; // in seconds
}

export interface CallPayload {
  roomId: string;
  authToken: string;
  type: CallType;
  recipientName: string;
}

export interface RoomManagementResponse {
  roomId: string;
  error?: string;
}
