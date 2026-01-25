
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Message } from '../types/index.ts';

export class ChatService {
  private static instance: ChatService;
  private supabase: SupabaseClient | null = null;

  private constructor() {
    const env = typeof process !== 'undefined' ? process.env : {};
    const supabaseUrl = (env.SUPABASE_URL || '').trim();
    const supabaseAnonKey = (env.SUPABASE_ANON_KEY || '').trim();

    if (supabaseUrl && supabaseAnonKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
      } catch (err) {
        console.warn('ChatService: Failed to initialize Supabase client:', err);
      }
    }
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  private getClient(): SupabaseClient | null {
    return this.supabase;
  }

  async getMessages(chat_id: string): Promise<Message[]> {
    const client = this.getClient();
    if (!client) return [];

    const { data, error } = await client
      .from('messages')
      .select('*, attachments:message_attachments(*)')
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: true });

    if (error) return [];
    return data as any[];
  }

  async sendMessage(chatId: string, senderId: string, originalText: string, translatedText?: string): Promise<Message | null> {
    const client = this.getClient();
    if (!client) return null;

    const { data, error } = await client
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        original_text: originalText,
        translated_text: translatedText || null,
        status: 'sent'
      })
      .select('*, attachments:message_attachments(*)')
      .single();

    return error ? null : data;
  }

  /**
   * New: ATOMIC BATCH COMMIT
   */
  async sendBatchMediaMessage(
    chatId: string, 
    senderId: string, 
    text: string, 
    attachments: { key: string, size: number, type: string, media_type: string, metadata: any }[]
  ): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    const { data, error } = await client.functions.invoke('commit-media-message', {
      body: { chatId, senderId, text, attachments }
    });

    return !error && data?.success;
  }

  async editMessage(messageId: string, newText: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    const { error } = await client.from('messages').update({ original_text: newText, is_edited: true }).eq('id', messageId);
    return !error;
  }

  async deleteMessage(messageId: string, type: 'me' | 'everyone'): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    if (type === 'everyone') {
      const { error } = await client.from('messages').update({ is_deleted: true }).eq('id', messageId);
      return !error;
    } else {
      const { error } = await client.from('messages').delete().eq('id', messageId);
      return !error;
    }
  }

  subscribeToChat(chatId: string, onUpdate: (payload: any) => void) {
    const client = this.getClient();
    if (!client) return () => {};
    const channel = client.channel(`chat:${chatId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, (payload) => onUpdate(payload)).subscribe();
    return () => client.removeChannel(channel);
  }
}

export const chatService = ChatService.getInstance();
