
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

  async getMessages(chatId: string): Promise<Message[]> {
    const client = this.getClient();
    if (!client) return [];

    const { data, error } = await client
      .from('messages')
      .select('id, chat_id, sender_id, original_text, translated_text, is_edited, is_deleted, created_at, status')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('ChatService: Error fetching messages:', error);
      return [];
    }
    return data as Message[];
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
        is_edited: false,
        is_deleted: false,
        status: 'sent'
      })
      .select('id, chat_id, sender_id, original_text, translated_text, is_edited, is_deleted, created_at, status')
      .single();

    if (error) {
      console.error('ChatService: Failed to dispatch message:', error);
      return null;
    }

    return data as Message;
  }

  async editMessage(messageId: string, newText: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    const { error } = await client
      .from('messages')
      .update({
        original_text: newText,
        is_edited: true
      })
      .eq('id', messageId);

    return !error;
  }

  async deleteMessage(messageId: string, type: 'me' | 'everyone'): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    if (type === 'everyone') {
      const { error } = await client
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId);
      return !error;
    } else {
      // In this specific implementation, we treat "Delete for me" as a database delete
      // Real-world would use a visibility toggle per user
      const { error } = await client
        .from('messages')
        .delete()
        .eq('id', messageId);
      return !error;
    }
  }

  subscribeToChat(chatId: string, onUpdate: (payload: any) => void) {
    const client = this.getClient();
    if (!client) return () => {};

    const channel = client
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => onUpdate(payload)
      )
      .subscribe();

    return () => client.removeChannel(channel);
  }
}

export const chatService = ChatService.getInstance();
