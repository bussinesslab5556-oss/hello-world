
import React from 'react';

interface TranslationToggleProps {
  isEnabled: boolean;
  onToggle: (val: boolean) => void;
  isNearLimit?: boolean;
}

export const TranslationToggle: React.FC<TranslationToggleProps> = ({ 
  isEnabled, 
  onToggle, 
  isNearLimit = false 
}) => {
  return (
    <button
      onClick={() => onToggle(!isEnabled)}
      className={`
        relative flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all duration-500 group
        ${isEnabled 
          ? 'bg-[#39FF14]/10 border border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.2)]' 
          : 'bg-[#3A3F47] border border-[#4A4F57] hover:border-[#007BFF]'
        }
        ${isNearLimit && isEnabled ? 'animate-pulse-glow' : ''}
      `}
    >
      <div className={`
        w-4 h-4 rounded-full flex items-center justify-center transition-colors
        ${isEnabled ? 'text-[#39FF14]' : 'text-[#9CA3AF] group-hover:text-white'}
      `}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full">
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" strokeLinecap="round" />
        </svg>
      </div>

      <span className={`
        text-[10px] font-black uppercase tracking-widest transition-colors
        ${isEnabled ? 'text-[#39FF14]' : 'text-[#9CA3AF] group-hover:text-white'}
      `}>
        AI Translation: <span className="italic">{isEnabled ? 'ON' : 'OFF'}</span>
      </span>

      {/* Internal Toggle Switch Visual */}
      <div className={`
        w-7 h-4 rounded-full relative transition-all duration-300
        ${isEnabled ? 'bg-[#39FF14]' : 'bg-[#1F2329] border border-[#3A3F47]'}
      `}>
        <div className={`
          absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform duration-300
          ${isEnabled ? 'translate-x-3 bg-white' : 'translate-x-0 bg-[#4A4F57]'}
        `} />
      </div>

      <style>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 5px rgba(57, 255, 20, 0.2); }
          50% { box-shadow: 0 0 20px rgba(57, 255, 20, 0.5); }
          100% { box-shadow: 0 0 5px rgba(57, 255, 20, 0.2); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite ease-in-out;
        }
      `}</style>
    </button>
  );
};
