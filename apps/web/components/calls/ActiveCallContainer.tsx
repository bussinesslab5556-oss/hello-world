
import React, { useEffect, useState } from 'react';
import { CallControls } from './CallControls.tsx';
import { audioBridgeService } from '../../../../packages/services/audio-bridge-service.ts';
import { ChevronDown, Lock, UserPlus } from 'lucide-react';

const useHMSActions = () => ({ 
    leave: () => {}, 
    setLocalAudioEnabled: (e: boolean) => {}, 
    setLocalVideoEnabled: (e: boolean) => {} 
});

interface ActiveCallContainerProps {
  userId: string;
  callType: 'audio' | 'video';
  recipientName: string;
  recipientAvatar?: string;
  targetLanguage?: string;
  onEnd: () => void;
  onMinimize: () => void;
  onQuotaLimit: () => void;
}

export const ActiveCallContainer: React.FC<ActiveCallContainerProps> = ({
  userId,
  callType,
  recipientName,
  recipientAvatar,
  targetLanguage = 'es',
  onEnd,
  onMinimize,
  onQuotaLimit
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isEntering, setIsEntering] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const actions = useHMSActions();

  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 1500);
    const interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    
    audioBridgeService.startTranslationBridge(
      userId,
      targetLanguage,
      actions,
      onQuotaLimit
    );

    return () => {
      audioBridgeService.stopTranslationBridge();
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [userId, targetLanguage]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    actions.leave();
    onEnd();
  };

  if (isEntering) {
    return (
      <div className="fixed inset-0 bg-[#0B141A] z-[9999] flex flex-col items-center justify-center">
        <div className="relative mb-10">
          <div className="w-24 h-24 rounded-[40px] bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14] shadow-[0_0_50px_rgba(57,255,20,0.2)]">
            <span className="text-4xl font-black italic">N</span>
          </div>
          <div className="absolute -inset-4 border border-[#39FF14]/40 rounded-[48px] animate-ping opacity-20"></div>
        </div>
        <h2 className="text-xs font-black text-white uppercase tracking-[0.8em] animate-pulse italic">Connecting Frequency</h2>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0B141A] z-[9999] flex flex-col items-center justify-center overflow-hidden">
      {/* THEMED BACKGROUND LAYERS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Layer 1: Blurred Avatar Reflection */}
        <div className="absolute inset-0 opacity-20 blur-[140px] scale-150">
          {recipientAvatar ? (
            <img src={recipientAvatar} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#007BFF] to-[#39FF14]"></div>
          )}
        </div>
        {/* Layer 2: Doodle Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
        {/* Layer 3: Dark Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* TOP HEADER */}
      <header className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-[110]">
        <button 
          onClick={onMinimize}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group"
        >
          <ChevronDown className="text-white group-hover:translate-y-1 transition-transform" size={24} />
        </button>
        
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 opacity-40">
            <Lock size={10} className="text-white" />
            <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">End-to-End Encrypted</span>
          </div>
          <span className="text-[11px] font-black text-white/60 tracking-widest">{formatTime(callDuration)}</span>
        </div>

        <button className="p-3 bg-white/5 hover:bg-[#39FF14]/20 rounded-2xl transition-all border border-white/5 text-white hover:text-[#39FF14]">
          <UserPlus size={24} />
        </button>
      </header>

      {/* MAIN VIEWPORT */}
      <div className="relative w-full h-full flex items-center justify-center p-6 md:p-12">
        {callType === 'video' && !isVideoOff ? (
          <div className="w-full h-full max-w-6xl relative flex items-center justify-center">
            {/* Main Remote Stream Container */}
            <div className="w-full h-full glass rounded-[48px] overflow-hidden border border-white/5 relative shadow-2xl transition-all duration-700">
              <div className="w-full h-full bg-[#1F2329] flex items-center justify-center">
                 <div className="flex flex-col items-center gap-6">
                    <div className="w-32 h-32 rounded-full border-4 border-[#39FF14]/20 p-1">
                      <div className="w-full h-full rounded-full bg-[#0B141A] flex items-center justify-center overflow-hidden">
                         {recipientAvatar ? <img src={recipientAvatar} className="w-full h-full object-cover" /> : <span className="text-4xl font-black text-white italic">{recipientName[0]}</span>}
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{recipientName}</h3>
                 </div>
              </div>
              
              {/* Local Video PiP (Top Right) */}
              <div className="absolute top-10 right-10 w-44 h-64 glass rounded-[32px] border border-[#39FF14]/40 overflow-hidden shadow-2xl z-20 animate-in zoom-in slide-in-from-top-10 duration-700">
                <div className="w-full h-full bg-[#0B141A] flex items-center justify-center relative">
                   <div className="w-full h-full bg-gradient-to-t from-[#007BFF]/20 to-transparent"></div>
                   <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
                     <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Local Neural Node</span>
                   </div>
                   <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14]"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* AUDIO HERO SECTION */
          <div className="flex flex-col items-center gap-12">
            <div className="relative">
              {/* Pulsating Ring tied to Voice Intensity (Mocked animate-pulse) */}
              <div className="absolute inset-0 bg-[#39FF14] rounded-full blur-[100px] opacity-10 animate-pulse"></div>
              <div className="absolute -inset-8 border-4 border-[#39FF14]/20 rounded-full animate-[ping_4s_ease-in-out_infinite]"></div>
              
              <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-full border-[12px] border-[#1F2329] p-2 bg-[#0B141A] shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden border-[6px] transition-all duration-500 shadow-inner
                  ${isMuted ? 'border-white/10' : 'border-[#39FF14]/60'}`}>
                  {recipientAvatar ? (
                    <img src={recipientAvatar} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-8xl font-black text-white italic drop-shadow-2xl">{recipientName.charAt(0)}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic uppercase drop-shadow-2xl">{recipientName}</h2>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                   <span className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse shadow-[0_0_8px_#39FF14]"></span>
                   <p className="text-[#39FF14] text-[11px] font-black uppercase tracking-[0.5em] italic">Neural Sync Connected</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5-BUTTON CONTROL DOCK */}
      <CallControls
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isSpeakerOn={isSpeakerOn}
        onToggleMic={() => { setIsMuted(!isMuted); actions.setLocalAudioEnabled(isMuted); }}
        onToggleVideo={() => { setIsVideoOff(!isVideoOff); actions.setLocalVideoEnabled(isVideoOff); }}
        onToggleSpeaker={() => setIsSpeakerOn(!isSpeakerOn)}
        onEndCall={handleEndCall}
        callType={callType}
      />
    </div>
  );
};
