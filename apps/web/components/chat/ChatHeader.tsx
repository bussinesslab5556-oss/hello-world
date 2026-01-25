import React, { useState, useEffect } from 'react';
import { TranslationToggle } from './TranslationToggle.tsx';
import { Phone, Video, MoreVertical, ShieldCheck, Settings2, Sparkles } from 'lucide-react';
import { profileService } from '../../../../packages/services/profile-service.ts';
import { IndustryMode, ToneControl } from '../../../../packages/types/profile.ts';

interface ChatHeaderProps {
  recipientName: string;
  userId: string;
  isTranslationEnabled: boolean;
  onToggleTranslation: (val: boolean) => void;
  targetLanguage: string;
  onLanguageChange: (lang: string) => void;
  isNearLimit?: boolean;
  onStartCall?: (type: 'audio' | 'video') => void;
}

const INDUSTRIES: IndustryMode[] = ['General', 'Business', 'Freelance', 'Legal', 'Medical', 'Tech'];
const TONES: ToneControl[] = ['Professional', 'Casual', 'Formal', 'Negotiation'];

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  recipientName,
  userId,
  isTranslationEnabled,
  onToggleTranslation,
  targetLanguage,
  onLanguageChange,
  isNearLimit,
  onStartCall
}) => {
  const [isConnecting, setIsConnecting] = useState<'audio' | 'video' | null>(null);
  const [showAIControls, setShowAIControls] = useState(false);
  const [industry, setIndustry] = useState<IndustryMode>('General');
  const [tone, setTone] = useState<ToneControl>('Professional');

  useEffect(() => {
    const fetchProfile = async () => {
      const profile = await profileService.getProfile(userId);
      if (profile) {
        setIndustry(profile.industry_mode || 'General');
        setTone(profile.tone_control || 'Professional');
      }
    };
    fetchProfile();
  }, [userId]);

  const updateAIConfig = async (key: 'industry_mode' | 'tone_control', value: any) => {
    if (key === 'industry_mode') setIndustry(value);
    else setTone(value);
    await profileService.updateProfile(userId, { [key]: value });
  };

  const startCall = (type: 'audio' | 'video') => {
    setIsConnecting(type);
    setTimeout(() => {
      onStartCall?.(type);
      setIsConnecting(null);
    }, 800);
  };

  return (
    <div className="flex flex-col shrink-0 z-50">
      <header className="px-6 py-4 bg-[#2B2F36] border-b border-[#3A3F47] flex items-center justify-between relative shadow-lg">
        
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
        
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3">
            <TranslationToggle 
              isEnabled={isTranslationEnabled} 
              onToggle={onToggleTranslation}
              isNearLimit={isNearLimit}
            />
            <button 
              onClick={() => setShowAIControls(!showAIControls)}
              className={`p-2.5 rounded-xl transition-all ${showAIControls ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <Settings2 size={20} />
            </button>
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

      {/* Expanded AI Context Controls */}
      {showAIControls && (
        <div className="bg-[#1F2329] border-b border-[#3A3F47] px-6 py-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Sparkles size={14} className="text-[#39FF14]" />
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Neural Strategy:</span>
            </div>
            
            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] font-black text-[#9CA3AF] uppercase tracking-widest px-1">Domain</label>
                <select 
                  value={industry}
                  onChange={(e) => updateAIConfig('industry_mode', e.target.value)}
                  className="bg-[#2B2F36] border border-white/5 text-[10px] font-black text-white uppercase px-3 py-1.5 rounded-lg outline-none focus:border-[#007BFF] cursor-pointer"
                >
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] font-black text-[#9CA3AF] uppercase tracking-widest px-1">Tone</label>
                <select 
                  value={tone}
                  onChange={(e) => updateAIConfig('tone_control', e.target.value)}
                  className="bg-[#2B2F36] border border-white/5 text-[10px] font-black text-white uppercase px-3 py-1.5 rounded-lg outline-none focus:border-[#39FF14] cursor-pointer"
                >
                  {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};