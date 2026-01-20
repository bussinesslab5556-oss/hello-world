
import React, { useState, useEffect } from 'react';
import { profileService } from '../../../../packages/services/profile-service.ts';
import { Profile } from '../../../../packages/types/index.ts';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'ar', name: 'Arabic' },
];

export const OnboardingForm: React.FC<{ userId: string; onComplete: () => void }> = ({ userId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    primaryLanguage: 'en',
    secondaryLanguage: '',
    avatarFile: null as File | null,
    avatarPreview: null as string | null,
  });

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ 
        ...prev, 
        avatarFile: file,
        avatarPreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await profileService.updateProfile(userId, {
        username: formData.username,
        full_name: formData.fullName,
        primary_language: formData.primaryLanguage,
        secondary_language: formData.secondaryLanguage || null,
        // photo_url logic would go here in Chapter 6 (Storage)
      });

      if (result.success) {
        onComplete();
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] bg-[#1F2329] rounded-[32px] overflow-hidden border border-[#3A3F47] shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-[#2B2F36] flex">
        <div 
          className="h-full bg-[#007BFF] transition-all duration-500 shadow-[0_0_10px_#007BFF]" 
          style={{ width: `${(step / 2) * 100}%` }}
        />
      </div>

      <div className="p-10 pt-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Setup Profile</h2>
            <p className="text-xs text-[#9CA3AF] font-bold uppercase tracking-widest mt-1">Personalize Your Identity</p>
          </div>
          <span className="text-[10px] font-black bg-[#2B2F36] text-[#9CA3AF] px-3 py-1 rounded-full border border-[#3A3F47]">
            STEP {step} / 2
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {step === 1 ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-full border-4 border-[#3A3F47] bg-[#2B2F36] overflow-hidden flex items-center justify-center transition-all group-hover:border-[#007BFF]">
                    {formData.avatarPreview ? (
                      <img src={formData.avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-12 h-12 text-[#3A3F47]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-9 h-9 bg-[#007BFF] rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-blue-600 transition-colors border-4 border-[#1F2329]">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
                <p className="text-[10px] font-bold text-[#9CA3AF] mt-3 uppercase tracking-widest">Profile Image</p>
              </div>

              {/* Name Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest px-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full bg-[#2B2F36] border border-[#3A3F47] rounded-xl px-4 py-3.5 text-white placeholder-gray-600 outline-none focus:border-[#007BFF] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest px-1">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] font-bold">@</span>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                      placeholder="username"
                      className="w-full bg-[#2B2F36] border border-[#3A3F47] rounded-xl pl-9 pr-4 py-3.5 text-white placeholder-gray-600 outline-none focus:border-[#007BFF] transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-[#2B2F36] hover:bg-[#3A3F47] text-white font-bold py-4 rounded-xl transition-all border border-[#3A3F47] flex items-center justify-center gap-2 group"
              >
                Next Step
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest px-1">I speak</label>
                  <select
                    value={formData.primaryLanguage}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryLanguage: e.target.value }))}
                    className="w-full bg-[#2B2F36] border border-[#3A3F47] rounded-xl px-4 py-3.5 text-white outline-none focus:border-[#007BFF] appearance-none transition-all cursor-pointer"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest px-1">Translate to</label>
                  <select
                    value={formData.secondaryLanguage}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryLanguage: e.target.value }))}
                    className="w-full bg-[#2B2F36] border border-[#3A3F47] rounded-xl px-4 py-3.5 text-white outline-none focus:border-[#007BFF] appearance-none transition-all cursor-pointer"
                  >
                    <option value="">None (Mono-lingual)</option>
                    {LANGUAGES.filter(l => l.code !== formData.primaryLanguage).map(l => (
                      <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-[#EF4444] text-xs font-bold text-center">{error}</p>}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-transparent hover:bg-white/5 text-[#9CA3AF] font-bold py-4 rounded-xl transition-all border border-[#3A3F47]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-[#007BFF] hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="px-10 py-6 bg-[#2B2F36]/50 border-t border-[#3A3F47] flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#39FF14] shadow-[0_0_10px_#39FF14]"></div>
        <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">
          Cloudflare R2 Storage Node: <span className="text-[#39FF14]">Ready</span>
        </p>
      </div>
    </div>
  );
};
