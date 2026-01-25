import React from 'react';
import { ProfileSection } from './ProfileSection.tsx';
import { UsageDashboard } from './UsageDashboard.tsx';
import { AIConfig } from './AIConfig.tsx';
import { Settings, LogOut, X, CreditCard } from 'lucide-react';
import { authService } from '../../../../../packages/services/auth-service.ts';

interface SettingsPageProps {
  userId: string;
  onClose: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ userId, onClose }) => {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] glass rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <header className="px-8 py-6 border-b border-white/5 bg-white/5 backdrop-blur-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#007BFF] flex items-center justify-center text-white shadow-lg">
              <Settings size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white italic tracking-tight uppercase">Control Center</h2>
              <p className="text-[9px] font-black text-[#9CA3AF] uppercase tracking-[0.4em]">Node Configuration v4.1</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left Column: Profile & AI */}
            <div className="space-y-16">
              <section>
                <div className="mb-8 px-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest italic underline decoration-[#007BFF] underline-offset-8">Neural Identity</h3>
                </div>
                <ProfileSection userId={userId} />
              </section>

              <section>
                <div className="mb-8 px-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest italic underline decoration-[#39FF14] underline-offset-8">Processing Logic</h3>
                </div>
                <AIConfig userId={userId} />
              </section>
            </div>

            {/* Right Column: Usage & Security */}
            <div className="space-y-16">
              <section>
                <div className="mb-8 px-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest italic underline decoration-[#007BFF] underline-offset-8">Resource Health</h3>
                </div>
                <UsageDashboard userId={userId} />
              </section>

              <section className="space-y-8">
                <div className="mb-8 px-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest italic underline decoration-[#EF4444] underline-offset-8">Security & billing</h3>
                </div>
                
                <div className="p-6 bg-[#2B2F36] rounded-3xl border border-white/5 flex items-center justify-between group transition-all hover:border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#007BFF]/10 flex items-center justify-center text-[#007BFF]">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Current Subscription</p>
                      <p className="text-sm font-black text-white uppercase">Free Tier Node</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-black text-[#007BFF] uppercase tracking-widest hover:text-white transition-colors">Manage</button>
                </div>

                <button 
                  onClick={() => {
                    authService.signOut();
                    window.location.reload();
                  }}
                  className="w-full py-4 bg-[#EF4444]/10 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/20 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 group font-black uppercase text-xs tracking-widest"
                >
                  <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                  Terminate Session
                </button>
              </section>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};