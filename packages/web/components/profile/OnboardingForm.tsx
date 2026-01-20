import React, { useState, useMemo } from 'react';
import { Camera, Search, X, Check, ArrowRight } from 'lucide-react';
import { profileService } from '../../../services/profile-service.ts';

const POPULAR_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'zh', name: 'Mandarin', native: '普通话' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'fr', name: 'French', native: 'Français' },
];

const ALL_LANGUAGES = [
  ...POPULAR_LANGUAGES,
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
].sort((a, b) => a.name.localeCompare(b.name));

interface OnboardingFormProps {
  userId: string;
  onComplete: () => void;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ userId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1 State
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Step 2 State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const filteredLanguages = useMemo(() => {
    if (!searchQuery) return ALL_LANGUAGES;
    return ALL_LANGUAGES.filter(lang => 
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lang.native.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Use JPG or PNG');
      return;
    }

    setError(null);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      setLoading(true);
      try {
        const result = await profileService.updateProfile(userId, {
          full_name: fullName,
          username: displayName || fullName.toLowerCase().replace(/\s+/g, '_'),
          primary_language: selectedLanguage!,
          avatar_url: avatarPreview,
        });

        if (result.success) {
          onComplete();
        } else {
          setError(result.error || 'Failed to save. Retry?');
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to save. Retry?');
        setLoading(false);
      }
    }
  };

  const handleSkip = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white md:bg-transparent flex flex-col items-center justify-center animate-in fade-in duration-500">
      <div className="w-full max-w-[520px] bg-white min-h-screen md:min-h-0 md:rounded-[32px] md:shadow-xl md:my-12 flex flex-col relative overflow-hidden">
        
        {/* Progress Header */}
        <div className="px-6 pt-6 flex items-center justify-between">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${step === s ? 'bg-[#007BFF] w-6' : 'bg-[#E5E7EB]'}`}
              />
            ))}
          </div>
          <span className="text-[12px] font-medium text-[#9CA3AF]">Step {step} of 3</span>
          {step === 1 && (
            <button 
              onClick={handleSkip}
              className="absolute top-6 right-6 text-sm font-bold text-[#007BFF] hover:underline"
            >
              Skip
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 px-8 py-10 flex flex-col">
          {step === 1 && (
            <div className="animate-in slide-in-from-right-8 duration-500 flex-1 flex flex-col">
              <h1 className="text-[24px] font-bold text-[#1F2937] mb-2">Set Up Your Profile</h1>
              <p className="text-[14px] text-[#9CA3AF] mb-10">Help others recognize you</p>

              <div className="flex flex-col items-center mb-10">
                <div className="relative group">
                  <div className="w-[120px] h-[120px] rounded-full bg-[#E5E7EB] flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-[#007BFF] transition-all">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={40} className="text-[#9CA3AF]" />
                    )}
                  </div>
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 rounded-full transition-opacity">
                    <input type="file" className="hidden" accept="image/png,image/jpeg" onChange={handleImageChange} />
                  </label>
                </div>
                {avatarPreview && (
                  <button 
                    onClick={() => setAvatarPreview(null)}
                    className="mt-4 text-[12px] font-bold text-[#007BFF] hover:underline"
                  >
                    Change Photo
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text"
                    maxLength={50}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#007BFF] outline-none transition-all text-[#1F2937]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">Display Name (Optional)</label>
                  <input 
                    type="text"
                    maxLength={30}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Johnny"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#007BFF] outline-none transition-all text-[#1F2937]"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-8 duration-500 flex-1 flex flex-col">
              <h1 className="text-[24px] font-bold text-[#1F2937] mb-2">Choose Your Language</h1>
              <p className="text-[14px] text-[#9CA3AF] mb-8">We'll translate messages to this language by default</p>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search languages..."
                  className="w-full h-12 pl-12 pr-12 rounded-xl bg-gray-50 border border-gray-100 focus:border-[#007BFF] outline-none transition-all text-[#1F2937]"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1F2937]"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto max-h-[360px] pr-2 custom-scrollbar space-y-2">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={`w-full p-4 rounded-xl flex items-center justify-between transition-all group ${selectedLanguage === lang.code ? 'bg-[#007BFF]/10 border-[#007BFF]' : 'hover:bg-gray-50 border border-transparent'}`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-[#1F2937]">{lang.name}</span>
                        <span className="text-[12px] text-[#9CA3AF]">{lang.native}</span>
                      </div>
                      {selectedLanguage === lang.code && <Check className="text-[#007BFF]" size={20} />}
                    </button>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-[14px] text-[#9CA3AF]">No languages found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-right-8 duration-500 flex-1 flex flex-col items-center text-center">
              <h1 className="text-[24px] font-bold text-[#1F2937] mb-2">You're on the Free Plan</h1>
              <p className="text-[14px] text-[#9CA3AF] mb-10 leading-relaxed">
                Start with 2M characters of translation, 100 minutes of calls, and 500MB storage per month.
              </p>

              <div className="w-full p-8 rounded-[32px] border-2 border-[#E5E7EB] relative mb-8">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#39FF14] rounded-full text-[10px] font-black text-[#1F2937] tracking-widest">
                  FREE
                </div>
                
                <ul className="space-y-4 text-left">
                  {[
                    '2M translation characters/month',
                    '100 minutes of calls/month',
                    '500MB cloud storage'
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#39FF14]/20 flex items-center justify-center text-[#39FF14]">
                        <Check size={14} strokeWidth={4} />
                      </div>
                      <span className="text-sm font-medium text-[#1F2937]">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button className="text-[#007BFF] text-sm font-bold hover:underline mb-10">
                See All Plans
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl flex items-center justify-between group animate-in shake duration-500">
              <span className="text-xs font-bold text-[#EF4444]">{error}</span>
              <button onClick={() => setError(null)} className="text-[#EF4444]/60 hover:text-[#EF4444]">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="mt-auto pt-10">
            <button
              onClick={handleNext}
              disabled={(step === 1 && !fullName) || (step === 2 && !selectedLanguage) || loading}
              className={`w-full h-12 bg-[#007BFF] disabled:bg-[#E5E7EB] text-white font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? 'Processing...' : step === 3 ? 'Get Started' : 'Continue'}
              {step !== 3 && !loading && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};