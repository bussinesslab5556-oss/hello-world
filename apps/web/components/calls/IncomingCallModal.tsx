
import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface IncomingCallModalProps {
  callerName: string;
  callerAvatar?: string;
  callType: 'audio' | 'video';
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onDecline
}) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm glass rounded-[40px] p-10 flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-[#39FF14]/20 animate-in zoom-in duration-500">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#39FF14] rounded-full blur-2xl opacity-10 animate-pulse"></div>
          <div className="relative w-32 h-32 rounded-full border-4 border-[#3A3F47] overflow-hidden shadow-2xl">
            {callerAvatar ? (
              <img src={callerAvatar} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#2B2F36] flex items-center justify-center text-4xl font-black text-white">
                {callerName.charAt(0)}
              </div>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 p-3 bg-[#39FF14] rounded-2xl shadow-lg border-4 border-[#1F2329] text-black">
             {callType === 'video' ? <Video size={20} strokeWidth={3} /> : <Phone size={20} strokeWidth={3} />}
          </div>
        </div>

        <h3 className="text-2xl font-black text-white tracking-tight mb-1 italic uppercase">{callerName}</h3>
        <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-[0.3em] mb-10">
          Incoming Neural {callType} Session
        </p>

        <div className="flex gap-6 w-full">
          <button
            onClick={onDecline}
            className="flex-1 py-4 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] rounded-2xl flex items-center justify-center hover:bg-[#EF4444] hover:text-white transition-all duration-300 active:scale-95 group"
          >
            <PhoneOff size={24} className="group-hover:animate-bounce" />
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-4 bg-[#39FF14] text-black rounded-2xl flex items-center justify-center hover:bg-[#32e012] shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-300 active:scale-95 group"
          >
            <Phone size={24} className="group-hover:animate-pulse" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};
