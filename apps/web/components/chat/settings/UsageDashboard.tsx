import React, { useState, useEffect } from 'react';
import { usageService } from '../../../../../packages/services/usage-service.ts';
import { UsageSummary, UsageMetric } from '../../../../../packages/types/index.ts';
import { Shield, Zap, TrendingUp } from 'lucide-react';

interface ProgressBarProps {
  label: string;
  metric: UsageMetric;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, metric }) => {
  const getStatusColor = (percent: number) => {
    if (percent >= 100) return '#EF4444'; 
    if (percent >= 80) return '#FFD700';  
    return '#39FF14';                    
  };

  const color = getStatusColor(metric.percentage);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end px-1">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">{label}</span>
          <span className="text-xs font-bold text-white/80">
            {label === 'Storage' ? (metric.used / (1024*1024)).toFixed(0) : metric.used.toLocaleString()} 
            <span className="text-white/30 ml-1">/ {label === 'Storage' ? (metric.limit / (1024*1024)).toFixed(0) : metric.limit.toLocaleString()} {metric.unit}</span>
          </span>
        </div>
        <span className="text-[10px] font-black" style={{ color }}>{metric.percentage}%</span>
      </div>
      <div className="h-2 w-full bg-[#2B2F36] rounded-full overflow-hidden border border-white/5">
        <div 
          className="h-full transition-all duration-1000 ease-out rounded-full"
          style={{ 
            width: `${Math.min(100, metric.percentage)}%`, 
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}44`
          }}
        />
      </div>
    </div>
  );
};

export const UsageDashboard: React.FC<{ userId: string }> = ({ userId }) => {
  const [summary, setSummary] = useState<UsageSummary | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      const data = await usageService.getUserUsageSummary(userId);
      setSummary(data);
    };
    fetchUsage();
  }, [userId]);

  if (!summary) return <div className="animate-pulse h-40 bg-white/5 rounded-3xl" />;

  const isWarning = summary.overallStatus === 'warning' || summary.overallStatus === 'exhausted';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#007BFF]/10 flex items-center justify-center text-[#007BFF]">
            <TrendingUp size={16} />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Neural Quota</h3>
        </div>
        <div className="px-3 py-1 bg-[#2B2F36] rounded-full border border-[#3A3F47] flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14]"></div>
          <span className="text-[9px] font-black text-white uppercase tracking-widest">{summary.tier} Plan</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ProgressBar label="Translation Chars" metric={summary.translation} />
        <ProgressBar label="Call Minutes" metric={summary.calls} />
        <ProgressBar label="Storage" metric={summary.storage} />
      </div>

      {isWarning && (
        <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl flex items-center gap-4 animate-in zoom-in">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-[#EF4444]/20 flex items-center justify-center text-[#EF4444]">
            <Shield size={20} />
          </div>
          <div className="flex-1">
            <h5 className="text-[10px] font-black text-[#EF4444] uppercase tracking-widest">Neural Exhaustion Imminent</h5>
            <p className="text-[9px] text-[#9CA3AF] uppercase font-bold tracking-tighter">Your limits are reaching capacity. Upgrade to prevent session loss.</p>
          </div>
          <button className="px-4 py-2 bg-[#EF4444] text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-600 transition-all shadow-lg">
            Upgrade
          </button>
        </div>
      )}

      <button className="w-full py-4 bg-gradient-to-r from-[#007BFF] to-blue-700 text-white rounded-2xl flex items-center justify-center gap-3 group transition-all hover:shadow-[0_10px_30px_rgba(0,123,255,0.3)] active:scale-95">
        <Zap size={18} className="group-hover:animate-pulse" />
        <span className="text-xs font-black uppercase tracking-[0.2em]">Upgrade to Premium</span>
      </button>
    </div>
  );
};