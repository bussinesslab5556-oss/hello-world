
import React, { useState } from 'react';
import { TranslationToggle } from './TranslationToggle.tsx';
import { Phone, Video, MoreVertical, ShieldCheck } from 'lucide-react';

interface ChatHeaderProps {
  recipientName: string;
  isTranslationEnabled: boolean;
  onToggleTranslation: (val: boolean) => void;
  targetLanguage: string;
  onLanguageChange: (lang: string) => void;
  isNearLimit?: boolean;
  onStartCall?: (type: 'audio' | 'video') => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  recipientName,
  isTranslationEnabled,
  onToggleTranslation,
  targetLanguage,
  onLanguageChange,
  isNearLimit,
  onStartCall
}) => {
  const [isConnecting, setIsConnecting] = useState<'audio' | 'video' | null>(null);

  const startCall = (type: 'audio' | 'video') => {
    setIsConnecting(type);
    setTimeout(() => {
      onStartCall?.(type);
      setIsConnecting(null);
    }, 800);
  };

  return (
    <header className="px-6 py-4 bg-[#2B2F36] border-b border-[#3A3F47] flex items-center justify-between shrink-0 relative z-10 shadow-lg">
      
      {/* Dynamic Status Indicator */}
      {isConnecting && (
        <div className="absolute top-[105%] left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 px-5 py-2 rounded-full border border-[#39FF14]/40 bg-[#1F2329]/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            <div className="relative w-2 h-2">
              <div className="absolute inset-0 rounded-full bg-[#39FF14] animate-ping opacity-75"></div>
              <div className="absolute inset-0 rounded-full bg-[#39FF14]"></div>
            </div>
            <span className="text-[9px] font-black text-[#39FF14] uppercase tracking-[0.3em] italic animate-pulse">Establishing Node Link...</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-[#3A3F47] flex items-center justify-center font-black text-white text-sm border border-white/5 shadow-inner uppercase tracking-tighter">
            {recipientName.charAt(0)}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#39FF14] border-[3px] border-[#2B2F36] rounded-full shadow-[0_0_12px_rgba(57,255,20,0.6)]"></div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm font-black text-white tracking-tight uppercase italic">{recipientName}</h1>
          <div className="flex items-center gap-1.5 opacity-60">
             <ShieldCheck size={10} className="text-[#39FF14]" />
             <span className="text-[9px] text-white/60 font-black uppercase tracking-[0.1em] leading-none">Secured Link</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden lg:block">
          <TranslationToggle 
            isEnabled={isTranslationEnabled} 
            onToggle={onToggleTranslation}
            isNearLimit={isNearLimit}
          />
        </div>

        <div className="flex items-center gap-1.5 border-l border-[#3A3F47] pl-4">
          <button 
            onClick={() => startCall('audio')}
            disabled={!!isConnecting}
            className={`p-2.5 rounded-xl transition-all active:scale-90 ${isConnecting === 'audio' ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'text-[#39FF14] hover:bg-[#39FF14]/10'}`}
          >
            <Phone size={20} />
          </button>
          
          <button 
            onClick={() => startCall('video')}
            disabled={!!isConnecting}
            className={`p-2.5 rounded-xl transition-all active:scale-90 ${isConnecting === 'video' ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'text-[#39FF14] hover:bg-[#39FF14]/10'}`}
          >
            <Video size={20} />
          </button>

          <button className="p-2 text-white/20 hover:text-white transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
