
import React, { useState, useEffect } from 'react';
import { profileService } from '../../../services/profile-service.ts';
import { IndustryMode, ToneControl, Profile } from '../../../types/profile.ts';

const INDUSTRIES: IndustryMode[] = ['General', 'Business', 'Freelance', 'Legal', 'Medical', 'Tech'];
const TONES: ToneControl[] = ['Professional', 'Casual', 'Formal', 'Negotiation'];

export const PreferenceSettings: React.FC<{ userId: string }> = ({ userId }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const data = await profileService.getProfile(userId);
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);

  const handleUpdate = async (updates: Partial<Profile>) => {
    setSaving(true);
    setSuccess(false);
    const result = await profileService.updateProfile(userId, updates);
    if (result.success) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="w-full max-w-[540px] h-[400px] bg-[#1F2329] rounded-[32px] border border-[#3A3F47] flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-[#007BFF] border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="w-full max-w-[540px] bg-[#1F2329] rounded-[32px] overflow-hidden border border-[#3A3F47] shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="p-10">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter italic">AI Context</h2>
            <p className="text-xs text-[#9CA3AF] font-bold uppercase tracking-widest mt-1">Refine Translation Engine</p>
          </div>
          {success && (
            <div className="bg-[#39FF14]/10 text-[#39FF14] px-4 py-2 rounded-full border border-[#39FF14]/20 text-[10px] font-black uppercase tracking-tighter animate-bounce">
              Config Updated
            </div>
          )}
        </div>

        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#007BFF]/10 flex items-center justify-center text-[#007BFF]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Industry Mode</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {INDUSTRIES.map((industry) => (
                <button
                  key={industry}
                  onClick={() => handleUpdate({ industry_mode: industry })}
                  className={`px-3 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    profile?.industry_mode === industry
                      ? 'bg-[#007BFF] border-[#007BFF] text-white shadow-[0_0_20px_rgba(0,123,255,0.3)]'
                      : 'bg-[#2B2F36] border-[#3A3F47] text-[#9CA3AF] hover:border-[#9CA3AF]'
                  }`}
                >
                  {industry}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#39FF14]/10 flex items-center justify-center text-[#39FF14]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Linguistic Tone</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TONES.map((tone) => (
                <button
                  key={tone}
                  onClick={() => handleUpdate({ tone_control: tone })}
                  className={`flex items-center justify-between px-6 py-5 rounded-2xl transition-all border ${
                    profile?.tone_control === tone
                      ? 'bg-white/5 border-[#39FF14] text-white shadow-[0_0_20px_rgba(57,255,20,0.1)]'
                      : 'bg-[#2B2F36] border-[#3A3F47] text-[#9CA3AF] hover:border-[#9CA3AF]'
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-widest">{tone}</span>
                  {profile?.tone_control === tone && (
                    <div className="w-2 h-2 rounded-full bg-[#39FF14] shadow-[0_0_10px_#39FF14]"></div>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="px-10 py-8 bg-[#2B2F36]/50 border-t border-[#3A3F47] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#007BFF] animate-pulse"></div>
          <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest italic">
            Azure Neural Engine: <span className="text-white">Active</span>
          </p>
        </div>
        {saving && (
          <span className="text-[10px] font-black text-[#007BFF] uppercase tracking-widest animate-pulse">
            Syncing...
          </span>
        )}
      </div>
    </div>
  );
};
