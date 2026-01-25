
import React from 'react';
import { Phone, PhoneOff, Video, Minus, Mic, Layers } from 'lucide-react';

interface IncomingCallModalProps {
  callerName: string;
  callerAvatar?: string;
  callType: 'audio' | 'video';
  queueCount?: number;
  onAccept: (asType?: 'audio' | 'video') => void;
  onDecline: () => void;
  onMinimize: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  callerName,
  callerAvatar,
  callType,
  queueCount = 0,
  onAccept,
  onDecline,
  onMinimize
}) => {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-lg animate-in fade-in duration-500">
      <div className="w-full h-full md:h-auto md:max-w-md bg-gradient-to-b from-[#000000] to-[#2B2F36] md:rounded-[40px] p-10 flex flex-col items-center justify-between md:justify-center text-center shadow-[0_25px_80px_rgba(0,0,0,0.8)] border border-white/5 relative overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Call Queue Badge */}
        {queueCount > 1 && (
          <div className="absolute top-8 left-8 flex items-center gap-2 px-3 py-1.5 bg-[#007BFF]/20 border border-[#007BFF]/40 rounded-full animate-pulse">
            <Layers size={12} className="text-[#007BFF]" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              +{queueCount - 1} More
            </span>
          </div>
        )}

        {/* Desktop Minimize Button */}
        <button 
          onClick={onMinimize}
          className="absolute top-8 right-8 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          aria-label="Minimize incoming call"
        >
          <Minus size={20} />
        </button>

        {/* Center Section: Caller Info */}
        <div className="flex-1 flex flex-col items-center justify-center w-full gap-8">
          <div className="relative">
            {/* Pulsing Rings */}
            <div className="absolute inset-0 rounded-full bg-[#39FF14]/20 animate-[ping_3s_ease-in-out_infinite]"></div>
            <div className="absolute inset-0 rounded-full bg-[#39FF14]/10 animate-[ping_2s_ease-in-out_infinite] scale-125"></div>
            
            <div className="relative w-[120px] h-[120px] rounded-full border-4 border-[#3A3F47] overflow-hidden shadow-2xl bg-[#1F2329] flex items-center justify-center">
              {callerAvatar ? (
                <img src={callerAvatar} className="w-full h-full object-cover" alt={callerName} />
              ) : (
                <div className="w-full h-full bg-[#2B2F36] flex items-center justify-center text-5xl font-black text-white italic">
                  {callerName.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="absolute -bottom-2 -right-2 p-3 bg-[#39FF14] rounded-2xl shadow-lg border-4 border-[#1F2329] text-black">
               {callType === 'video' ? <Video size={20} strokeWidth={3} /> : <Phone size={20} strokeWidth={3} />}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[28px] font-black text-white tracking-tight italic uppercase">{callerName}</h3>
            <p className="text-sm font-black text-[#9CA3AF] uppercase tracking-[0.4em]" aria-live="polite">
              Incoming {callType === 'video' ? 'Video' : 'Voice'} Call...
            </p>
          </div>
        </div>

        {/* Action Section */}
        <div className="w-full space-y-8 mt-auto md:mt-12">
          <div className="flex justify-center items-center gap-12 w-full">
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onDecline}
                className="w-16 h-16 bg-[#EF4444] text-white rounded-full flex items-center justify-center hover:bg-[#ff3b3b] shadow-[0_10px_30px_rgba(239,68,68,0.4)] transition-all duration-300 active:scale-90 group"
                aria-label="Decline call"
              >
                <PhoneOff size={28} strokeWidth={2.5} className="group-hover:-rotate-[135deg] transition-transform" />
              </button>
              <span className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Decline</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => onAccept(callType)}
                className="w-16 h-16 bg-[#39FF14] text-black rounded-full flex items-center justify-center hover:bg-[#32e012] shadow-[0_10px_30px_rgba(57,255,20,0.4)] transition-all duration-300 active:scale-90 group"
                aria-label="Accept call"
              >
                {callType === 'video' ? <Video size={28} strokeWidth={2.5} /> : <Phone size={28} strokeWidth={2.5} />}
              </button>
              <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-widest">Accept</span>
            </div>
          </div>

          {callType === 'video' && (
            <button
              onClick={() => onAccept('audio')}
              className="px-6 py-2 text-sm font-bold text-[#9CA3AF] hover:text-white transition-colors flex items-center gap-2 mx-auto"
            >
              <Mic size={16} /> Accept as Voice
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
