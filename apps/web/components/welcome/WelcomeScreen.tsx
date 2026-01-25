
import React from 'react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onViewPlans: () => void;
  sessionExpired?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onSignIn,
  onViewPlans,
  sessionExpired
}) => {
  return (
    <div className="min-h-screen bg-[#2B2F36] flex items-center justify-center p-6 selection:bg-[#007BFF]/30 overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#007BFF]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[480px] h-full md:h-auto flex flex-col justify-between md:justify-center items-center gap-12 animate-in fade-in duration-1000">
        
        {sessionExpired && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-[320px] bg-[#EF4444]/10 border border-[#EF4444]/30 px-4 py-2 rounded-xl text-center animate-in slide-in-from-top-4">
            <span className="text-[10px] font-black text-[#EF4444] uppercase tracking-widest">Session expired. Please sign in.</span>
          </div>
        )}

        <div className="flex flex-col items-center gap-6 mt-12 md:mt-0">
          <div className="w-20 h-20 bg-[#007BFF] rounded-[24px] flex items-center justify-center text-white text-4xl font-black italic shadow-[0_15px_40px_rgba(0,123,255,0.3)] rotate-3 hover:rotate-0 transition-transform cursor-pointer">
            M
            <span className="sr-only">App Logo</span>
          </div>
        </div>

        <div className="text-center space-y-4 px-4">
          <h1 className="text-[18px] md:text-[24px] font-black text-[#FFFFFF] leading-tight tracking-tight italic uppercase">
            Real-Time Translation. Anywhere.
          </h1>
          <p className="text-[14px] md:text-[16px] font-bold text-[#9CA3AF] uppercase tracking-widest leading-relaxed">
            For Business, Freelance & <br className="hidden md:block"/> Cross-Border Teams
          </p>
        </div>

        <div className="w-full space-y-4 mb-12 md:mb-0">
          <button
            onClick={onGetStarted}
            className="w-full md:w-[320px] mx-auto h-[48px] bg-[#007BFF] hover:bg-blue-600 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_10px_30px_rgba(0,123,255,0.2)] active:scale-95 block"
          >
            Get Started Free
          </button>

          <button
            onClick={onSignIn}
            className="w-full md:w-[320px] mx-auto h-[48px] bg-transparent border border-[#3A3F47] hover:border-white/20 hover:bg-white/5 text-[#FFFFFF] font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 block"
          >
            Sign In
          </button>

          <div className="text-center pt-4">
            <button
              onClick={onViewPlans}
              className="text-[14px] font-black text-[#007BFF] uppercase tracking-widest hover:underline underline-offset-8 transition-all"
            >
              View Plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
