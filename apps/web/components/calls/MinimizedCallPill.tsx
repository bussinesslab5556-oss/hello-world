
import React from 'react';
import { Maximize2, PhoneOff, Mic, Video } from 'lucide-react';

interface MinimizedCallPillProps {
  peerName: string;
  callType: 'audio' | 'video';
  onExpand: () => void;
  onEnd: () => void;
}

export const MinimizedCallPill: React.FC<MinimizedCallPillProps> = ({
  peerName,
  callType,
  onExpand,
  onEnd
}) => {
  return (
    <div className="w-full flex justify-center py-2 absolute top-0 left-0 right-0 z-40 px-4 animate-in slide-in-from-top duration-500">
      <div className="w-full max-w-lg glass rounded-2xl border border-[#39FF14]/30 bg-[#1F2329]/90 px-4 py-2.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#39FF14]/20 flex items-center justify-center text-[#39FF14]">
             {callType === 'video' ? <Video size={14} /> : <Mic size={14} />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white uppercase tracking-tight">{peerName}</span>
            <span className="text-[8px] font-black text-[#39FF14] uppercase tracking-widest animate-pulse">Neural Session Active</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onExpand}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <Maximize2 size={16} />
          </button>
          <button 
            onClick={onEnd}
            className="p-2 bg-[#EF4444]/20 text-[#EF4444] hover:bg-[#EF4444] hover:text-white rounded-lg transition-all"
          >
            <PhoneOff size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
