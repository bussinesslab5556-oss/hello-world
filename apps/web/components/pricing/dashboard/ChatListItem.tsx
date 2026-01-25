
import React from 'react';
import { Globe, VolumeX, Check, CheckCheck } from 'lucide-react';

interface ChatListItemProps {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isTranslated?: boolean;
  isMuted?: boolean;
  isActive?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  onClick: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  name,
  avatarUrl,
  lastMessage,
  timestamp,
  unreadCount,
  isTranslated,
  isMuted,
  isActive,
  status,
  onClick
}) => {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-4 flex items-center gap-4 transition-all border-l-[3px] group ${
        isActive 
          ? 'bg-[#007BFF]/10 border-[#007BFF]' 
          : 'bg-transparent border-transparent hover:bg-white/[0.03]'
      }`}
    >
      {/* Avatar Container */}
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full bg-[#3A3F47] border-2 border-white/5 overflow-hidden flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-black text-white italic">{name[0]}</span>
          )}
        </div>
        {/* Active Indicator could go here */}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-0.5">
          <h4 className={`text-[14px] font-bold truncate transition-colors ${isActive ? 'text-[#007BFF]' : 'text-white'}`}>
            {name}
          </h4>
          <span className="text-[10px] font-medium text-[#9CA3AF] shrink-0">
            {timestamp}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            {isTranslated && <Globe size={10} className="text-[#39FF14] shrink-0" />}
            <p className="text-[13px] text-[#9CA3AF] truncate font-medium">
              {lastMessage}
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {isMuted && <VolumeX size={12} className="text-[#9CA3AF]/40" />}
            {unreadCount > 0 ? (
              <div className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#007BFF] flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-[10px] font-black text-white">{unreadCount}</span>
              </div>
            ) : status && (
              <div className="flex items-center">
                {status === 'read' ? (
                  <CheckCheck size={14} className="text-[#39FF14]" />
                ) : (
                  <Check size={14} className="text-[#9CA3AF]/40" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
