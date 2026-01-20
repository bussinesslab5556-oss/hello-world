
import React, { useEffect, useState } from 'react';
import { UsageSummary, UsageMetric } from '../../../../packages/types/index.ts';

interface RadialProgressProps {
  metric: UsageMetric;
  label: string;
  color: string;
}

const RadialProgress: React.FC<RadialProgressProps> = ({ metric, label, color }) => {
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (metric.percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4 group">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#2B2F36"
            strokeWidth={strokeWidth}
          />
          {/* Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            style={{ 
              strokeDashoffset: offset,
              filter: `drop-shadow(0 0 8px ${color}44)`
            }}
            strokeLinecap="round"
            className="transition-all duration-[1500ms] ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white">{Math.round(metric.percentage)}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] mb-1">{label}</p>
        <p className="text-xs font-bold text-white/80">
          {label === 'Storage' ? (metric.used / (1024*1024)).toFixed(0) : metric.used.toLocaleString()} 
          <span className="text-[10px] text-[#9CA3AF] ml-1">/ {label === 'Storage' ? (metric.limit / (1024*1024)).toFixed(0) : metric.limit.toLocaleString()} {metric.unit}</span>
        </p>
      </div>
    </div>
  );
};

export const UsageStats: React.FC<{ summary: UsageSummary | null }> = ({ summary }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!summary) return null;

  const isWarning = summary.overallStatus === 'warning' || summary.overallStatus === 'exhausted';

  return (
    <div className="w-full max-w-[540px] bg-[#1F2329]/80 backdrop-blur-2xl rounded-[32px] border border-[#3A3F47] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="p-10">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter italic">Usage Stats</h2>
            <p className="text-xs text-[#9CA3AF] font-bold uppercase tracking-widest mt-1">Resource Consumption Engine</p>
          </div>
          <div className="px-4 py-2 bg-[#2B2F36] rounded-2xl border border-[#3A3F47] flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14]"></div>
             <span className="text-[10px] font-black text-white uppercase tracking-widest">{summary.tier} Plan</span>
          </div>
        </div>

        {/* Progress Grid */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <RadialProgress 
            label="Translation" 
            metric={summary.translation} 
            color={summary.translation.status === 'exhausted' ? '#EF4444' : '#007BFF'} 
          />
          <RadialProgress 
            label="Voice Calls" 
            metric={summary.calls} 
            color={summary.calls.status === 'exhausted' ? '#EF4444' : '#39FF14'} 
          />
          <RadialProgress 
            label="Storage" 
            metric={summary.storage} 
            color={summary.storage.status === 'exhausted' ? '#EF4444' : '#8B5CF6'} 
          />
        </div>

        {/* Alert System */}
        {isWarning && (
          <div className="relative group animate-in zoom-in duration-500">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#EF4444] to-[#F59E0B] rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-[#2B2F36] border border-[#EF4444]/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444] border border-[#EF4444]/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wide">Approaching Limit</h4>
                  <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Upgrade to avoid service interruption</p>
                </div>
              </div>
              <button className="whitespace-nowrap px-8 py-3 bg-[#39FF14] hover:bg-[#32e012] text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:scale-105 active:scale-95">
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="px-10 py-6 bg-[#2B2F36]/50 border-t border-[#3A3F47] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#007BFF] animate-pulse"></div>
          <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest italic">
            Network Status: <span className="text-white">Optimal</span>
          </p>
        </div>
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">NextGen Dash v4</p>
      </div>
    </div>
  );
};
