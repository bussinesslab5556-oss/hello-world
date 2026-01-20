
import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../../../../packages/services/chat-service.ts';
import { usageService } from '../../../../packages/services/usage-service.ts';
import { MessageBubble } from './MessageBubble.tsx';
import { ChatInput } from './ChatInput.tsx';
import { ChatHeader } from './ChatHeader.tsx';
import { Message } from '../../../../packages/types/index.ts';
import { useTranslation } from '../../hooks/useTranslation.ts';

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
  recipientName: string;
  onStartCall?: (type: 'audio' | 'video') => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, currentUserId, recipientName, onStartCall }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNearLimit, setIsNearLimit] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { 
    isEnabled, 
    setIsEnabled, 
    targetLanguage, 
    setTargetLanguage, 
    translateText, 
    isTranslating,
    error 
  } = useTranslation(currentUserId);

  const normalize = (m: any): Message => {
    return {
      id: m.id,
      chatId: m.chat_id || m.chatId,
      senderId: m.sender_id || m.senderId,
      originalText: m.original_text || m.originalText || '',
      translatedText: m.translated_text || m.translatedText,
      isEdited: !!(m.is_edited || m.isEdited),
      isDeleted: !!(m.is_deleted || m.isDeleted),
      createdAt: m.created_at || m.createdAt || new Date().toISOString(),
      status: m.status || 'sent'
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTranslating]);

  useEffect(() => {
    const checkUsage = async () => {
      const summary = await usageService.getUserUsageSummary(currentUserId);
      if (summary) {
        setIsNearLimit(summary.translation.percentage >= 80);
      }
    };
    checkUsage();

    const loadHistory = async () => {
      setLoading(true);
      try {
        const history = await chatService.getMessages(chatId);
        const normalized = (history || []).map(normalize);
        setMessages(normalized);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();

    const unsubscribe = chatService.subscribeToChat(chatId, (payload) => {
      if (!payload.new) return;
      setMessages((prev) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = normalize(payload.new);
          const existingIndex = prev.findIndex(m => m.id === newMessage.id || (m.id.startsWith('temp-') && m.senderId === currentUserId && m.originalText === newMessage.originalText));
          if (existingIndex > -1) {
            const updated = [...prev];
            updated[existingIndex] = newMessage;
            return updated;
          }
          return [...prev, newMessage];
        } 
        if (payload.eventType === 'UPDATE') {
          const updated = normalize(payload.new);
          return prev.map(m => m.id === updated.id ? updated : m);
        } 
        if (payload.eventType === 'DELETE') {
          return prev.filter(m => m.id !== payload.old.id);
        }
        return prev;
      });
    });

    return () => unsubscribe();
  }, [chatId, currentUserId]);

  const handleSendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMsg = normalize({
      id: optimisticId,
      chat_id: chatId,
      sender_id: currentUserId,
      original_text: trimmed,
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      status: 'sent'
    });
    
    setMessages(prev => [...prev, optimisticMsg]);

    let translatedText: string | undefined = undefined;
    if (isEnabled) {
      translatedText = await translateText(trimmed);
    }
    
    try {
      const result = await chatService.sendMessage(chatId, currentUserId, trimmed, translatedText);
      if (result) {
        const normalizedResult = normalize(result);
        setMessages(prev => prev.map(m => m.id === optimisticId ? normalizedResult : m));
      }
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, status: 'error' as any } : m));
    }
  };

  return (
    <div className="w-full h-full md:rounded-[32px] bg-[#1F2329] border border-[#3A3F47] overflow-hidden flex flex-col shadow-2xl relative transition-all duration-500">
      <ChatHeader 
        recipientName={recipientName}
        isTranslationEnabled={isEnabled}
        onToggleTranslation={setIsEnabled}
        targetLanguage={targetLanguage}
        onLanguageChange={setTargetLanguage}
        isNearLimit={isNearLimit}
        onStartCall={onStartCall}
      />

      <section 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-10 space-y-6 scroll-smooth custom-scrollbar relative min-h-0"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(57,255,20,0.01) 0%, transparent 80%)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-[#007BFF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.5em] italic text-[#9CA3AF]">Secure Connection Established</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <MessageBubble
                key={msg.id || `msg-${index}`}
                id={msg.id}
                originalText={msg.originalText}
                translatedText={msg.translatedText}
                isMine={msg.senderId === currentUserId}
                timestamp={msg.createdAt}
                status={msg.status}
                isEdited={msg.isEdited}
                isDeleted={msg.isDeleted}
              />
            ))}
            <div ref={messagesEndRef} className="h-px w-full" />
          </>
        )}

        {isTranslating && (
          <div className="sticky bottom-0 left-0 right-0 flex justify-center pb-4 pointer-events-none">
             <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 shadow-[0_0_20px_rgba(57,255,20,0.1)]">
                <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-[#39FF14] uppercase tracking-widest">Neural Processing</span>
             </div>
          </div>
        )}
      </section>

      <footer className="p-5 bg-[#2B2F36] border-t border-[#3A3F47] shadow-inner shrink-0">
        <ChatInput onSend={handleSendMessage} currentUserId={currentUserId} disabled={loading || isTranslating} />
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3A3F47; border-radius: 10px; }
      `}</style>
    </div>
  );
};
