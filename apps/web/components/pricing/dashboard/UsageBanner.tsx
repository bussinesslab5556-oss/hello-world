import React, { useState, useEffect } from 'react';
import { usageService } from '../../../../../packages/services/usage-service.ts';
import { UsageSummary } from '../../../../../packages/types/index.ts';
import { AlertTriangle, ShieldAlert, ChevronDown, ChevronUp, Zap } from 'lucide-react';

export const UsageBanner: React.FC<{ userId: string }> = ({ userId }) => {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      const data = await usageService.getUserUsageSummary(userId);
      setSummary(data);
    };
    fetchUsage();
    const interval = setInterval(fetchUsage, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  if (!summary) return null;

  const { translation } = summary;
  const status = summary.overallStatus;
  const isBlocked = status === 'exhausted';
  const isWarning = status === 'warning';
  const effectivelyCollapsed = isBlocked ? false : isCollapsed;

  const getBannerStyles = () => {
    if (isBlocked) return 'bg-[#EF4444] text-white border-b border-white/10';
    if (isWarning) return 'bg-[#F59E0B] text-black border-b border-black/10';
    return 'bg-[#1F2329] text-[#9CA3AF] border-b border-white/5';
  };

  return (
    <div className={`transition-all duration-500 overflow-hidden ${getBannerStyles()}`}>
      <div className="px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isBlocked ? <ShieldAlert size={16} className="animate-pulse" /> : 
             isWarning ? <AlertTriangle size={16} /> : 
             <Zap size={14} className="text-[#007BFF]" />}
            
            <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isWarning ? 'text-black' : 'text-white'}`}>
                {isBlocked ? 'Neural Quota Blocked' : isWarning ? 'Approaching Limit' : 'Translation Usage'}
              </span>
              {!effectivelyCollapsed && (
                <span className={`text-[11px] font-bold ${isWarning ? 'text-black/70' : 'text-white/60'}`}>
                  {(translation.used / 1000).toFixed(0)}k / {(translation.limit / 1000000).toFixed(0)}M characters used
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(isWarning || isBlocked) && (
              <button className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                isWarning ? 'bg-black text-white hover:bg-black/80' : 'bg-white text-[#EF4444] hover:bg-white/90 shadow-lg'
              }`}>
                Upgrade
              </button>
            )}
            {!isBlocked && (
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`p-1 rounded-md hover:bg-white/10 transition-colors ${isWarning ? 'text-black' : 'text-white/40'}`}
              >
                {effectivelyCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            )}
          </div>
        </div>

        {!effectivelyCollapsed && (
          <div className="mt-3">
            <div className={`h-1.5 w-full rounded-full overflow-hidden ${isWarning ? 'bg-black/10' : 'bg-white/5'}`}>
              <div 
                className={`h-full transition-all duration-1000 ${
                  isBlocked ? 'bg-white' : isWarning ? 'bg-black' : 'bg-[#007BFF]'
                }`}
                style={{ width: `${Math.min(100, translation.percentage)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};