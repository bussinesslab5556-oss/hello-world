
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, VolumeX, MoreHorizontal, Info } from 'lucide-react';

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
  const [canSwitchSpeaker, setCanSwitchSpeaker] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Check for setSinkId (Hardware Output Switching)
    const isSupported = 'setSinkId' in HTMLMediaElement.prototype;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // On mobile web, setSinkId exists sometimes but doesn't work for hardware speaker vs earpiece
    if (isMobile) {
      setCanSwitchSpeaker(false);
    } else {
      setCanSwitchSpeaker(isSupported);
    }
  }, []);

  return (
    <div className="flex items-center gap-6 animate-in slide-in-from-bottom-12 duration-700">
      
      {/* 1. Mute Button (Circular 56px) */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onToggleMic}
          className={`w-[56px] h-[56px] rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 border
            ${isMuted 
              ? 'bg-[#EF4444] border-[#EF4444] shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
              : 'bg-[#3A3F47] border-white/5 hover:bg-white/10'
            }`}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
        </button>
        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">{isMuted ? 'Unmute' : 'Mute'}</span>
      </div>

      {/* 2. Speaker Button (Circular 56px) */}
      <div className="flex flex-col items-center gap-2 relative">
        {!canSwitchSpeaker && (
          <button 
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-[#F59E0B] rounded-full flex items-center justify-center text-black shadow-lg border-2 border-[#1A1D23] z-10 animate-in zoom-in"
          >
            <Info size={10} strokeWidth={3} />
          </button>
        )}

        {showTooltip && (
          <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-40 glass p-3 rounded-xl border border-white/10 text-[9px] font-black text-white uppercase tracking-widest text-center shadow-2xl animate-in fade-in slide-in-from-bottom-2">
            Output controlled by OS on this platform.
          </div>
        )}

        <button
          onClick={onToggleSpeaker}
          className={`w-[56px] h-[56px] rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 border
            ${isSpeakerOn 
              ? 'bg-[#007BFF] border-[#007BFF] shadow-[0_0_20px_rgba(0,123,255,0.3)]' 
              : 'bg-[#3A3F47] border-white/5 hover:bg-white/10'
            } ${!canSwitchSpeaker ? 'opacity-60 cursor-not-allowed' : ''}`}
          aria-label="Toggle speaker"
        >
          {isSpeakerOn ? <Volume2 size={24} className="text-white" /> : <VolumeX size={24} className="text-white" />}
        </button>
        <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Speaker</span>
      </div>

      {/* 3. End Call Button (Oval 64x120) */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onEndCall}
          className="w-[120px] h-[64px] bg-[#EF4444] text-white rounded-full flex items-center justify-center hover:bg-[#ff3b3b] transition-all hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(239,68,68,0.5)] border border-white/20 group"
          aria-label="End call"
        >
          <PhoneOff size={28} className="group-hover:-rotate-[135deg] transition-transform duration-500" />
        </button>
        <span className="text-[10px] font-black text-white uppercase tracking-widest">End</span>
      </div>
    </div>
  );
};
