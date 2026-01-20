
import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, VolumeX, MoreHorizontal } from 'lucide-react';

interface CallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleSpeaker: () => void;
  onEndCall: () => void;
  callType: 'audio' | 'video';
}

export const CallControls: React.FC<CallControlsProps> = ({
  isMuted,
  isVideoOff,
  isSpeakerOn,
  onToggleMic,
  onToggleVideo,
  onToggleSpeaker,
  onEndCall,
  callType
}) => {
  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 glass rounded-[44px] shadow-[0_25px_80px_rgba(0,0,0,0.9)] z-[120] animate-in slide-in-from-bottom-12 duration-700 border border-white/10">
      
      {/* 1. Menu (...) */}
      <button
        className="p-4 rounded-[28px] bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all active:scale-90 border border-white/5"
      >
        <MoreHorizontal size={22} />
      </button>

      {/* 2. Video Toggle */}
      <button
        onClick={onToggleVideo}
        className={`p-4 rounded-[28px] transition-all duration-300 hover:scale-105 active:scale-90 border
          ${isVideoOff 
            ? 'bg-white/5 text-white/40 border-white/5' 
            : 'bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/30 shadow-[0_0_20px_rgba(57,255,20,0.2)]'
          }`}
      >
        {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
      </button>

      {/* 3. Speaker Toggle */}
      <button
        onClick={onToggleSpeaker}
        className={`p-4 rounded-[28px] transition-all duration-300 hover:scale-105 active:scale-90 border
          ${!isSpeakerOn 
            ? 'bg-white/5 text-white/40 border-white/5' 
            : 'bg-white/10 text-white border-white/10'
          }`}
      >
        {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
      </button>

      {/* 4. Mute Toggle */}
      <button
        onClick={onToggleMic}
        className={`p-4 rounded-[28px] transition-all duration-300 hover:scale-105 active:scale-90 border
          ${isMuted 
            ? 'bg-white/5 text-white/40 border-white/5' 
            : 'bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/30 shadow-[0_0_20px_rgba(57,255,20,0.2)]'
          }`}
      >
        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
      </button>

      {/* Separator */}
      <div className="w-px h-10 bg-white/10 mx-2"></div>

      {/* 5. End Call Button */}
      <button
        onClick={onEndCall}
        className="p-5 bg-[#EF4444] text-white rounded-[28px] hover:bg-[#ff3b3b] transition-all hover:scale-110 active:scale-90 shadow-[0_10px_40px_rgba(239,68,68,0.5)] border border-white/20 group"
      >
        <PhoneOff size={26} fill="currentColor" className="group-hover:-rotate-[135deg] transition-transform duration-500" />
      </button>
    </div>
  );
};
