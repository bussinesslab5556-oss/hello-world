
import React, { useState, useEffect } from 'react';
import { profileService } from '../../../../packages/services/profile-service.ts';
import { Profile, IndustryMode, ToneControl } from '../../../../packages/types/profile.ts';
import { Cpu, Brain, Layers } from 'lucide-react';

const INDUSTRIES: IndustryMode[] = ['General', 'Business', 'Freelance', 'Legal', 'Medical', 'Tech'];
const TONES: ToneControl[] = ['Professional', 'Casual', 'Formal', 'Negotiation'];

export const AIConfig: React.FC<{ userId: string }> = ({ userId }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const data = await profileService.getProfile(userId);
      if (data) setProfile(data);
    };
    fetch();
  }, [userId]);

  const update = async (key: keyof Profile, value: any) => {
    setSaving(true);
    const res = await profileService.updateProfile(userId, { [key]: value });
    if (res.success) setProfile(prev => prev ? { ...prev, [key]: value } : null);
    setSaving(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#39FF14]/10 flex items-center justify-center text-[#39FF14]">
            <Brain size={16} />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Neural Context</h3>
        </div>
        {saving && <span className="text-[10px] font-black text-[#39FF14] animate-pulse uppercase tracking-widest italic">Optimizing...</span>}
      </div>

      <div className="space-y-8">
        {/* Industry Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Layers size={14} className="text-[#9CA3AF]" />
            <span className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Industry Intelligence</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {INDUSTRIES.map(mode => (
              <button
                key={mode}
                onClick={() => update('industry_mode', mode)}
                className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                  ${profile?.industry_mode === mode 
                    ? 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.1)]' 
                    : 'bg-[#2B2F36] border-[#3A3F47] text-[#9CA3AF] hover:border-white/20'
                  }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Tone Control */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Cpu size={14} className="text-[#9CA3AF]" />
            <span className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Linguistic Tone</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map(tone => (
              <button
                key={tone}
                onClick={() => update('tone_control', tone)}
                className={`py-3.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-between
                  ${profile?.tone_control === tone 
                    ? 'bg-[#007BFF]/20 border-[#007BFF] text-[#007BFF] shadow-[0_0_15px_rgba(0,123,255,0.1)]' 
                    : 'bg-[#2B2F36] border-[#3A3F47] text-[#9CA3AF] hover:border-white/20'
                  }`}
              >
                {tone}
                {profile?.tone_control === tone && <div className="w-1.5 h-1.5 rounded-full bg-[#007BFF] shadow-[0_0_8px_#007BFF]" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
        <p className="text-[9px] font-bold text-[#9CA3AF] uppercase leading-relaxed text-center tracking-widest">
          AI Context settings are injected into the <span className="text-white italic">Neural Processing Engine</span> for real-time translation optimization.
        </p>
      </div>
    </div>
  );
};
