import React, { useState } from 'react';
import { Search, Plus, UserCircle, Ghost } from 'lucide-react';
import { ChatListItem } from './pricing/dashboard/ChatListItem.tsx';
import { UsageBanner } from './pricing/dashboard/UsageBanner.tsx';
import { NewChatModal } from './pricing/dashboard/NewChatModal.tsx';

interface ChatListProps {
  userId: string;
  onChatSelect: (chatId: string) => void;
  activeChatId?: string;
  onProfileClick: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({ 
  userId, 
  onChatSelect, 
  activeChatId,
  onProfileClick 
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock chats for the implementation (Read-only frontend behavior)
  const mockChats = [
    { id: 'demo-chat', name: 'Neural Agent', lastMessage: 'Establishing secure link...', timestamp: '10:45 AM', unread: 1, isTranslated: true, status: 'delivered' },
    { id: '2', name: 'Support Node', lastMessage: 'Translation limit reached for this session.', timestamp: 'Yesterday', unread: 0, status: 'read' },
    { id: '3', name: 'Global Ops Group', lastMessage: 'Alice: We need the translation now.', timestamp: 'Monday', unread: 12, isTranslated: true }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#1F2329]/50 border-r border-white/5 relative overflow-hidden">
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between bg-[#1F2329] border-b border-white/5 shrink-0">
        <h2 className="text-[20px] font-black text-white italic tracking-tighter uppercase">Chats</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 text-white/40 hover:text-white transition-colors"
          >
            <Search size={20} />
          </button>
          <button 
            onClick={onProfileClick}
            className="w-9 h-9 rounded-full bg-[#2B2F36] border border-white/10 flex items-center justify-center text-[#9CA3AF] hover:text-white transition-all overflow-hidden"
          >
            <UserCircle size={24} />
          </button>
        </div>
      </header>

      {/* Usage Indicator */}
      <UsageBanner userId={userId} />

      {/* Search Overlay Input */}
      {isSearchOpen && (
        <div className="px-5 py-3 bg-[#1F2329] border-b border-white/5 animate-in slide-in-from-top-4 duration-300">
          <input 
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter conversations..."
            className="w-full bg-[#2B2F36] border border-white/5 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-[#007BFF]"
          />
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1F2329]/20">
        {mockChats.length > 0 ? (
          mockChats.map(chat => (
            <ChatListItem 
              key={chat.id}
              id={chat.id}
              name={chat.name}
              lastMessage={chat.lastMessage}
              timestamp={chat.timestamp}
              unreadCount={chat.unread}
              isTranslated={chat.isTranslated}
              isActive={activeChatId === chat.id}
              status={chat.status as any}
              onClick={() => onChatSelect(chat.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-20">
            <Ghost size={48} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No frequency detected</p>
          </div>
        )}
      </div>

      {/* FAB - Mobile Only visible via CSS logic usually, but here fixed */}
      <button 
        onClick={() => setIsNewChatOpen(true)}
        className="fixed md:absolute bottom-20 md:bottom-8 right-6 w-14 h-14 bg-[#007BFF] rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all z-50 group"
      >
        <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>

      <NewChatModal 
        isOpen={isNewChatOpen} 
        onClose={() => setIsNewChatOpen(false)} 
        onSelect={(contactId) => onChatSelect(`chat-${contactId}`)}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
};