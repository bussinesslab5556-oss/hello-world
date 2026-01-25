import React, { useEffect, useState, useMemo } from 'react';
import { CallControls } from './CallControls.tsx';
import { audioBridgeService } from '../../../../packages/services/audio-bridge-service.ts';
import { profileService } from '../../../../packages/services/profile-service.ts';
import { usageService } from '../../../../packages/services/usage-service.ts';
import { 
  useHMSActions, 
  useHMSStore,
  useDevices,
} from '@100mslive/react-sdk';
import * as HMS from '@100mslive/hms-video-store';
import { 
  ChevronDown, 
  Lock, 
  UserPlus, 
  Globe, 
  Sparkles, 
  Signal, 
  AlertTriangle,
  Info,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { IndustryMode, ToneControl } from '../../../../packages/types/profile.ts';

const INDUSTRIES: IndustryMode[] = ['General', 'Business', 'Freelance', 'Legal', 'Medical', 'Tech'];
const TONES: ToneControl[] = ['Professional', 'Casual', 'Formal', 'Negotiation'];

interface ActiveCallContainerProps {
  userId: string;
  callType: 'audio' | 'video';
  recipientName: string;
  recipientAvatar?: string;
  targetLanguage?: string;
  onEnd: () => void;
  onMinimize: () => void;
}

export const ActiveCallContainer: React.FC<ActiveCallContainerProps> = ({
  userId,
  callType,
  recipientName,
  recipientAvatar,
  targetLanguage = 'es',
  onEnd,
  onMinimize
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isEntering, setIsEntering] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isTranslationOn, setIsTranslationOn] = useState(false);
  const [industry, setIndustry] = useState<IndustryMode>('General');
  const [tone, setTone] = useState<ToneControl>('Professional');
  const [usageWarning, setUsageWarning] = useState<string | null>(null);
  const [showStatsDetails, setShowStatsDetails] = useState(false);
  const [sdkStatus, setSdkStatus] = useState<'syncing' | 'ready' | 'error'>('syncing');
  const [sdkErrorMsg, setSdkErrorMsg] = useState<string | null>(null);
  
  const actions = useHMSActions();
  const { allDevices, selectedDeviceIDs } = useDevices();
  
  // Safe Selector Access via HMS Namespace to prevent SyntaxErrors
  const localPeer = useHMSStore(HMS.selectLocalPeer || (() => null));
  const localPeerStats = useHMSStore(HMS.selectLocalPeerStats || (() => null));
  const connectionQuality = useHMSStore(HMS.selectConnectionQuality || (() => null));

  // Synchronization Watchdog
  useEffect(() => {
    if (localPeer) {
      setSdkStatus('ready');
      setSdkErrorMsg(null);
    } else {
      setSdkStatus('syncing');
    }
  }, [localPeer]);

  // Handle SDK Failures
  useEffect(() => {
    if (!HMS.selectLocalPeerStats) {
      console.warn('SDK Warning: Granular stats selector missing. Using connection quality fallback.');
    }
  }, []);

  // Connection Quality Logic
  const connectionState = useMemo(() => {
    if (!localPeer) return { label: 'Syncing', color: 'text-white/20', bars: 0, details: 'Establishing RTC link...' };

    // 1. Primary: Detailed Packet Stats (if available)
    if (localPeerStats && localPeerStats.subscribe) {
      const packetLoss = localPeerStats.subscribe?.packetsLost || 0;
      if (packetLoss > 10) return { label: 'Poor', color: 'text-[#EF4444]', bars: 1, details: `High Loss: ${packetLoss}%` };
      if (packetLoss > 2) return { label: 'Fair', color: 'text-[#F59E0B]', bars: 2, details: `Jitter detected: ${packetLoss}% loss` };
    }

    // 2. Secondary: Connection Quality Score (0-5)
    if (connectionQuality) {
      const q = connectionQuality.quality;
      if (q <= 2) return { label: 'Poor', color: 'text-[#EF4444]', bars: 1, details: 'Low Signal' };
      if (q <= 3) return { label: 'Fair', color: 'text-[#F59E0B]', bars: 2, details: 'Signal Fluctuating' };
    }

    return { label: 'Optimal', color: 'text-[#39FF14]', bars: 3, details: 'Stable Neural Link' };
  }, [localPeerStats, connectionQuality, localPeer]);

  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 1200);
    const interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    
    profileService.getProfile(userId).then(p => {
      if (p) {
        setIndustry(p.industry_mode || 'General');
        setTone(p.tone_control || 'Professional');
      }
    });

    usageService.getUserUsageSummary(userId).then(summary => {
      if (summary && summary.calls.percentage >= 80) {
        setUsageWarning(`${Math.max(0, summary.calls.limit - summary.calls.used)} mins remaining`);
      }
    });

    audioBridgeService.startTranslationBridge(
      userId,
      targetLanguage,
      actions,
      () => onEnd()
    ).catch(err => {
      setSdkStatus('error');
      setSdkErrorMsg(err.message);
    });

    return () => {
      audioBridgeService.stopTranslationBridge();
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [userId, targetLanguage]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpdateAI = async (key: 'industry_mode' | 'tone_control', value: any) => {
    if (key === 'industry_mode') setIndustry(value);
    else setTone(value);
    await profileService.updateProfile(userId, { [key]: value });
  };

  const handleEndCall = () => {
    actions.leave();
    onEnd();
  };

  const handleSpeakerToggle = async () => {
    const isSinkSupported = 'setSinkId' in HTMLMediaElement.prototype;
    if (!isSinkSupported) {
      setIsSpeakerOn(!isSpeakerOn);
      return;
    }

    try {
      const outputDevices = allDevices.audioOutput || [];
      if (outputDevices.length > 1) {
        const currentIndex = outputDevices.findIndex(d => d.deviceId === selectedDeviceIDs.audioOutput);
        const nextDevice = outputDevices[(currentIndex + 1) % outputDevices.length];
        await actions.setAudioOutputDevice(nextDevice.deviceId);
        setIsSpeakerOn(!isSpeakerOn);
      } else {
        setIsSpeakerOn(!isSpeakerOn);
      }
    } catch (err) {
      console.error('Speaker toggle failed:', err);
    }
  };

  if (isEntering) {
    return (
      <div className="fixed inset-0 bg-[#0B141A] z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="relative mb-10">
          <div className="w-24 h-24 rounded-[40px] bg-[#007BFF] flex items-center justify-center text-white shadow-[0_0_50px_rgba(0,123,255,0.3)] animate-pulse">
            <span className="text-4xl font-black italic">M</span>
          </div>
        </div>
        <h2 className="text-[10px] font-black text-white uppercase tracking-[0.8em] italic opacity-50">Initializing Neural Session</h2>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#2B2F36] to-[#1A1D23] z-[9999] flex flex-col items-center justify-between overflow-hidden text-white font-inter">
      
      {/* 1. TOP HEADER & DEBUG HUD */}
      <header className="w-full p-8 flex items-center justify-between z-[110]">
        <div className="flex items-center gap-4 relative">
          <button 
            onClick={onMinimize}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group"
          >
            <ChevronDown className="text-white group-hover:translate-y-1 transition-transform" size={20} />
          </button>
          
          <button 
            onClick={() => setShowStatsDetails(!showStatsDetails)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 hover:bg-white/10 transition-colors"
          >
            <Signal size={12} className={connectionState.color} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${connectionState.color}`}>
              {connectionState.label}
            </span>
          </button>

          {/* Neural Sync Label (UI-based logger) */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1F2329] rounded-full border border-white/5">
             <Activity size={10} className={sdkStatus === 'ready' ? 'text-[#39FF14]' : sdkStatus === 'error' ? 'text-[#EF4444]' : 'text-white/20'} />
             <span className={`text-[9px] font-black uppercase tracking-widest ${sdkStatus === 'ready' ? 'text-white/60' : sdkStatus === 'error' ? 'text-[#EF4444]' : 'text-white/20'}`}>
               {sdkStatus === 'ready' ? 'SDK Synchronized' : sdkStatus === 'error' ? `SDK Error: ${sdkErrorMsg}` : 'Link Syncing...'}
             </span>
          </div>

          {showStatsDetails && (
            <div className="absolute top-14 left-16 w-56 glass p-4 rounded-2xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-50">
               <h4 className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-2 border-b border-white/5 pb-1">Real-time Telemetry</h4>
               <p className="text-[10px] font-bold text-white mb-1">Link Status: <span className={connectionState.color}>{connectionState.label}</span></p>
               <p className="text-[10px] font-bold text-white/60">{connectionState.details}</p>
               {localPeer && (
                 <p className="text-[9px] mt-2 font-black text-[#007BFF] uppercase tracking-tighter">Node ID: {localPeer.id.substring(0, 12)}...</p>
               )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 opacity-40">
            <Lock size={10} className="text-[#39FF14]" />
            <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">Neural Encrypted</span>
          </div>
        </div>

        <button className="p-3 bg-white/5 hover:bg-[#39FF14]/20 rounded-2xl transition-all border border-white/5 text-white hover:text-[#39FF14]">
          <UserPlus size={20} />
        </button>
      </header>

      {/* 2. PARTICIPANT INFO NODE (Top Third) */}
      <div className="flex flex-col items-center gap-6 mt-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="relative group">
          <div className="absolute inset-0 bg-[#007BFF] rounded-full blur-3xl opacity-10 group-hover:opacity-30 transition-opacity"></div>
          <div className={`absolute -inset-4 border-2 rounded-full animate-[ping_4s_ease-in-out_infinite] ${isMuted ? 'border-red-500/20' : 'border-[#39FF14]/20'}`}></div>
          
          <div className="relative w-[120px] h-[120px] rounded-full border-4 border-[#3A3F47] overflow-hidden shadow-2xl bg-[#1F2329] flex items-center justify-center">
            {recipientAvatar ? (
              <img src={recipientAvatar} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-black text-white italic">{recipientName.charAt(0)}</span>
            )}
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-[20px] font-bold text-white tracking-tight uppercase italic">{recipientName}</h2>
          <p className="text-[16px] font-black text-[#9CA3AF] tracking-widest">{formatTime(callDuration)}</p>
          
          {isTranslationOn && (
            <div className="flex items-center justify-center gap-2 mt-4 animate-in zoom-in duration-300">
               <Globe size={14} className="text-[#007BFF]" />
               <span className="text-sm font-bold text-[#9CA3AF]">Translating to {targetLanguage.toUpperCase()}</span>
            </div>
          )}
        </div>

        {usageWarning && (
          <div className="mt-4 px-6 py-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-full flex items-center gap-2 animate-in zoom-in">
             <AlertTriangle size={12} className="text-[#F59E0B]" />
             <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest">{usageWarning}</span>
          </div>
        )}
      </div>

      {/* 3. TRANSLATION CONTROLS (Middle) */}
      <div className="w-full max-w-sm px-8 space-y-8 flex flex-col items-center">
        <div className="flex items-center justify-between w-full p-1.5 bg-[#1F2329] border border-white/5 rounded-2xl">
          <div className="flex items-center gap-3 pl-3">
             <Globe size={14} className={isTranslationOn ? 'text-[#007BFF]' : 'text-white/20'} />
             <span className="text-sm font-bold text-white/80">Live Translation</span>
          </div>
          <button 
            onClick={() => setIsTranslationOn(!isTranslationOn)}
            className={`w-12 h-6 rounded-full relative transition-all duration-300 border ${isTranslationOn ? 'bg-[#007BFF] border-[#007BFF]' : 'bg-[#3A3F47] border-white/10'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${isTranslationOn ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        {isTranslationOn && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col gap-2 items-center">
              <span className="text-[8px] font-black text-[#9CA3AF] uppercase tracking-widest">Domain</span>
              <select 
                value={industry}
                onChange={(e) => handleUpdateAI('industry_mode', e.target.value as IndustryMode)}
                className="bg-[#3A3F47] border border-white/10 text-[10px] font-black text-white uppercase px-4 py-2 rounded-xl outline-none focus:border-[#007BFF] cursor-pointer"
              >
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2 items-center">
              <span className="text-[8px] font-black text-[#9CA3AF] uppercase tracking-widest">Tone</span>
              <select 
                value={tone}
                onChange={(e) => handleUpdateAI('tone_control', e.target.value as ToneControl)}
                className="bg-[#3A3F47] border border-white/10 text-[10px] font-black text-white uppercase px-4 py-2 rounded-xl outline-none focus:border-[#007BFF] cursor-pointer"
              >
                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 4. ACTION BUTTONS (Bottom) */}
      <footer className="w-full pb-16 flex justify-center">
        <CallControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isSpeakerOn={isSpeakerOn}
          onToggleMic={() => { setIsMuted(!isMuted); actions.setLocalAudioEnabled(isMuted); }}
          onToggleVideo={() => { setIsVideoOff(!isVideoOff); actions.setLocalVideoEnabled(isVideoOff); }}
          onToggleSpeaker={handleSpeakerToggle}
          onEndCall={handleEndCall}
          callType={callType}
        />
      </footer>

    </div>
  );
};